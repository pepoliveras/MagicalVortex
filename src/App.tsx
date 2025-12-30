
import React, { useState, useEffect } from 'react';
import { FsmState } from './types';
import type { GameState, Card, PlayerId, AbilityCard, Character, Language } from './types';
import { createInitialState, MAX_HAND_SIZE, shuffle, CHARACTERS, getAbilityByTag } from './constants';
import { calculateDirectDamage, calculateVortexDamage, getMaxLife } from './utils/gameLogic';
import { getAiLevelUpCards, getAiAbilityDiscard, getAiAttackCard, getAiDefenseCard } from './utils/aiLogic';
import GameBoard from './components/GameBoard';
import GameLog from './components/GameLog';
import EndGameEffects from './components/EndGameEffects';
import { TEXTS, getTransAbility, Translation } from './translations';

/**
 * APP COMPONENT (CONTROLLER)
 */

export const App: React.FC = () => {
  // Debug Log
  console.log("V2.7: Fixed Profile Image Scaling (Root) + UX Fixes");

  const [language, setLanguage] = useState<Language>('ca');
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedCardsForLevelUp, setSelectedCardsForLevelUp] = useState<string[]>([]);
  const [highlightedAbilityId, setHighlightedAbilityId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAbilityModal, setShowAbilityModal] = useState(false);
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);

  const charAffinity = gameState.players.PLAYER.character?.affinityColor || 'NEUTRAL';

  const currentTexts = TEXTS[language] || TEXTS['en'];
  if (!currentTexts) {
      return <div className="p-10 text-red-500 font-bold">Error loading translations. Please refresh.</div>;
  }
  const txt = currentTexts;
  const ui = txt.ui;

  const findFullAbilityDescription = (tag: string): string => {
      const defs = txt.abilityDefinitions;
      const categories: (keyof typeof defs)[] = ['neutral', 'white', 'black'];
      for (const cat of categories) {
          const levels = defs[cat].levels;
          for (const lvl of [1, 2, 3] as const) {
             const abilities = levels[lvl];
             const found = abilities.find(a => a.tag === tag);
             if (found) return found.desc;
          }
      }
      return getTransAbility(tag, language).desc;
  };

  const addLog = (state: GameState, message: string): string[] => {
    return [...state.gameLog, message];
  };

  // UX HELPER: Show temporary message instead of alert
  const showToast = (message: string) => {
      setGameState(prev => ({
          ...prev,
          uiMessage: `⚠️ ${message}`
      }));
      // Reset to default message after 3 seconds
      setTimeout(() => {
          setGameState(prev => {
              if (prev.uiMessage.startsWith('⚠️')) {
                  const defaultMsg = prev.currentPlayer === 'PLAYER' ? ui.player : ui.opponent;
                  return { ...prev, uiMessage: defaultMsg };
              }
              return prev;
          });
      }, 3000);
  };

  const executeGenericDiscard = (cardId: string) => {
      setGameState(prev => {
          const player = { ...prev.players.PLAYER };
          player.powerHand = [...player.powerHand];
          const cardIndex = player.powerHand.findIndex(c => c.id === cardId);
          if (cardIndex === -1) return prev;
          const discarded = player.powerHand.splice(cardIndex, 1)[0];
          return {
              ...prev,
              players: { ...prev.players, PLAYER: player },
              discardPile: [...prev.discardPile, discarded],
              fsmState: FsmState.MAIN_PHASE,
              pendingAction: { ...prev.pendingAction, attackingCard: null },
              gameLog: addLog(prev, txt.logs.discardedGeneric(discarded.value, discarded.color, discarded.type))
          };
      });
      setActiveCardId(null);
  };

  const executeAbilityDraw = (cardIdToDiscard: string) => {
      const cardToDiscard = gameState.players.PLAYER.powerHand.find(c => c.id === cardIdToDiscard);
      if (!cardToDiscard) return;
      const discardedVal = cardToDiscard.value;
      setGameState(prev => {
          const newPlayer = { ...prev.players.PLAYER };
          newPlayer.powerHand = [...newPlayer.powerHand];
          const discardIndex = newPlayer.powerHand.findIndex(c => c.id === cardIdToDiscard);
          if (discardIndex === -1) return prev;
          const discarded = newPlayer.powerHand.splice(discardIndex, 1)[0];
          return {
              ...prev,
              players: { ...prev.players, PLAYER: newPlayer },
              discardPile: [...prev.discardPile, discarded],
              pendingAction: { ...prev.pendingAction, attackingCard: null }
          };
      });
      setTimeout(() => {
          setGameState(prev => {
              const newPlayer = { ...prev.players.PLAYER };
              const playerAffinity = newPlayer.character?.affinityColor || 'NEUTRAL';
              const activeTags = newPlayer.activeAbilities.map(a => a.effectTag);
              const handTags = newPlayer.abilityHand.map(a => a.effectTag);
              const currentValidIndices = prev.abilityDeck
                .map((c, i) => {
                    if (c.level > newPlayer.level) return -1;
                    if (activeTags.includes(c.effectTag)) return -1;
                    if (handTags.includes(c.effectTag)) return -1;
                    if (playerAffinity !== 'NEUTRAL') {
                        if (c.affinity !== 'NEUTRAL' && c.affinity !== playerAffinity) return -1;
                    }
                    return i;
                })
                .filter(i => i !== -1);
              if (currentValidIndices.length === 0) return prev; 
              const drawIndexInValid = Math.floor(Math.random() * currentValidIndices.length);
              const deckIndex = currentValidIndices[drawIndexInValid];
              const newDeck = [...prev.abilityDeck];
              const newAbility = newDeck.splice(deckIndex, 1)[0];
              newPlayer.abilityHand = [newAbility, ...newPlayer.abilityHand];
              newPlayer.abilitiesDrawnThisTurn += 1;
              setHighlightedAbilityId(newAbility.id);
              return {
                  ...prev,
                  players: { ...prev.players, PLAYER: newPlayer },
                  abilityDeck: newDeck,
                  fsmState: FsmState.MAIN_PHASE,
                  gameLog: addLog(prev, txt.logs.discardToAct(0, getTransAbility(newAbility.effectTag, language).name).replace('0', discardedVal.toString()))
              };
          });
      }, 500);
      setActiveCardId(null);
  };

  const resolveCombat = () => {
      setGameState(prev => {
          const pending = prev.pendingAction;
          const attacker = prev.players[pending.attackerId!];
          const defender = prev.players[pending.targetId!];
          let result;
          if (pending.type === 'VORTEX_ATTACK') {
               const vIndex = pending.vortexCardIndex!;
               const vCard = prev.vortexCards[vIndex];
               if (!vCard) return { ...prev, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, vortexCardIndex: null } };
               result = calculateVortexDamage(pending.attackingCard!, vCard, attacker, defender, language);
          } else {
              if (pending.vortexDefenseIndex !== null) {
                  const vCard = prev.vortexCards[pending.vortexDefenseIndex];
                  if (!vCard) return { ...prev, fsmState: FsmState.RESOLVE_DIRECT_COMBAT, pendingAction: { ...prev.pendingAction, vortexDefenseIndex: null } };
                  result = calculateVortexDamage(pending.attackingCard!, vCard, attacker, defender, language);
                  result.logMessage = txt.logs.vortexDefensePrefix + result.logMessage;
              } else {
                  result = calculateDirectDamage(pending.attackingCard!, pending.defendingCard, attacker, defender, language);
              }
          }
          const newPlayers = { ...prev.players };
          if (result.targetId) {
              const targetId = result.targetId;
              const originalTarget = newPlayers[targetId];
              const newTarget = { 
                  ...originalTarget,
                  permanentShield: originalTarget.permanentShield ? { ...originalTarget.permanentShield } : null
              };
              newTarget.life = Math.max(0, newTarget.life - result.damage);
              if (result.shieldRemaining !== undefined && newTarget.permanentShield) {
                  newTarget.permanentShield.value = result.shieldRemaining;
                  if (newTarget.permanentShield.value <= 0) newTarget.permanentShield = null;
              }
              newPlayers[targetId] = newTarget;
          }
          if (pending.type === 'VORTEX_ATTACK' && pending.attackerId === 'PLAYER') {
               if (newPlayers.PLAYER === prev.players.PLAYER) newPlayers.PLAYER = { ...prev.players.PLAYER };
               newPlayers.PLAYER.vortexAttacksPerformed += 1;
          }
          return { ...prev, players: newPlayers, gameLog: [...prev.gameLog, result.logMessage], fsmState: FsmState.SHOWDOWN };
      });
  };

  const runAiDefenseLogic = () => {
      setGameState(prev => {
          const ai = prev.players.AI;
          const attackCard = prev.pendingAction.attackingCard!;
          const chosenDef = getAiDefenseCard(ai.powerHand, attackCard, prev.round, prev.players.PLAYER, ai);
          const logMsg = chosenDef ? txt.logs.defendWith(chosenDef.value, chosenDef.color) : txt.logs.noDef;
          return {
              ...prev, gameLog: addLog(prev, `AI: ${logMsg}`),
              pendingAction: { ...prev.pendingAction, defendingCard: chosenDef },
              fsmState: FsmState.RESOLVE_DIRECT_COMBAT
          };
      });
      setTimeout(resolveCombat, 1000);
  };

  const finalizeTurn = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      setGameState(prev => {
          const pending = prev.pendingAction;
          const newPlayers = { ...prev.players };
          let discardUpdate = [...prev.discardPile];
          let vortexUpdate = [...prev.vortexCards];
          let powerDeckUpdate = [...prev.powerDeck];
          if (pending.attackerId && pending.attackingCard) {
              newPlayers[pending.attackerId].powerHand = newPlayers[pending.attackerId].powerHand.filter(c => c.id !== pending.attackingCard?.id);
              discardUpdate.push(pending.attackingCard);
          }
          if (pending.targetId && pending.defendingCard) {
              newPlayers[pending.targetId].powerHand = newPlayers[pending.targetId].powerHand.filter(c => c.id !== pending.defendingCard?.id);
              discardUpdate.push(pending.defendingCard);
          }
          if (pending.vortexCardIndex !== null) {
              const oldVortex = vortexUpdate[pending.vortexCardIndex];
              if (oldVortex) discardUpdate.push(oldVortex);
              const newVortexCard = powerDeckUpdate.length > 0 ? powerDeckUpdate.pop() || null : null;
              vortexUpdate[pending.vortexCardIndex] = newVortexCard;
          }
          if (pending.vortexDefenseIndex !== null) {
              const oldVortex = vortexUpdate[pending.vortexDefenseIndex];
              if (oldVortex) discardUpdate.push(oldVortex);
              const newVortexCard = powerDeckUpdate.length > 0 ? powerDeckUpdate.pop() || null : null;
              vortexUpdate[pending.vortexDefenseIndex] = newVortexCard;
          }
          let nextFsm: FsmState;
          let currentPlayerOverride = prev.currentPlayer;
          if (prev.currentPlayer === 'PLAYER') {
             const wasVortexAttack = pending.type === 'VORTEX_ATTACK';
             const hasMasterVortex = newPlayers.PLAYER.activeAbilities.some(a => a.effectTag === 'MASTER_VORTEX');
             const handEmpty = newPlayers.PLAYER.powerHand.length === 0;
             if ((wasVortexAttack && !hasMasterVortex) || handEmpty) {
                 nextFsm = FsmState.START_TURN; 
                 currentPlayerOverride = 'AI';
             } else {
                 nextFsm = FsmState.MAIN_PHASE;
             }
          } else {
             nextFsm = FsmState.AI_TURN_LOGIC;
          }
          let status: 'PLAYING' | 'GAME_OVER' = 'PLAYING';
          let log = [...prev.gameLog];
          let winner: PlayerId | null = prev.winner;
          if (newPlayers.AI.life <= 0) {
              if (prev.round < 3) {
                  nextFsm = FsmState.ROUND_TRANSITION;
                  log.push(txt.ui.roundClear);
              } else {
                  status = 'GAME_OVER'; nextFsm = FsmState.GAME_OVER; winner = 'PLAYER'; 
                  log.push(txt.ui.finalVictory); log.push(txt.lore.win);
              }
          } else if (newPlayers.PLAYER.life <= 0) {
              status = 'GAME_OVER'; nextFsm = FsmState.GAME_OVER; winner = 'AI'; 
              log.push(txt.lore.loss);
          }
          return {
              ...prev, players: newPlayers, currentPlayer: currentPlayerOverride, winner: winner,
              discardPile: discardUpdate, vortexCards: vortexUpdate, powerDeck: powerDeckUpdate, gameLog: log,
              pendingAction: { type: null, attackerId: null, targetId: null, attackingCard: null, defendingCard: null, vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null },
              fsmState: nextFsm, gameStatus: status
          };
      });
      setActiveCardId(null);
      setSelectedCardsForLevelUp([]);
  };

  const startGame = () => {
    const freshState = createInitialState(1);
    setGameState({ ...freshState, gameStatus: 'PLAYING', fsmState: FsmState.PLAYER_CHOSE_CHAR, uiMessage: ui.chooseChar });
  };

  const startNextRound = () => {
      if (gameState.round >= 3) return;
      const nextRound = gameState.round + 1;
      const char = gameState.players.PLAYER.character;
      const freshState = createInitialState(nextRound);
      setGameState(prev => {
          if (char) {
             const playerStartAbility = getAbilityByTag(char.startingAbilityTag);
             if (playerStartAbility) {
               freshState.players.PLAYER.character = char;
               freshState.players.PLAYER.activeAbilities = [playerStartAbility];
               if (char.startingAbilityTag === 'MAGIC_KNOWLEDGE') freshState.players.PLAYER.maxHandSize += 1;
             }
             const availableChars = CHARACTERS.filter(c => c.id !== char.id);
             const aiChar = availableChars[Math.floor(Math.random() * availableChars.length)];
             const aiStartAbility = getAbilityByTag(aiChar.startingAbilityTag);
             if (aiStartAbility) {
               freshState.players.AI.character = aiChar;
               freshState.players.AI.activeAbilities = [aiStartAbility];
               if (aiChar.startingAbilityTag === 'MAGIC_KNOWLEDGE') freshState.players.AI.maxHandSize += 1;
             }
          }
          return { ...freshState, gameStatus: 'PLAYING', fsmState: FsmState.ROUND_TRANSITION, uiMessage: `${ui.round} ${nextRound}` };
      });
  };

  const handleCharacterSelect = (character: Character) => {
      const playerStartAbility = getAbilityByTag(character.startingAbilityTag)!;
      const availableChars = CHARACTERS.filter(c => c.id !== character.id);
      const aiChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      const aiStartAbility = getAbilityByTag(aiChar.startingAbilityTag)!;
      setGameState(prev => {
          const newState = { ...prev };
          newState.players.PLAYER.character = character;
          newState.players.PLAYER.activeAbilities = [playerStartAbility];
          if (character.startingAbilityTag === 'MAGIC_KNOWLEDGE') newState.players.PLAYER.maxHandSize += 1;
          newState.players.AI.character = aiChar;
          newState.players.AI.activeAbilities = [aiStartAbility];
          if (aiChar.startingAbilityTag === 'MAGIC_KNOWLEDGE') newState.players.AI.maxHandSize += 1;
          newState.fsmState = FsmState.ROUND_TRANSITION;
          newState.gameLog = addLog(prev, txt.logs.matchStart(character.name, aiChar.name));
          return newState;
      });
  };

  const handleCharacterInfoClick = (character: Character) => setViewingCharacter(character);

  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') return;
    const handleState = async () => {
      switch (gameState.fsmState) {
        case FsmState.START_GAME:
          setGameState(prev => {
            const deck = [...prev.powerDeck];
            const pHand = deck.splice(0, 5);
            const aiHand = deck.splice(0, 5);
            const vortex = [deck.pop() || null, deck.pop() || null, deck.pop() || null, deck.pop() || null];
            return { ...prev, fsmState: FsmState.START_TURN, powerDeck: deck, vortexCards: vortex,
              players: { ...prev.players, PLAYER: { ...prev.players.PLAYER, powerHand: pHand }, AI: { ...prev.players.AI, powerHand: aiHand } },
              gameLog: addLog(prev, txt.logs.handsDealt)
            };
          });
          break;
        case FsmState.START_TURN:
          const activeId = gameState.currentPlayer;
          setGameState(prev => ({ ...prev, fsmState: activeId === 'PLAYER' ? FsmState.DRAW_PHASE : FsmState.AI_TURN_LOGIC,
             uiMessage: `${activeId === 'PLAYER' ? ui.player : ui.opponent}`,
             gameLog: addLog(prev, txt.logs.turnStart(activeId)),
             pendingAction: { type: null, attackerId: null, targetId: null, attackingCard: null, defendingCard: null, vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null },
             players: { ...prev.players, [activeId]: { ...prev.players[activeId], usedAbilitiesThisTurn: [], attacksPerformed: 0, vortexAttacksPerformed: 0, vortexDefensesPerformed: 0, levelUpsPerformed: 0, abilitiesDrawnThisTurn: 0, isHandRevealed: false } }
          }));
          break;
        case FsmState.DRAW_PHASE:
           if (gameState.currentPlayer === 'PLAYER') {
             setTimeout(() => {
                setGameState(prev => {
                    const deck = [...prev.powerDeck];
                    const discard = [...prev.discardPile];
                    if (deck.length < MAX_HAND_SIZE) { const recycled = shuffle(discard); deck.push(...recycled); discard.length = 0; }
                    const player = { ...prev.players.PLAYER };
                    const needed = player.maxHandSize - player.powerHand.length;
                    if (needed > 0) {
                        const drawn = deck.splice(0, needed);
                        player.powerHand = [...player.powerHand, ...drawn];
                        return { ...prev, powerDeck: deck, discardPile: discard, players: { ...prev.players, PLAYER: player }, fsmState: FsmState.MAIN_PHASE, gameLog: addLog(prev, txt.logs.drewCards("Player", drawn.length)) };
                    }
                    return { ...prev, fsmState: FsmState.MAIN_PHASE, gameLog: addLog(prev, txt.logs.handFull) };
                });
             }, 500);
           }
           break;
        case FsmState.AI_TURN_LOGIC:
           setTimeout(() => {
             setGameState(prev => {
                 let ai = { ...prev.players.AI };
                 const round = prev.round;
                 let newAbilityDeck = [...prev.abilityDeck];
                 let newDiscardPile = [...prev.discardPile];
                 let logUpdate = [...prev.gameLog];
                 if (ai.attacksPerformed === 0) {
                     const deck = [...prev.powerDeck];
                     const needed = ai.maxHandSize - ai.powerHand.length;
                     if (needed > 0) {
                         const drawn = deck.splice(0, needed);
                         ai.powerHand = [...ai.powerHand, ...drawn];
                         return { ...prev, powerDeck: deck, players: { ...prev.players, AI: ai }, gameLog: addLog(prev, txt.logs.drewCards("AI", drawn.length)) };
                     }
                 }
                 if (ai.attacksPerformed === 0) {
                     const levelUpCards = getAiLevelUpCards(ai.powerHand, round, ai.level);
                     if (levelUpCards) { ai.powerHand = ai.powerHand.filter(c => !levelUpCards.includes(c)); ai.level += 1; ai.levelUpsPerformed += 1; if (ai.activeAbilities.some(a => a.effectTag === 'MAGIC_KNOWLEDGE')) ai.maxHandSize += 1; newDiscardPile = [...newDiscardPile, ...levelUpCards]; logUpdate.push(txt.logs.aiLevelsUp); }
                     const discardForAbil = getAiAbilityDiscard(ai.powerHand, round, ai.abilitiesDrawnThisTurn);
                     if (discardForAbil && newAbilityDeck.length > 0) {
                        const aiAffinity = ai.character?.affinityColor || 'NEUTRAL';
                        const activeTags = ai.activeAbilities.map(a => a.effectTag);
                        const handTags = ai.abilityHand.map(a => a.effectTag);
                        const validIndices = newAbilityDeck.map((c, i) => {
                           if (c.level > ai.level || activeTags.includes(c.effectTag) || handTags.includes(c.effectTag)) return -1;
                           if (aiAffinity !== 'NEUTRAL' && c.affinity !== 'NEUTRAL' && c.affinity !== aiAffinity) return -1;
                           return i;
                       }).filter(i => i !== -1);
                       if (validIndices.length > 0) {
                            const rndIndex = Math.floor(Math.random() * validIndices.length);
                            const deckIndex = validIndices[rndIndex];
                            const newAbility = newAbilityDeck.splice(deckIndex, 1)[0];
                            ai.powerHand = ai.powerHand.filter(c => c.id !== discardForAbil.id);
                            ai.abilityHand = [...ai.abilityHand, newAbility];
                            ai.abilitiesDrawnThisTurn += 1;
                            newDiscardPile.push(discardForAbil);
                            logUpdate.push(txt.logs.aiDrawsAbility);
                       }
                     }
                     const maxAbs = ai.character?.affinityColor === 'NEUTRAL' ? ai.level : ai.level + 1;
                     if (ai.activeAbilities.length < maxAbs && ai.abilityHand.length > 0) {
                         const playable = ai.abilityHand.find(a => a.level <= ai.level);
                         if (playable) { ai.abilityHand = ai.abilityHand.filter(a => a.id !== playable.id); ai.activeAbilities = [...ai.activeAbilities, playable]; if (playable.effectTag === 'MAGIC_KNOWLEDGE') ai.maxHandSize += ai.level; logUpdate.push(`${txt.ui.opponent} ${txt.ui.activate}: ${getTransAbility(playable.effectTag, language).name}`); }
                     }
                 }
                 const maxAttacks = 1 + ai.level;
                 if (ai.attacksPerformed < maxAttacks) {
                     const attackCard = getAiAttackCard(ai.powerHand, round, ai.attacksPerformed, maxAttacks);
                     if (attackCard) {
                         ai.attacksPerformed += 1;
                         const player = prev.players.PLAYER;
                         const playerHasDef = player.powerHand.some(c => c.type === 'DEF');
                         const canDefend = playerHasDef || (player.activeAbilities.some(a => a.effectTag === 'VORTEX_CONTROL') && player.vortexDefensesPerformed < 1);
                         const newState = { ...prev, players: { ...prev.players, AI: ai }, discardPile: newDiscardPile, abilityDeck: newAbilityDeck, gameLog: logUpdate, pendingAction: { type: 'DIRECT_ATTACK' as const, attackerId: 'AI' as PlayerId, targetId: 'PLAYER' as PlayerId, attackingCard: attackCard, defendingCard: null, vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null } };
                         newState.gameLog.push(txt.logs.aiAttacks(attackCard.value, attackCard.color, ai.attacksPerformed));
                         if (!canDefend) return { ...newState, fsmState: FsmState.RESOLVE_DIRECT_COMBAT };
                         else return { ...newState, fsmState: FsmState.AWAITING_PLAYER_DEFENSE };
                     }
                 }
                 logUpdate.push(txt.logs.aiEnds);
                 return { ...prev, currentPlayer: 'PLAYER', fsmState: FsmState.START_TURN, players: { ...prev.players, AI: ai }, discardPile: newDiscardPile, abilityDeck: newAbilityDeck, gameLog: logUpdate };
             });
           }, 1000);
           break;
         case FsmState.RESOLVE_DIRECT_COMBAT:
            if (gameState.currentPlayer === 'AI' && gameState.pendingAction.defendingCard === null) setTimeout(resolveCombat, 500);
            break;
         case FsmState.SHOWDOWN:
            setTimeout(() => finalizeTurn(), 3000);
            break;
      }
    };
    handleState();
  }, [gameState.fsmState, gameState.gameStatus, gameState.currentPlayer, gameState.players.AI.powerHand.length, gameState.players.AI.activeAbilities.length]);

  const handleCardClick = (card: Card, owner: 'PLAYER' | 'AI' | 'VORTEX', index?: number) => {
    if (highlightedAbilityId) setHighlightedAbilityId(null);
    const { fsmState, pendingAction, players } = gameState;
    if (fsmState === FsmState.SELECT_DISCARD_GENERIC && owner === 'PLAYER') { executeGenericDiscard(card.id); return; }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_DRAW && owner === 'PLAYER') { executeAbilityDraw(card.id); return; }
    if (fsmState === FsmState.SELECT_ATTACK_CARD && owner === 'PLAYER') {
        if (card.type !== 'ATK') return; 
        setGameState(prev => ({ ...prev, players: { ...prev.players, PLAYER: { ...prev.players.PLAYER, attacksPerformed: prev.players.PLAYER.attacksPerformed + 1 } }, fsmState: FsmState.AWAITING_AI_DEFENSE, pendingAction: { ...prev.pendingAction, type: 'DIRECT_ATTACK', attackerId: 'PLAYER', targetId: 'AI', attackingCard: card } }));
        setTimeout(runAiDefenseLogic, 1000);
        return;
    }
    if (fsmState === FsmState.MAIN_PHASE && owner === 'PLAYER') {
        if (activeCardId === card.id) { setActiveCardId(null); setGameState(prev => ({...prev, pendingAction: {...prev.pendingAction, attackingCard: null}})); }
        else { setActiveCardId(card.id); if (card.type === 'ATK') setGameState(prev => ({...prev, pendingAction: {...prev.pendingAction, attackingCard: card}})); else setGameState(prev => ({...prev, pendingAction: {...prev.pendingAction, attackingCard: null}})); }
    }
    if (fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP && owner === 'PLAYER') {
        let newSelection = [...selectedCardsForLevelUp];
        if (newSelection.includes(card.id)) newSelection = newSelection.filter(id => id !== card.id);
        else newSelection.push(card.id);
        setSelectedCardsForLevelUp(newSelection);
    }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            let logMsg = txt.logs.discardToAct(card.value, getTransAbility(ability.effectTag, language).name);
            if (ability.effectTag === 'MAGIC_WALL') { player.permanentShield = { value: card.value }; logMsg += " " + txt.logs.shieldSet(card.value); }
            else if (ability.effectTag === 'MAGIC_KNOWLEDGE') player.maxHandSize += player.level;
            player.activeAbilities = [...player.activeAbilities, ability];
            player.abilityHand = player.abilityHand.filter(a => a.id !== ability.id);
            return { ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null }, gameLog: addLog(prev, logMsg) };
        });
        return;
    }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_WALL && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.permanentShield = { value: card.value };
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            return { ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null }, gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, getTransAbility(ability.effectTag, language).name)} ${txt.logs.shieldSet(card.value)}`) };
        });
        return;
    }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_HEAL && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        if (ability.effectTag === 'LIGHT_AFFINITY' && card.color !== 'WHITE') { showToast(txt.warnings?.lightAffinityReq); return; }
        if (ability.effectTag === 'DARK_AFFINITY' && card.color !== 'BLACK') { showToast(txt.warnings?.darkAffinityReq); return; }
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            let healAmount = (ability.effectTag === 'MASTER_AFFINITY') ? card.value : Math.floor(card.value / 2) + player.level;
            const maxHP = getMaxLife(player);
            player.life = Math.min(maxHP, player.life + healAmount);
            player.usedAbilitiesThisTurn.push(ability.id);
            return { ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null }, gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, getTransAbility(ability.effectTag, language).name)} ${txt.logs.healed(healAmount)}`) };
        });
        return;
    }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_MIND && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            const ai = { ...prev.players.AI };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            const discardCount = player.level;
            let aiDiscardedCount = 0;
            if (discardCount > 0 && ai.powerHand.length > 0) {
                 for (let i = 0; i < discardCount; i++) {
                     if (ai.powerHand.length === 0) break;
                     const ridx = Math.floor(Math.random() * ai.powerHand.length);
                     const dCard = ai.powerHand.splice(ridx, 1)[0];
                     discards.push(dCard);
                     aiDiscardedCount++;
                 }
            }
            return { ...prev, players: { ...prev.players, PLAYER: player, AI: ai }, discardPile: discards, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null }, gameLog: addLog(prev, `${getTransAbility(ability.effectTag, language).name}: ${txt.logs.mindControl(card.value, aiDiscardedCount)}`) };
        });
        return;
    }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_VISION && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            player.isHandRevealed = true;
            return { ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null }, gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, getTransAbility(ability.effectTag, language).name)} ${txt.logs.visionActivated}`) };
        });
        return;
    }
    if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION && owner === 'PLAYER') {
         const ability = pendingAction.targetAbility;
         if (!ability) return;
         setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            return { ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.SELECT_TARGET_FOR_MODIFICATION, gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, getTransAbility(ability.effectTag, language).name)} ${txt.logs.selectTarget}`) };
         });
         return;
    }
    if (fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            const handIndex = player.powerHand.findIndex(c => c.id === card.id);
            if (handIndex === -1) return prev;
            const modCard = { ...player.powerHand[handIndex] };
            let logMsg = "";
            if (ability.effectTag === 'ELEMENTAL_CONTROL') { modCard.color = modCard.color === 'BLACK' ? 'WHITE' : 'BLACK'; logMsg = `${modCard.color}`; }
            else if (ability.effectTag === 'MAGIC_CONTROL') { modCard.type = modCard.type === 'ATK' ? 'DEF' : 'ATK'; logMsg = `${modCard.type}`; } 
            player.powerHand[handIndex] = modCard;
            return { ...prev, players: { ...prev.players, PLAYER: player }, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null }, gameLog: addLog(prev, txt.logs.changedCard(logMsg)) };
        });
        return;
    }
    if (fsmState === FsmState.MAIN_PHASE && owner === 'VORTEX' && gameState.pendingAction.attackingCard) {
        if (index === undefined) return;
        const hasMasterVortex = gameState.players.PLAYER.activeAbilities.some(a => a.effectTag === 'MASTER_VORTEX');
        if (gameState.players.PLAYER.vortexAttacksPerformed >= 1 && !hasMasterVortex) { showToast(txt.warnings?.vortexLimit); return; }
        setGameState(prev => ({ ...prev, fsmState: FsmState.RESOLVE_VORTEX_COMBAT, pendingAction: { ...prev.pendingAction, type: 'VORTEX_ATTACK', attackerId: 'PLAYER', targetId: 'AI', vortexCardIndex: index }, gameLog: addLog(prev, txt.logs.vortexAttack) }));
        setTimeout(resolveCombat, 500);
    }
    if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && owner === 'PLAYER' && card.type === 'DEF') { setGameState(prev => ({ ...prev, pendingAction: { ...prev.pendingAction, defendingCard: card } })); }
    if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && owner === 'VORTEX') {
        const hasVortexControl = gameState.players.PLAYER.activeAbilities.some(a => a.effectTag === 'VORTEX_CONTROL');
        if (!hasVortexControl) return;
        if (gameState.players.PLAYER.vortexDefensesPerformed >= 1) { showToast(txt.warnings?.vortexLimit || "Vortex Defense limit reached."); return; }
        if (index === undefined) return;
        setGameState(prev => {
            const newPlayer = { ...prev.players.PLAYER };
            newPlayer.vortexDefensesPerformed += 1;
            return { ...prev, players: { ...prev.players, PLAYER: newPlayer }, pendingAction: { ...prev.pendingAction, defendingCard: null, vortexDefenseIndex: index }, fsmState: FsmState.RESOLVE_DIRECT_COMBAT };
        });
        setTimeout(resolveCombat, 500);
    }
  };

  const handleAbilityClick = (ability: AbilityCard) => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.fsmState !== FsmState.MAIN_PHASE) return;
      if (gameState.players.PLAYER.level < ability.level) { showToast(txt.warnings?.levelTooLow); return; }
      const maxAbilities = charAffinity === 'NEUTRAL' ? gameState.players.PLAYER.level : gameState.players.PLAYER.level + 1;
      if (gameState.players.PLAYER.activeAbilities.length >= maxAbilities) { showToast(txt.warnings?.abilityLimitReached); return; }
      if (charAffinity !== 'NEUTRAL' && ability.affinity !== 'NEUTRAL' && ability.affinity !== charAffinity) { showToast(txt.warnings?.wrongAffinity); return; }
      if (gameState.players.PLAYER.activeAbilities.some(a => a.effectTag === ability.effectTag)) { showToast(`${getTransAbility(ability.effectTag, language).name}: ${txt.warnings?.alreadyActive}`); return; }
      setGameState(prev => {
          const player = { ...prev.players.PLAYER };
          player.activeAbilities = [...player.activeAbilities, ability];
          player.abilityHand = player.abilityHand.filter(a => a.id !== ability.id);
          if (ability.effectTag === 'MAGIC_KNOWLEDGE') player.maxHandSize += player.level;
          return { ...prev, players: { ...prev.players, PLAYER: player }, gameLog: addLog(prev, txt.logs.addedToZone(getTransAbility(ability.effectTag, language).name)), fsmState: FsmState.MAIN_PHASE };
      });
  };

  const handleActiveAbilityClick = (ability: AbilityCard) => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.fsmState !== FsmState.MAIN_PHASE) return;
      if (gameState.players.PLAYER.usedAbilitiesThisTurn.includes(ability.id)) { showToast(`${getTransAbility(ability.effectTag, language).name}: ${txt.warnings?.abilityUsed}`); return; }
      if (ability.effectTag === 'MAGIC_WALL') {
          const currentShield = gameState.players.PLAYER.permanentShield?.value || 0;
          if (currentShield > 0) { showToast(txt.warnings?.shieldActive); return; }
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_WALL, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(getTransAbility(ability.effectTag, language).name)) }));
      }
      else if (['LIGHT_AFFINITY', 'DARK_AFFINITY', 'MASTER_AFFINITY'].includes(ability.effectTag)) setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_HEAL, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(getTransAbility(ability.effectTag, language).name)) }));
      else if (ability.effectTag === 'MAGIC_VISION') setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_VISION, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(getTransAbility(ability.effectTag, language).name)) }));
      else if (ability.effectTag === 'MIND_CONTROL') setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_MIND, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(getTransAbility(ability.effectTag, language).name)) }));
      else if (['ELEMENTAL_CONTROL', 'MAGIC_CONTROL'].includes(ability.effectTag)) setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_MODIFICATION, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(getTransAbility(ability.effectTag, language).name)) }));
  };

  const handleDrawAbility = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.players.PLAYER.powerHand.length === 0) return;
      if (gameState.players.PLAYER.abilitiesDrawnThisTurn >= 1) { showToast(txt.warnings?.drawLimit); return; }
      const maxAbilities = charAffinity === 'NEUTRAL' ? gameState.players.PLAYER.level : gameState.players.PLAYER.level + 1;
      if (gameState.players.PLAYER.activeAbilities.length >= maxAbilities) { showToast(txt.warnings?.abilityLimitReached); return; }
      const player = gameState.players.PLAYER;
      const activeTags = player.activeAbilities.map(a => a.effectTag);
      const handTags = player.abilityHand.map(a => a.effectTag);
      const validIndices = gameState.abilityDeck.map((c, i) => {
            if (c.level > player.level) return -1;
            if (activeTags.includes(c.effectTag)) return -1;
            if (handTags.includes(c.effectTag)) return -1;
            if (charAffinity !== 'NEUTRAL' && c.affinity !== 'NEUTRAL' && c.affinity !== charAffinity) return -1;
            return i;
        }).filter(i => i !== -1);
      if (validIndices.length === 0) { setGameState(prev => ({ ...prev, gameLog: addLog(prev, txt.warnings?.noAbilities || "No abilities.") })); return; }
      if (activeCardId) executeAbilityDraw(activeCardId);
      else setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_DRAW }));
  };

  const handleDiscardAction = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (activeCardId) executeGenericDiscard(activeCardId);
      else setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_GENERIC }));
  };

  const handleLevelUp = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.players.PLAYER.level >= 3) { showToast(txt.warnings?.maxLevel); return; }
      if (gameState.players.PLAYER.levelUpsPerformed >= 1) { showToast(txt.warnings?.oneLevelPerTurn); return; }
      setActiveCardId(null);
      setSelectedCardsForLevelUp([]);
      setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_CARDS_FOR_LEVEL_UP, pendingAction: {...prev.pendingAction, attackingCard: null} }));
  };

  const handleConfirmLevelUp = () => {
      const selectedCards = gameState.players.PLAYER.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id));
      const sum = selectedCards.reduce((acc, c) => acc + c.value, 0);
      if (sum < 10) { showToast(txt.warnings?.selectSum); return; }
      setGameState(prev => {
          const newPlayer = { ...prev.players.PLAYER };
          newPlayer.powerHand = newPlayer.powerHand.filter(c => !selectedCardsForLevelUp.includes(c.id));
          const newDiscard = [...prev.discardPile, ...selectedCards];
          newPlayer.level += 1;
          newPlayer.levelUpsPerformed += 1;
          if (newPlayer.activeAbilities.some(a => a.effectTag === 'MAGIC_KNOWLEDGE')) newPlayer.maxHandSize += 1;
          return { ...prev, players: { ...prev.players, PLAYER: newPlayer }, discardPile: newDiscard, fsmState: FsmState.MAIN_PHASE, gameLog: addLog(prev, txt.logs.levelUp(newPlayer.level)) };
      });
      setSelectedCardsForLevelUp([]);
  };

  const handleCancelLevelUp = () => { setSelectedCardsForLevelUp([]); setGameState(prev => ({ ...prev, fsmState: FsmState.MAIN_PHASE })); };

  const handleCancel = () => {
      setGameState(prev => {
          let newLogs = [...prev.gameLog];
          if (prev.pendingAction.targetAbility) newLogs.push(txt.logs.actionCancelled(getTransAbility(prev.pendingAction.targetAbility.effectTag, language).name));
          else if (prev.fsmState === FsmState.SELECT_ATTACK_CARD) newLogs.push(txt.logs.actionCancelled(txt.ui.attackDirect));
          else if (prev.fsmState === FsmState.SELECT_DISCARD_GENERIC) newLogs.push(txt.logs.actionCancelled(txt.ui.discard));
          else if (prev.fsmState === FsmState.SELECT_DISCARD_FOR_DRAW) newLogs.push(txt.logs.actionCancelled(txt.ui.drawAbility));
          return { ...prev, fsmState: FsmState.MAIN_PHASE, pendingAction: { ...prev.pendingAction, targetAbility: null, attackingCard: null }, gameLog: newLogs };
      });
      setActiveCardId(null);
  };

  const handleConfirmAction = (action: string) => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (action === 'END_TURN') {
          if (gameState.fsmState === FsmState.MAIN_PHASE) { setGameState(prev => ({ ...prev, currentPlayer: 'AI', fsmState: FsmState.START_TURN, pendingAction: { ...prev.pendingAction, attackingCard: null } })); setSelectedCardsForLevelUp([]); setActiveCardId(null); }
      }
      if (action === 'ATTACK_DIRECT') {
          if (gameState.players.PLAYER.attacksPerformed >= (1 + gameState.players.PLAYER.level)) { showToast(txt.warnings?.maxAttacks); return; }
          if (!gameState.pendingAction.attackingCard) { setActiveCardId(null); setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_ATTACK_CARD })); return; }
          setGameState(prev => ({ ...prev, players: { ...prev.players, PLAYER: { ...prev.players.PLAYER, attacksPerformed: prev.players.PLAYER.attacksPerformed + 1 } }, fsmState: FsmState.AWAITING_AI_DEFENSE, pendingAction: { ...prev.pendingAction, type: 'DIRECT_ATTACK', attackerId: 'PLAYER', targetId: 'AI' } }));
          setTimeout(runAiDefenseLogic, 1000);
      }
      if (action === 'DEFEND_WITH_CARD') {
          if (gameState.pendingAction.vortexDefenseIndex !== null) setGameState(prev => { const newPlayer = { ...prev.players.PLAYER }; newPlayer.vortexDefensesPerformed += 1; return { ...prev, players: { ...prev.players, PLAYER: newPlayer }, fsmState: FsmState.RESOLVE_DIRECT_COMBAT }; });
          else setGameState(prev => ({ ...prev, fsmState: FsmState.RESOLVE_DIRECT_COMBAT }));
          setTimeout(resolveCombat, 500);
      }
      if (action === 'NO_DEFENSE') { setGameState(prev => ({ ...prev, pendingAction: { ...prev.pendingAction, defendingCard: null, vortexDefenseIndex: null }, fsmState: FsmState.RESOLVE_DIRECT_COMBAT })); setTimeout(resolveCombat, 500); }
  };

  const validTargetIds = selectedCardsForLevelUp;
  const maxAbilities = charAffinity === 'NEUTRAL' ? gameState.players.PLAYER.level : gameState.players.PLAYER.level + 1;
  const isAbilityFull = gameState.players.PLAYER.activeAbilities.length >= maxAbilities;

  let statusText = ui.waiting;
  if (gameState.fsmState === FsmState.SHOWDOWN) statusText = txt.ui.combatResolved;
  else if (gameState.fsmState === FsmState.SELECT_DISCARD_FOR_DRAW || gameState.fsmState === FsmState.SELECT_DISCARD_FOR_VISION || gameState.fsmState === FsmState.SELECT_DISCARD_FOR_WALL || gameState.fsmState === FsmState.SELECT_DISCARD_FOR_HEAL || gameState.fsmState === FsmState.SELECT_DISCARD_FOR_MIND || gameState.fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION) statusText = txt.warnings?.selectDiscardForDraw;
  else if (gameState.fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP) statusText = txt.warnings?.selectCardsForLevelUp;
  else if (gameState.fsmState === FsmState.SELECT_ATTACK_CARD) statusText = txt.warnings?.selectAttackToExec;
  else if (gameState.fsmState === FsmState.SELECT_DISCARD_GENERIC) statusText = txt.warnings?.selectDiscardGeneric;
  else if (gameState.pendingAction.attackingCard) statusText = `${txt.ui.attackWith} ${gameState.pendingAction.attackingCard.value}`;

  // ... (Rest of render logic remains largely the same, minus the alerts)
  // Ensure the UI message reflects the toast if active.

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-lato overflow-hidden relative">
      <EndGameEffects outcome={gameState.winner === 'PLAYER' ? 'VICTORY' : gameState.winner === 'AI' ? 'DEFEAT' : null} />

      {/* MODALS */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-800 border border-purple-500 rounded-xl p-6 max-w-lg shadow-2xl relative">
                <button onClick={() => setShowHistoryModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-2xl font-cinzel text-purple-300 mb-4 border-b border-purple-900/50 pb-2">{txt.lore.title}</h3>
                <div className="text-slate-300 text-sm leading-relaxed font-serif"><p className="mb-2">{txt.lore.p1}</p><p className="mb-2">{txt.lore.p2}</p><p>{txt.lore.p3}</p></div>
                <div className="mt-6 text-center"><button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded border border-purple-500">{ui.closeHistory}</button></div>
            </div>
        </div>
      )}

      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-800 border border-yellow-500 rounded-xl p-6 max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setShowRulesModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-2xl font-cinzel text-yellow-400 mb-4 border-b border-yellow-900/50 pb-2">{txt.rules.title}</h3>
                <div className="space-y-4 text-slate-300 text-sm leading-relaxed"><section><h4 className="text-yellow-200 font-bold uppercase text-xs mb-1">{txt.rules.goal.title}</h4><p>{txt.rules.goal.text}</p></section><section><h4 className="text-yellow-200 font-bold uppercase text-xs mb-1">{txt.rules.cards.title}</h4><p>{txt.rules.cards.text}</p></section><section><h4 className="text-yellow-200 font-bold uppercase text-xs mb-1">{txt.rules.combat.title}</h4><p>{txt.rules.combat.text}</p></section><section><h4 className="text-yellow-200 font-bold uppercase text-xs mb-1">{txt.rules.vortex.title}</h4><p>{txt.rules.vortex.text}</p></section><section><h4 className="text-yellow-200 font-bold uppercase text-xs mb-1">{txt.rules.leveling.title}</h4><p>{txt.rules.leveling.text}</p></section><section><h4 className="text-yellow-200 font-bold uppercase text-xs mb-1">{txt.rules.abilities.title}</h4><p>{txt.rules.abilities.text}</p></section></div>
                <div className="mt-6 text-center"><button onClick={() => setShowRulesModal(false)} className="px-4 py-2 bg-yellow-900 hover:bg-yellow-800 text-yellow-100 rounded border border-yellow-500">{ui.closeRules}</button></div>
            </div>
        </div>
      )}

      {showAbilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
             <div className="bg-slate-900 border-2 border-indigo-600 rounded-xl p-6 max-w-5xl w-full shadow-2xl relative my-8 h-[80vh] overflow-hidden flex flex-col">
                <button onClick={() => setShowAbilityModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-3xl font-cinzel text-indigo-400 mb-4 text-center border-b border-indigo-900 pb-2 shrink-0">{ui.abilityGuide}</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-indigo-900">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><h4 className="text-slate-200 font-bold mb-4 uppercase tracking-wider border-b border-slate-600 pb-1 text-center">{txt.abilityDefinitions.neutral.title}</h4><div className="space-y-6">{[1, 2, 3].map(lvl => { const items = txt.abilityDefinitions.neutral.levels[lvl as 1|2|3]; return ( <div key={lvl}><h5 className="text-xs text-slate-500 uppercase font-bold mb-2 ml-1">Level {lvl}</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{items.map((ability, i) => ( <div key={i} className="bg-slate-900 border border-slate-600 rounded-lg p-3 flex flex-col gap-2 hover:bg-slate-800 transition-colors"><div className="flex items-center gap-2 border-b border-slate-700 pb-1"><span className="text-2xl">{ability.icon}</span><span className="font-bold text-slate-200 text-sm">{ability.name}</span><span className="text-[10px] bg-slate-700 px-1.5 rounded text-slate-300 ml-auto uppercase">{ability.type}</span></div><p className="text-xs text-slate-400 leading-relaxed">{ability.desc}</p></div> ))}</div></div> ); })}</div></div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-yellow-200/20"><h4 className="text-yellow-200 font-bold mb-4 uppercase tracking-wider border-b border-yellow-900/30 pb-1 text-center">{txt.abilityDefinitions.white.title}</h4><div className="space-y-6">{[1, 2, 3].map(lvl => { const items = txt.abilityDefinitions.white.levels[lvl as 1|2|3]; if (!items.length) return null; return ( <div key={lvl}><h5 className="text-xs text-yellow-500/50 uppercase font-bold mb-2 ml-1">Level {lvl}</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{items.map((ability, i) => ( <div key={i} className="bg-slate-900 border border-yellow-900/40 rounded-lg p-3 flex flex-col gap-2 hover:bg-yellow-900/10 transition-colors"><div className="flex items-center gap-2 border-b border-yellow-900/30 pb-1"><span className="text-2xl">{ability.icon}</span><span className="font-bold text-yellow-100 text-sm">{ability.name}</span><span className="text-[10px] bg-yellow-900/30 px-1.5 rounded text-yellow-200 ml-auto uppercase">{ability.type}</span></div><p className="text-xs text-yellow-100/70 leading-relaxed">{ability.desc}</p></div> ))}</div></div> ); })}</div></div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-900/50"><h4 className="text-purple-400 font-bold mb-4 uppercase tracking-wider border-b border-purple-900/30 pb-1 text-center">{txt.abilityDefinitions.black.title}</h4><div className="space-y-6">{[1, 2, 3].map(lvl => { const items = txt.abilityDefinitions.black.levels[lvl as 1|2|3]; if (!items.length) return null; return ( <div key={lvl}><h5 className="text-xs text-purple-500/50 uppercase font-bold mb-2 ml-1">Level {lvl}</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{items.map((ability, i) => ( <div key={i} className="bg-slate-900 border border-purple-900/40 rounded-lg p-3 flex flex-col gap-2 hover:bg-purple-900/10 transition-colors"><div className="flex items-center gap-2 border-b border-purple-900/30 pb-1"><span className="text-2xl">{ability.icon}</span><span className="font-bold text-purple-200 text-sm">{ability.name}</span><span className="text-[10px] bg-purple-900/30 px-1.5 rounded text-purple-300 ml-auto uppercase">{ability.type}</span></div><p className="text-xs text-purple-200/70 leading-relaxed">{ability.desc}</p></div> ))}</div></div> ); })}</div></div>
                </div>
                <div className="mt-4 text-center shrink-0"><button onClick={() => setShowAbilityModal(false)} className="px-6 py-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 rounded border border-indigo-500 font-bold">{ui.closeGuide}</button></div>
            </div>
        </div>
      )}

      {viewingCharacter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-xl p-6 max-w-xl shadow-2xl relative flex flex-col items-center max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900">
                <button onClick={() => setViewingCharacter(null)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                
                <div className="text-6xl mb-2 animate-bounce">{viewingCharacter.avatar}</div>
                <h3 className="text-3xl font-cinzel text-purple-300 mb-2">{viewingCharacter.name}</h3>
                
                <div className="flex gap-2 mb-4">
                    <div className={`text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 ${viewingCharacter.affinityColor === 'WHITE' ? 'text-yellow-400' : viewingCharacter.affinityColor === 'BLACK' ? 'text-purple-400' : 'text-slate-400'}`}>
                        {viewingCharacter.affinityColor} Affinity
                    </div>
                </div>

                {/* Character Profile Image - positioned below Affinity and above Lore */}
                <div className="w-full aspect-[4/3] mb-4 rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl flex items-center justify-center">
                    <img 
                        src={`/images/characters/${viewingCharacter.name}_char_profile.jpg`} 
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            const container = e.currentTarget.parentElement;
                            if (container) container.style.display = 'none';
                        }}
                    />
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 w-full mb-4">
                    <h4 className="text-purple-400 text-xs font-bold uppercase mb-2 border-b border-purple-900/30 pb-1">Lore</h4>
                    <p className="text-slate-300 text-sm leading-relaxed font-serif italic text-justify">{txt.characterLore[viewingCharacter.id]}</p>
                </div>
                
                <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30 w-full">
                     <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2 border-b border-indigo-900/30 pb-1">Starting Ability</h4>
                     {(() => {
                         const ability = getAbilityByTag(viewingCharacter.startingAbilityTag);
                         if (!ability) return null;
                         const trans = getTransAbility(ability.effectTag, language);
                         return ( <div><div className="text-indigo-200 font-bold text-sm flex items-center gap-2"><span className="text-lg">{ability.icon}</span>{trans.name}</div><div className="text-indigo-300/80 text-xs mt-2 leading-relaxed italic border-l-2 border-indigo-500 pl-2">{findFullAbilityDescription(ability.effectTag)}</div></div> );
                     })()}
                </div>

                <div className="mt-6 text-center"><button onClick={() => setViewingCharacter(null)} className="px-6 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded border border-purple-500 transition-colors font-cinzel">{ui.closeHistory}</button></div>
            </div>
        </div>
      )}

      <header className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg z-10 shrink-0"><h1 className="text-2xl text-purple-400 tracking-widest font-bold font-cinzel">MAGICAL VORTEX</h1><div className="text-sm text-slate-400 animate-fade-in">{gameState.uiMessage}</div></header>

      <main className="h-full p-2 max-w-screen-2xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-4 z-10 overflow-y-auto lg:overflow-hidden">
        <div className="lg:col-span-3 flex flex-col gap-4 h-auto lg:h-full lg:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-1">
            {gameState.gameStatus === 'PRE_GAME' && (
                <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 p-4"><div className="text-center max-w-2xl flex flex-col items-center"><h2 className="text-5xl font-cinzel text-purple-400 mb-6 drop-shadow-lg">{ui.enterVortex}</h2><div className="bg-slate-900/80 p-6 rounded-lg border border-purple-500/30 shadow-inner mb-8 max-w-lg"><p className="text-slate-300 font-serif italic text-sm leading-relaxed mb-2">{txt.lore.p1}</p><p className="text-slate-400 font-serif italic text-xs">{txt.lore.p3}</p></div><div className="flex gap-4 mb-6"><button onClick={() => setLanguage('en')} className={`text-2xl hover:scale-125 transition-transform ${language === 'en' ? 'scale-125' : 'opacity-50'}`}>ENG</button><button onClick={() => setLanguage('es')} className={`text-2xl hover:scale-125 transition-transform ${language === 'es' ? 'scale-125' : 'opacity-50'}`}>ESP</button><button onClick={() => setLanguage('ca')} className={`text-2xl hover:scale-125 transition-transform ${language === 'ca' ? 'scale-125' : 'opacity-50'}`}>CAT</button></div><div className="flex gap-4 flex-wrap justify-center"><button onClick={startGame} className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-4 px-10 rounded-lg shadow-xl border border-purple-400 transition-all transform hover:scale-105">{ui.startGame}</button><button onClick={() => setShowRulesModal(true)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 px-6 rounded-lg shadow-lg border border-slate-500 transition-all">{ui.readRules}</button><button onClick={() => setShowAbilityModal(true)} className="bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 font-bold py-4 px-6 rounded-lg shadow-lg border border-indigo-500 transition-all">{ui.abilityGuide}</button></div></div></div>
            )}
            {gameState.fsmState === FsmState.PLAYER_CHOSE_CHAR && (
                <div className="flex-1 p-6 bg-slate-800 rounded-xl border border-slate-700 overflow-y-auto"><h2 className="text-3xl font-cinzel text-center text-white mb-8">{ui.chooseChar}</h2><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{CHARACTERS.map(char => { const abName = getTransAbility(char.startingAbilityTag, language).name; return ( <div key={char.id} onClick={() => handleCharacterSelect(char)} className="bg-slate-900 border-slate-600 p-4 rounded-xl border-2 hover:border-blue-400 hover:scale-105 transition-all cursor-pointer flex flex-col items-center gap-2 group relative"><button onClick={(e) => { e.stopPropagation(); handleCharacterInfoClick(char); }} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors text-lg z-20">ℹ️</button><div className="text-5xl group-hover:animate-bounce mt-2">{char.avatar}</div><div className="font-bold text-lg font-cinzel text-white text-center leading-tight">{char.name}</div><div className="mt-2 flex flex-col items-center gap-1 w-full"><div className={`text-[10px] font-bold px-2 py-0.5 rounded w-full text-center uppercase tracking-wider ${char.affinityColor === 'WHITE' ? 'bg-slate-200 text-slate-800' : char.affinityColor === 'BLACK' ? 'bg-black text-slate-200' : 'bg-slate-600 text-slate-300'}`}>{char.affinityColor}</div><div className="text-[9px] bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded w-full text-center border border-indigo-500/30 truncate flex items-center justify-center gap-1"><span>{getAbilityByTag(char.startingAbilityTag)?.icon}</span>{abName}</div></div></div> ); })}</div></div>
            )}
            {gameState.gameStatus === 'GAME_OVER' && (
                 <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 relative z-20"><div className="flex flex-col items-center p-8 bg-slate-900/90 backdrop-blur-xl rounded-xl border-2 border-slate-500 shadow-2xl relative z-50 w-full max-w-[95vw]"><h2 className={`text-6xl font-cinzel mb-8 font-bold tracking-wider drop-shadow-md ${gameState.winner === 'PLAYER' ? 'text-yellow-400' : 'text-red-500'}`}>{gameState.winner === 'PLAYER' ? ui.victory : ui.defeat}</h2><button onClick={startGame} className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold py-4 px-12 rounded-lg shadow-lg border border-slate-400 transition-all hover:scale-105 uppercase tracking-widest text-lg cursor-pointer">{ui.playAgain}</button></div></div>
            )}
            {gameState.fsmState === FsmState.ROUND_TRANSITION && (
                 <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 relative z-20"><div className="text-center p-8 bg-slate-900/80 backdrop-blur-md rounded-xl border border-orange-500 shadow-2xl w-full max-w-4xl">{gameState.players.AI.life > 0 ? ( <><h2 className="text-5xl font-cinzel mb-4 text-orange-400">{ui.enterVortex}</h2><div className="text-3xl font-bold mb-2 text-white">{ui.round} {gameState.round}</div><div className="text-xl text-orange-200 mb-6 font-cinzel tracking-widest border-b border-orange-500/30 pb-2 inline-block px-8">{gameState.round === 1 ? ui.levelBeg : gameState.round === 2 ? ui.levelInt : ui.levelAdv}</div><button onClick={() => setGameState(prev => ({ ...prev, fsmState: FsmState.START_GAME }))} className="bg-orange-700 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg border border-orange-500 transition-all hover:scale-105">{ui.confirm}</button></> ) : ( <><h2 className="text-5xl font-cinzel mb-4 text-orange-400">{ui.roundClear}</h2><div className="text-3xl font-bold mb-8 text-white">{ui.round} {gameState.round} ➔ {gameState.round + 1}</div><button onClick={startNextRound} className="bg-orange-700 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg border border-orange-500 transition-all">{ui.nextRound}</button></> )}</div></div>
            )}
            {gameState.gameStatus === 'PLAYING' && !([FsmState.PLAYER_CHOSE_CHAR, FsmState.ROUND_TRANSITION] as FsmState[]).includes(gameState.fsmState) && (
                <>
                  <GameBoard ai={gameState.players.AI} player={gameState.players.PLAYER} vortexCards={gameState.vortexCards} fsmState={gameState.fsmState} pendingAction={gameState.pendingAction} onCardClick={handleCardClick} onAbilityClick={handleAbilityClick} onActiveAbilityClick={handleActiveAbilityClick} onCharacterClick={handleCharacterInfoClick} selectedCardId={gameState.pendingAction.attackingCard?.id || gameState.pendingAction.defendingCard?.id || null} activeCardId={activeCardId} selectedAbilityId={gameState.pendingAction.targetAbility?.id || null} validTargetIds={selectedCardsForLevelUp} language={language} highlightedAbilityId={highlightedAbilityId} round={gameState.round} />
                  <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-4 mt-auto">
                    <div className="flex gap-4 items-center min-h-[60px] flex-wrap justify-center">
                      {gameState.fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP && (
                        <>
                          <div className="text-yellow-400 font-mono text-sm mr-2">SUM: {gameState.players.PLAYER.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id)).reduce((a, b) => a + b.value, 0)}</div>
                          <button onClick={handleConfirmLevelUp} className="flex-1 min-w-[120px] px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold">{ui.confirm}</button>
                          <button onClick={() => setGameState(prev => ({ ...prev, fsmState: FsmState.MAIN_PHASE }))} className="flex-1 min-w-[120px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold">{ui.cancel}</button>
                        </>
                      )}
                      {gameState.fsmState === FsmState.MAIN_PHASE && (
                        <>
                          {!isAbilityFull && (
                            <button onClick={handleDrawAbility} disabled={gameState.players.PLAYER.powerHand.length === 0 || gameState.players.PLAYER.abilitiesDrawnThisTurn >= 1} className="flex-1 min-w-[120px] px-3 py-1 bg-indigo-900/50 text-indigo-200 border border-indigo-700 rounded text-xs hover:bg-indigo-800 disabled:opacity-50">{ui.drawAbility}</button>
                          )}
                          {gameState.players.PLAYER.level < 3 && gameState.players.PLAYER.levelUpsPerformed < 1 && (
                            <button onClick={handleLevelUp} className="flex-1 min-w-[120px] px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold">{ui.levelUp}</button>
                          )}
                          <button onClick={() => handleConfirmAction('ATTACK_DIRECT')} disabled={gameState.players.PLAYER.attacksPerformed >= (1 + gameState.players.PLAYER.level)} className="flex-1 min-w-[120px] px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded font-bold disabled:opacity-50">{ui.attackDirect}</button>
                          <button onClick={handleDiscardAction} className="flex-1 min-w-[120px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-slate-200 rounded font-bold">{ui.discard}</button>
                          <button onClick={() => handleConfirmAction('END_TURN')} className="flex-1 min-w-[120px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold">{ui.endTurn}</button>
                        </>
                      )}
                      {gameState.fsmState === FsmState.AWAITING_PLAYER_DEFENSE && (
                        <>
                          <button onClick={() => handleConfirmAction('DEFEND_WITH_CARD')} disabled={!gameState.pendingAction.defendingCard && gameState.pendingAction.vortexDefenseIndex === null} className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold disabled:opacity-50">{ui.confirmDef}</button>
                          <button onClick={() => handleConfirmAction('NO_DEFENSE')} className="flex-1 min-w-[120px] px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded font-bold">{ui.takeDmg}</button>
                        </>
                      )}
                    </div>
                  </section>
                </>
            )}
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4 h-auto lg:h-full lg:overflow-hidden shrink-0"><section className="h-auto lg:h-full bg-slate-800 rounded-xl border border-slate-700 shadow-md flex flex-col overflow-hidden relative"><div className="relative lg:absolute inset-0 flex flex-col p-1"><GameLog logs={gameState.gameLog} currentAction={statusText} /></div></section><section className="shrink-0 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-md text-[11px] leading-tight text-slate-400 font-mono"><h4 className="font-bold text-slate-200 mb-2 text-xs uppercase border-b border-slate-600 pb-1">{ui.quickRules}</h4><ul className="space-y-1.5 list-disc list-inside mb-3">{ui.rulesList.map((r, i) => <li key={i}>{r}</li>)}</ul><div className="pt-2 border-t border-slate-700 text-center flex flex-col gap-2"><button onClick={() => setShowRulesModal(true)} className="bg-slate-700/50 hover:bg-slate-700 text-yellow-500 py-1.5 rounded transition-colors text-xs font-bold font-cinzel tracking-wider border border-slate-600">{ui.readRules}</button><button onClick={() => setShowHistoryModal(true)} className="bg-slate-700/50 hover:bg-slate-700 text-purple-400 py-1.5 rounded transition-colors text-xs font-bold font-cinzel tracking-wider border border-slate-600">{ui.readLore}</button><button onClick={() => setShowAbilityModal(true)} className="bg-slate-700/50 hover:bg-slate-700 text-indigo-400 py-1.5 rounded transition-colors text-xs font-bold font-cinzel tracking-wider border border-slate-600">{ui.abilityGuide}</button></div></section></div>
      </main>
    </div>
  );
};
