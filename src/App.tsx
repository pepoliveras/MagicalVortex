

import React, { useState, useEffect } from 'react';
import { FsmState } from './types';
import type { GameState, Card, PlayerId, AbilityCard, Character, Language } from './types';
import { createInitialState, MAX_HAND_SIZE, shuffle, CHARACTERS, getAbilityByTag } from './constants';
import { calculateDirectDamage, calculateVortexDamage, getMaxLife } from './utils/gameLogic';
import GameBoard from './components/GameBoard';
import GameLog from './components/GameLog';
import EndGameEffects from './components/EndGameEffects';
import { TEXTS, getTransAbility } from './translations';

/**
 * APP COMPONENT (CONTROLLER)
 * This is the heart of the application. It handles:
 * 1. Global Game State
 * 2. The Game Loop (useEffect)
 * 3. User Interactions (Clicks)
 * 4. AI Logic
 * 5. Combat Resolution
 */

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ca');
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  
  // NEW: Track the single active card for Main Phase
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // NEW: Dedicated selection array only for Level Up mode
  const [selectedCardsForLevelUp, setSelectedCardsForLevelUp] = useState<string[]>([]);
  
  // NEW: Track momentarily highlighted ability (e.g., when just drawn)
  const [highlightedAbilityId, setHighlightedAbilityId] = useState<string | null>(null);
  
  // NEW: State for History Popup
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // NEW: State for Rules Popup
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  // NEW: State for Character Lore Modal
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);

  // Shortcut for text access
  const txt = TEXTS[language];
  const ui = txt.ui;

  // --- HELPER: ADD LOG ---
  // Appends a message to the game log for the UI
  const addLog = (state: GameState, message: string): string[] => {
    return [...state.gameLog, message];
  };

  // --- HELPER: GENERIC DISCARD ---
  const executeGenericDiscard = (cardId: string) => {
      setGameState(prev => {
          const player = { ...prev.players.PLAYER };
          const cardIndex = player.powerHand.findIndex(c => c.id === cardId);
          if (cardIndex === -1) return prev;
          const discarded = player.powerHand.splice(cardIndex, 1)[0];
          
          return {
              ...prev,
              players: { ...prev.players, PLAYER: player },
              discardPile: [...prev.discardPile, discarded],
              fsmState: FsmState.MAIN_PHASE,
              pendingAction: { ...prev.pendingAction, attackingCard: null }, // Clear selection
              gameLog: addLog(prev, txt.logs.discardedGeneric(discarded.value, discarded.color, discarded.type))
          };
      });
      setActiveCardId(null);
  };

  // --- HELPER: EXECUTE DRAW ABILITY ---
  // Re-used for both Immediate Draw (Card pre-selected) and Delayed Draw (Card clicked later)
  const executeAbilityDraw = (cardIdToDiscard: string) => {
      // Capture discarded value before state update to ensure it's available for the delayed log
      const cardToDiscard = gameState.players.PLAYER.powerHand.find(c => c.id === cardIdToDiscard);
      if (!cardToDiscard) return;
      const discardedVal = cardToDiscard.value;

      setGameState(prev => {
          // PHASE 1: DISCARD
          const newPlayer = { ...prev.players.PLAYER };
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

      // PHASE 2: DRAW NEW ABILITY (Delayed for effect)
      setTimeout(() => {
          setGameState(prev => {
              const newPlayer = { ...prev.players.PLAYER };
              // Re-calculate valid indices
              const activeTags = newPlayer.activeAbilities.map(a => a.effectTag);
              const handTags = newPlayer.abilityHand.map(a => a.effectTag);
              
              const currentValidIndices = prev.abilityDeck
                .map((c, i) => {
                    if (c.level > newPlayer.level) return -1;
                    if (activeTags.includes(c.effectTag)) return -1;
                    if (handTags.includes(c.effectTag)) return -1;
                    return i;
                })
                .filter(i => i !== -1);
                
              if (currentValidIndices.length === 0) return prev; 

              const drawIndexInValid = Math.floor(Math.random() * currentValidIndices.length);
              const deckIndex = currentValidIndices[drawIndexInValid];
              const newDeck = [...prev.abilityDeck];
              const newAbility = newDeck.splice(deckIndex, 1)[0];
              const abTrans = getTransAbility(newAbility.effectTag, language);
              
              newPlayer.abilityHand = [newAbility, ...newPlayer.abilityHand];
              newPlayer.abilitiesDrawnThisTurn += 1;

              setHighlightedAbilityId(newAbility.id);

              return {
                  ...prev,
                  players: { ...prev.players, PLAYER: newPlayer },
                  abilityDeck: newDeck,
                  fsmState: FsmState.MAIN_PHASE, // Return to main phase
                  gameLog: addLog(prev, txt.logs.discardToAct(0, abTrans.name).replace('0', discardedVal.toString()))
              };
          });
      }, 500);

      // Clean up selection states
      setActiveCardId(null);
  };

  // --- STARTUP LOGIC ---
  const startGame = () => {
    const freshState = createInitialState();
    setGameState({
        ...freshState,
        gameStatus: 'PLAYING',
        fsmState: FsmState.PLAYER_CHOSE_CHAR,
        uiMessage: ui.chooseChar
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
          if (character.startingAbilityTag === 'MAGIC_KNOWLEDGE') {
              newState.players.PLAYER.maxHandSize += 1;
          }
          newState.players.AI.character = aiChar;
          newState.players.AI.activeAbilities = [aiStartAbility];
          if (aiChar.startingAbilityTag === 'MAGIC_KNOWLEDGE') {
              newState.players.AI.maxHandSize += 1;
          }
          newState.fsmState = FsmState.START_GAME;
          const pName = character.name;
          const aiName = aiChar.name;
          newState.gameLog = addLog(prev, txt.logs.matchStart(pName, aiName));
          return newState;
      });
  };

  const handleCharacterInfoClick = (character: Character) => {
      setViewingCharacter(character);
  };

  // --- GAME LOOP / EFFECT HOOK ---
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
            return {
              ...prev,
              fsmState: FsmState.START_TURN,
              powerDeck: deck,
              vortexCards: vortex,
              players: {
                ...prev.players,
                PLAYER: { ...prev.players.PLAYER, powerHand: pHand },
                AI: { ...prev.players.AI, powerHand: aiHand }
              },
              gameLog: addLog(prev, txt.logs.handsDealt)
            };
          });
          break;

        case FsmState.START_TURN:
          const activeId = gameState.currentPlayer;
          setGameState(prev => ({
             ...prev,
             fsmState: activeId === 'PLAYER' ? FsmState.DRAW_PHASE : FsmState.AI_TURN_LOGIC,
             uiMessage: `${activeId === 'PLAYER' ? ui.player : ui.opponent}`,
             gameLog: addLog(prev, txt.logs.turnStart(activeId)),
             pendingAction: { 
                 type: null, attackerId: null, targetId: null, attackingCard: null, 
                 defendingCard: null, vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null 
             },
             players: {
                 ...prev.players,
                 [activeId]: { 
                     ...prev.players[activeId], 
                     usedAbilitiesThisTurn: [],
                     attacksPerformed: 0,
                     vortexAttacksPerformed: 0,
                     levelUpsPerformed: 0,
                     abilitiesDrawnThisTurn: 0
                 }
             }
          }));
          break;

        case FsmState.DRAW_PHASE:
           if (gameState.currentPlayer === 'PLAYER') {
             setTimeout(() => {
                setGameState(prev => {
                    const deck = [...prev.powerDeck];
                    const discard = [...prev.discardPile];
                    if (deck.length < MAX_HAND_SIZE) {
                         const recycled = shuffle(discard);
                         deck.push(...recycled);
                         discard.length = 0;
                    }
                    const player = { ...prev.players.PLAYER };
                    const needed = player.maxHandSize - player.powerHand.length;
                    if (needed > 0) {
                        const drawn = deck.splice(0, needed);
                        player.powerHand = [...player.powerHand, ...drawn];
                        return {
                            ...prev, powerDeck: deck, discardPile: discard,
                            players: { ...prev.players, PLAYER: player },
                            fsmState: FsmState.MAIN_PHASE,
                            gameLog: addLog(prev, txt.logs.drewCards("Player", drawn.length))
                        };
                    }
                    return { ...prev, fsmState: FsmState.MAIN_PHASE, gameLog: addLog(prev, txt.logs.handFull) };
                });
             }, 500);
           }
           break;

        case FsmState.AI_TURN_LOGIC:
           setTimeout(() => {
             setGameState(prev => {
                 const ai = { ...prev.players.AI };
                 if (ai.attacksPerformed === 0) {
                     const deck = [...prev.powerDeck];
                     const needed = ai.maxHandSize - ai.powerHand.length;
                     if (needed > 0) {
                         const drawn = deck.splice(0, needed);
                         ai.powerHand = [...ai.powerHand, ...drawn];
                         return { 
                             ...prev, powerDeck: deck, players: { ...prev.players, AI: ai },
                             gameLog: addLog(prev, txt.logs.drewCards("AI", drawn.length)) 
                         };
                     }
                 }
                 if (ai.attacksPerformed < 2) {
                     const atkCards = ai.powerHand.filter(c => c.type === 'ATK').sort((a,b) => b.value - a.value);
                     if (atkCards.length > 0) {
                         const bestAtk = atkCards[0];
                         ai.attacksPerformed += 1;
                         const player = prev.players.PLAYER;
                         const playerHasDef = player.powerHand.some(c => c.type === 'DEF');
                         const playerHasVortex = player.activeAbilities.some(a => a.effectTag === 'VORTEX_CONTROL') && player.vortexAttacksPerformed < 1; 
                         const canDefend = playerHasDef || playerHasVortex;

                         if (!canDefend) {
                             return {
                                 ...prev,
                                 players: { ...prev.players, AI: ai },
                                 fsmState: FsmState.RESOLVE_DIRECT_COMBAT, 
                                 pendingAction: {
                                     type: 'DIRECT_ATTACK', attackerId: 'AI', targetId: 'PLAYER',
                                     attackingCard: bestAtk, defendingCard: null,
                                     vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null
                                 },
                                 gameLog: addLog(prev, txt.logs.aiAttacks(bestAtk.value, bestAtk.color, ai.attacksPerformed))
                             };
                         }
                         
                         return {
                             ...prev,
                             players: { ...prev.players, AI: ai },
                             fsmState: FsmState.AWAITING_PLAYER_DEFENSE,
                             pendingAction: {
                                 type: 'DIRECT_ATTACK', attackerId: 'AI', targetId: 'PLAYER',
                                 attackingCard: bestAtk, defendingCard: null,
                                 vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null
                             },
                             gameLog: addLog(prev, txt.logs.aiAttacks(bestAtk.value, bestAtk.color, ai.attacksPerformed))
                         };
                     }
                 }
                 return { ...prev, currentPlayer: 'PLAYER', fsmState: FsmState.START_TURN, gameLog: addLog(prev, txt.logs.aiEnds) };
             });
           }, 1000);
           break;

         case FsmState.RESOLVE_DIRECT_COMBAT:
            if (gameState.currentPlayer === 'AI' && gameState.pendingAction.defendingCard === null) {
                 setTimeout(resolveCombat, 500);
            }
            break;

         case FsmState.SHOWDOWN:
            setTimeout(() => { finalizeTurn(); }, 3000);
            break;
          
         case FsmState.GAME_OVER:
            break;
      }
    };

    handleState();
  }, [gameState.fsmState, gameState.gameStatus, gameState.currentPlayer, gameState.players.AI.powerHand.length]);


  // --- USER INTERACTION HANDLERS (Card Clicks) ---

  const handleCardClick = (card: Card, owner: 'PLAYER' | 'AI' | 'VORTEX', index?: number) => {
    if (highlightedAbilityId) setHighlightedAbilityId(null);
    const { fsmState, pendingAction, players } = gameState;

    // 0a. GENERIC DISCARD SELECTION
    if (fsmState === FsmState.SELECT_DISCARD_GENERIC && owner === 'PLAYER') {
        executeGenericDiscard(card.id);
        return;
    }

    // 0b. SELECT DISCARD FOR DRAW (Click card to discard and draw)
    if (fsmState === FsmState.SELECT_DISCARD_FOR_DRAW && owner === 'PLAYER') {
        executeAbilityDraw(card.id);
        return;
    }

    // 1. SELECT ATTACK CARD STATE
    if (fsmState === FsmState.SELECT_ATTACK_CARD && owner === 'PLAYER') {
        if (card.type !== 'ATK') return; 
        setGameState(prev => ({
            ...prev,
            players: { 
                ...prev.players, 
                PLAYER: { ...prev.players.PLAYER, attacksPerformed: prev.players.PLAYER.attacksPerformed + 1 }
            },
            fsmState: FsmState.AWAITING_AI_DEFENSE,
            pendingAction: {
                ...prev.pendingAction, type: 'DIRECT_ATTACK', attackerId: 'PLAYER', targetId: 'AI', attackingCard: card
            }
        }));
        setTimeout(runAiDefenseLogic, 1000);
        return;
    }

    // 2. MAIN PHASE: SINGLE SELECTION LOGIC
    if (fsmState === FsmState.MAIN_PHASE && owner === 'PLAYER') {
        if (activeCardId === card.id) {
            // Deselect if clicking same card
            setActiveCardId(null);
            setGameState(prev => ({...prev, pendingAction: {...prev.pendingAction, attackingCard: null}}));
        } else {
            // Select new card (Single selection)
            setActiveCardId(card.id);
            // If it's an ATK card, prep it for attack
            if (card.type === 'ATK') {
                setGameState(prev => ({...prev, pendingAction: {...prev.pendingAction, attackingCard: card}}));
            } else {
                setGameState(prev => ({...prev, pendingAction: {...prev.pendingAction, attackingCard: null}}));
            }
        }
    }

    // 3. LEVEL UP MODE: MULTI SELECTION LOGIC
    if (fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP && owner === 'PLAYER') {
        let newSelection = [...selectedCardsForLevelUp];
        if (newSelection.includes(card.id)) {
            newSelection = newSelection.filter(id => id !== card.id);
        } else {
            newSelection.push(card.id);
        }
        setSelectedCardsForLevelUp(newSelection);
    }

    // 4. OTHER DISCARD INTERACTIONS
    if (fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY && owner === 'PLAYER') {
        // ... (existing logic for playing abilities from hand)
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        const abTrans = getTransAbility(ability.effectTag, language);
        
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            let logMsg = txt.logs.discardToAct(card.value, abTrans.name);
            
            if (ability.effectTag === 'MAGIC_WALL') {
                player.permanentShield = { value: card.value };
                logMsg += " " + txt.logs.shieldSet(card.value);
            } else if (ability.effectTag === 'MAGIC_KNOWLEDGE') {
                player.maxHandSize += player.level;
            }
            player.activeAbilities = [...player.activeAbilities, ability];
            player.abilityHand = player.abilityHand.filter(a => a.id !== ability.id);

            return {
                ...prev,
                players: { ...prev.players, PLAYER: player },
                discardPile: discards,
                fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, logMsg)
            };
        });
        return;
    }

    // ... (Active Abilities Logic: Wall, Heal, Mind, Mod) ...
    // Note: Collapsed active ability discard handlers for brevity, logic remains same as previous but needs context.
    // I will include them fully to ensure file integrity.
    
    // ACTIVE ABILITY: MAGIC WALL
    if (fsmState === FsmState.SELECT_DISCARD_FOR_WALL && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        const abTrans = getTransAbility(ability.effectTag, language);
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.permanentShield = { value: card.value };
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            return {
                ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, abTrans.name)} ${txt.logs.shieldSet(card.value)}`)
            };
        });
        return;
    }
    // ACTIVE ABILITY: HEALING
    if (fsmState === FsmState.SELECT_DISCARD_FOR_HEAL && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        const abTrans = getTransAbility(ability.effectTag, language);
        if (ability.effectTag === 'LIGHT_AFFINITY' && card.color !== 'WHITE') { alert(txt.warnings?.lightAffinityReq); return; }
        if (ability.effectTag === 'DARK_AFFINITY' && card.color !== 'BLACK') { alert(txt.warnings?.darkAffinityReq); return; }

        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            let healAmount = (ability.effectTag === 'MASTER_AFFINITY') ? card.value : Math.floor(card.value / 2) + player.level;
            const maxHP = getMaxLife(player);
            player.life = Math.min(maxHP, player.life + healAmount);
            player.usedAbilitiesThisTurn.push(ability.id);
            return {
                ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards, fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, abTrans.name)} ${txt.logs.healed(healAmount)}`)
            };
        });
        return;
    }
    // ACTIVE ABILITY: MIND
    if (fsmState === FsmState.SELECT_DISCARD_FOR_MIND && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        const abTrans = getTransAbility(ability.effectTag, language);
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            const ai = { ...prev.players.AI };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            const discardCount = Math.floor(card.value / 2);
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
            return {
                ...prev, players: { ...prev.players, PLAYER: player, AI: ai }, discardPile: discards, fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, `${abTrans.name}: ${txt.logs.mindControl(card.value, aiDiscardedCount)}`)
            };
        });
        return;
    }
    // ACTIVE ABILITY: MOD 1
    if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION && owner === 'PLAYER') {
         const ability = pendingAction.targetAbility;
         if (!ability) return;
         const abTrans = getTransAbility(ability.effectTag, language);
         setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];
            return {
                ...prev, players: { ...prev.players, PLAYER: player }, discardPile: discards,
                fsmState: FsmState.SELECT_TARGET_FOR_MODIFICATION,
                gameLog: addLog(prev, `${txt.logs.discardToAct(card.value, abTrans.name)} ${txt.logs.selectTarget}`)
            };
         });
         return;
    }
    // ACTIVE ABILITY: MOD 2
    if (fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            const handIndex = player.powerHand.findIndex(c => c.id === card.id);
            if (handIndex === -1) return prev;
            const modCard = { ...player.powerHand[handIndex] };
            let logMsg = "";
            if (ability.effectTag === 'ELEMENTAL_CONTROL') {
                modCard.color = modCard.color === 'BLACK' ? 'WHITE' : 'BLACK';
                logMsg = `${modCard.color}`;
            } else if (ability.effectTag === 'MAGIC_CONTROL') {
                modCard.type = modCard.type === 'ATK' ? 'DEF' : 'ATK';
                logMsg = `${modCard.type}`;
            } else if (ability.effectTag === 'MASTER_CONTROL') {
                if (modCard.color === 'BLACK' && modCard.type === 'ATK') { modCard.color = 'WHITE'; }
                else if (modCard.color === 'WHITE' && modCard.type === 'ATK') { modCard.type = 'DEF'; }
                else if (modCard.color === 'WHITE' && modCard.type === 'DEF') { modCard.color = 'BLACK'; }
                else { modCard.type = 'ATK'; }
                logMsg = `${modCard.value} ${modCard.color} ${modCard.type}`;
            }
            player.powerHand[handIndex] = modCard;
            return {
                ...prev, players: { ...prev.players, PLAYER: player }, fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, txt.logs.changedCard(logMsg))
            };
        });
        return;
    }

    // 9. VORTEX ATTACK
    if (fsmState === FsmState.MAIN_PHASE && owner === 'VORTEX' && gameState.pendingAction.attackingCard) {
        if (index === undefined) return;
        const hasMasterVortex = players.PLAYER.activeAbilities.some(a => a.effectTag === 'MASTER_VORTEX');
        if (players.PLAYER.vortexAttacksPerformed >= 1 && !hasMasterVortex) {
            alert(txt.warnings?.vortexLimit);
            return;
        }
        setGameState(prev => ({
            ...prev, fsmState: FsmState.RESOLVE_VORTEX_COMBAT,
            pendingAction: {
                ...prev.pendingAction, type: 'VORTEX_ATTACK', attackerId: 'PLAYER', targetId: 'AI', vortexCardIndex: index
            },
            gameLog: addLog(prev, txt.logs.vortexAttack)
        }));
        setTimeout(resolveCombat, 500);
    }

    // 10. DEFENSE
    if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && owner === 'PLAYER' && card.type === 'DEF') {
        setGameState(prev => ({ ...prev, pendingAction: { ...prev.pendingAction, defendingCard: card } }));
    }
    if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && owner === 'VORTEX') {
        const hasVortexControl = players.PLAYER.activeAbilities.some(a => a.effectTag === 'VORTEX_CONTROL');
        if (!hasVortexControl) return;
        if (index === undefined) return;
        setGameState(prev => ({
            ...prev, pendingAction: { ...prev.pendingAction, defendingCard: null, vortexDefenseIndex: index }
        }));
    }
  };

  // --- HANDLER: PLAY ABILITY FROM HAND ---
  const handleAbilityClick = (ability: AbilityCard) => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.fsmState !== FsmState.MAIN_PHASE) return;
      const abTrans = getTransAbility(ability.effectTag, language);
      if (gameState.players.PLAYER.level < ability.level) { alert(txt.warnings?.levelTooLow); return; }

      // CHECK LIMIT
      const maxAbilities = gameState.players.PLAYER.level + 1;
      if (gameState.players.PLAYER.activeAbilities.length >= maxAbilities) {
          alert(txt.warnings?.abilityLimitReached);
          return;
      }

      const isDuplicate = gameState.players.PLAYER.activeAbilities.some(a => a.effectTag === ability.effectTag);
      if (isDuplicate) { alert(`${abTrans.name}: ${txt.warnings?.alreadyActive}`); return; }

      setGameState(prev => {
          const player = { ...prev.players.PLAYER };
          player.activeAbilities = [...player.activeAbilities, ability];
          player.abilityHand = player.abilityHand.filter(a => a.id !== ability.id);
          if (ability.effectTag === 'MAGIC_KNOWLEDGE') { player.maxHandSize += player.level; }
          return {
              ...prev, players: { ...prev.players, PLAYER: player },
              gameLog: addLog(prev, txt.logs.addedToZone(abTrans.name)), fsmState: FsmState.MAIN_PHASE
          };
      });
  };

  // --- HANDLER: ACTIVE ABILITY ---
  const handleActiveAbilityClick = (ability: AbilityCard) => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.fsmState !== FsmState.MAIN_PHASE) return;
      const abTrans = getTransAbility(ability.effectTag, language);
      if (gameState.players.PLAYER.usedAbilitiesThisTurn.includes(ability.id)) {
          alert(`${abTrans.name}: ${txt.warnings?.abilityUsed}`); return;
      }
      if (ability.effectTag === 'MAGIC_WALL') {
          const currentShield = gameState.players.PLAYER.permanentShield?.value || 0;
          if (currentShield > 0) { alert(txt.warnings?.shieldActive); return; }
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_WALL, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(abTrans.name)) }));
      }
      else if (['MAGIC_AFFINITY', 'LIGHT_AFFINITY', 'DARK_AFFINITY', 'MASTER_AFFINITY'].includes(ability.effectTag)) {
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_HEAL, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(abTrans.name)) }));
      }
      else if (ability.effectTag === 'MIND_CONTROL') {
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_MIND, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(abTrans.name)) }));
      }
      else if (['ELEMENTAL_CONTROL', 'MAGIC_CONTROL', 'MASTER_CONTROL'].includes(ability.effectTag)) {
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_MODIFICATION, pendingAction: { ...prev.pendingAction, targetAbility: ability }, gameLog: addLog(prev, txt.logs.activating(abTrans.name)) }));
      }
  };

  // --- HANDLER: DRAW ABILITY (Main Phase Action) ---
  const handleDrawAbility = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      if (gameState.players.PLAYER.powerHand.length === 0) return;
      if (gameState.players.PLAYER.abilitiesDrawnThisTurn >= 1) { alert(txt.warnings?.drawLimit); return; }

      // CHECK LIMIT
      const maxAbilities = gameState.players.PLAYER.level + 1;
      if (gameState.players.PLAYER.activeAbilities.length >= maxAbilities) { alert(txt.warnings?.abilityLimitReached); return; }
      
      const player = gameState.players.PLAYER;
      const activeTags = player.activeAbilities.map(a => a.effectTag);
      const handTags = player.abilityHand.map(a => a.effectTag);
      const validIndices = gameState.abilityDeck.map((c, i) => {
            if (c.level > player.level) return -1;
            if (activeTags.includes(c.effectTag)) return -1;
            if (handTags.includes(c.effectTag)) return -1;
            return i;
        }).filter(i => i !== -1);

      if (validIndices.length === 0) {
          setGameState(prev => ({ ...prev, gameLog: addLog(prev, txt.warnings?.noAbilities || "No abilities.") }));
          return;
      }

      // 1. If single card selected, use it immediately
      if (activeCardId) {
          executeAbilityDraw(activeCardId);
      } else {
          // 2. Else, enter selection mode
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_FOR_DRAW }));
      }
  };

  // --- HANDLER: GENERIC DISCARD ACTION ---
  const handleDiscardAction = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      
      // 1. If card selected, discard immediately
      if (activeCardId) {
          executeGenericDiscard(activeCardId);
      } else {
          // 2. Else, enter generic discard selection mode
          setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_DISCARD_GENERIC }));
      }
  };

  // --- HANDLER: LEVEL UP MODE START ---
  const handleLevelUp = () => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);
      
      const { players } = gameState;
      const player = players.PLAYER;
      if (player.level >= 3) { alert(txt.warnings?.maxLevel); return; }
      if (player.levelUpsPerformed >= 1) { alert(txt.warnings?.oneLevelPerTurn); return; }

      // Enter Level Up Mode - Clear other selections
      setActiveCardId(null);
      setSelectedCardsForLevelUp([]);
      setGameState(prev => ({ 
          ...prev, 
          fsmState: FsmState.SELECT_CARDS_FOR_LEVEL_UP,
          pendingAction: {...prev.pendingAction, attackingCard: null}
      }));
  };

  // --- HANDLER: CONFIRM LEVEL UP ---
  const handleConfirmLevelUp = () => {
      const player = gameState.players.PLAYER;
      const selectedCards = player.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id));
      const sum = selectedCards.reduce((acc, c) => acc + c.value, 0);

      if (sum < 10) { alert(txt.warnings?.selectSum); return; }

      setGameState(prev => {
          const newPlayer = { ...prev.players.PLAYER };
          newPlayer.powerHand = newPlayer.powerHand.filter(c => !selectedCardsForLevelUp.includes(c.id));
          const newDiscard = [...prev.discardPile, ...selectedCards];
          
          newPlayer.level += 1;
          newPlayer.levelUpsPerformed += 1;
          if (newPlayer.activeAbilities.some(a => a.effectTag === 'MAGIC_KNOWLEDGE')) { newPlayer.maxHandSize += 1; }

          return {
              ...prev,
              players: { ...prev.players, PLAYER: newPlayer },
              discardPile: newDiscard,
              fsmState: FsmState.MAIN_PHASE,
              gameLog: addLog(prev, txt.logs.levelUp(newPlayer.level))
          };
      });
      setSelectedCardsForLevelUp([]);
  };

  // --- HANDLER: CANCEL LEVEL UP ---
  const handleCancelLevelUp = () => {
      setSelectedCardsForLevelUp([]);
      setGameState(prev => ({ ...prev, fsmState: FsmState.MAIN_PHASE }));
  };

  // --- HANDLER: CONFIRMATION ACTIONS ---
  const handleConfirmAction = (action: string) => {
      if (highlightedAbilityId) setHighlightedAbilityId(null);

      if (action === 'END_TURN') {
          if (gameState.fsmState === FsmState.MAIN_PHASE) {
              setGameState(prev => ({
                  ...prev, currentPlayer: 'AI', fsmState: FsmState.START_TURN,
                  pendingAction: { ...prev.pendingAction, attackingCard: null },
                  selectedCardsForLevelUp: []
              }));
              setSelectedCardsForLevelUp([]);
              setActiveCardId(null);
          }
      }

      if (action === 'ATTACK_DIRECT') {
          const player = gameState.players.PLAYER;
          const maxAttacks = 1 + player.level;
          if (player.attacksPerformed >= maxAttacks) { alert(txt.warnings?.maxAttacks); return; }

          if (!gameState.pendingAction.attackingCard) {
              setActiveCardId(null);
              setGameState(prev => ({ ...prev, fsmState: FsmState.SELECT_ATTACK_CARD }));
              return;
          }
          setGameState(prev => ({
              ...prev,
              players: { ...prev.players, PLAYER: { ...prev.players.PLAYER, attacksPerformed: prev.players.PLAYER.attacksPerformed + 1 } },
              fsmState: FsmState.AWAITING_AI_DEFENSE,
              pendingAction: { ...prev.pendingAction, type: 'DIRECT_ATTACK', attackerId: 'PLAYER', targetId: 'AI' }
          }));
          setTimeout(runAiDefenseLogic, 1000);
      }

      if (action === 'DEFEND_WITH_CARD') {
          setGameState(prev => ({ ...prev, fsmState: FsmState.RESOLVE_DIRECT_COMBAT }));
          setTimeout(resolveCombat, 500);
      }

      if (action === 'NO_DEFENSE') {
          setGameState(prev => ({
              ...prev, pendingAction: { ...prev.pendingAction, defendingCard: null, vortexDefenseIndex: null },
              fsmState: FsmState.RESOLVE_DIRECT_COMBAT
          }));
          setTimeout(resolveCombat, 500);
      }
  };

  const runAiDefenseLogic = () => {
      setGameState(prev => {
          const ai = prev.players.AI;
          const attackCard = prev.pendingAction.attackingCard!;
          let chosenDef: Card | null = null;
          const defCards = ai.powerHand.filter(c => c.type === 'DEF');
          if (defCards.length > 0) {
              const opposite = defCards.find(c => c.color !== attackCard.color);
              chosenDef = opposite || defCards[0];
          }
          const logMsg = chosenDef ? txt.logs.defendWith(chosenDef.value, chosenDef.color) : txt.logs.noDef;
          return {
              ...prev, gameLog: addLog(prev, `AI: ${logMsg}`),
              pendingAction: { ...prev.pendingAction, defendingCard: chosenDef },
              fsmState: FsmState.RESOLVE_DIRECT_COMBAT
          };
      });
      setTimeout(resolveCombat, 1000);
  };

  const resolveCombat = () => {
      setGameState(prev => {
          const pending = prev.pendingAction;
          const attacker = prev.players[pending.attackerId!];
          const defender = prev.players[pending.targetId!];
          let result;
          if (pending.type === 'VORTEX_ATTACK') {
               const vIndex = pending.vortexCardIndex!;
               const vCard = prev.vortexCards[vIndex]!;
               result = calculateVortexDamage(pending.attackingCard!, vCard, attacker, defender, language);
          } else {
              if (pending.vortexDefenseIndex !== null) {
                  const vCard = prev.vortexCards[pending.vortexDefenseIndex]!;
                  result = calculateVortexDamage(pending.attackingCard!, vCard, attacker, defender, language);
                  result.logMessage = txt.logs.vortexDefensePrefix + result.logMessage;
              } else {
                  result = calculateDirectDamage(pending.attackingCard!, pending.defendingCard, attacker, defender, language);
              }
          }
          const newPlayers = { ...prev.players };
          if (result.targetId) {
              const target = newPlayers[result.targetId];
              target.life = Math.max(0, target.life - result.damage);
          }
          if (result.shieldRemaining !== undefined && pending.targetId) {
             const def = newPlayers[pending.targetId];
             if (def.permanentShield) def.permanentShield.value = result.shieldRemaining;
          }
          if (pending.type === 'VORTEX_ATTACK' && pending.attackerId === 'PLAYER') {
               newPlayers.PLAYER.vortexAttacksPerformed += 1;
          }
          return {
              ...prev, players: newPlayers, gameLog: [...prev.gameLog, result.logMessage], fsmState: FsmState.SHOWDOWN 
          };
      });
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

          if (newPlayers.PLAYER.life <= 0) {
              status = 'GAME_OVER'; nextFsm = FsmState.GAME_OVER; winner = 'AI'; log.push(txt.lore.loss);
          } else if (newPlayers.AI.life <= 0) {
              status = 'GAME_OVER'; nextFsm = FsmState.GAME_OVER; winner = 'PLAYER'; log.push(txt.lore.win);
          }

          return {
              ...prev, players: newPlayers, currentPlayer: currentPlayerOverride, winner: winner,
              discardPile: discardUpdate, vortexCards: vortexUpdate, powerDeck: powerDeckUpdate, gameLog: log,
              pendingAction: { type: null, attackerId: null, targetId: null, attackingCard: null, defendingCard: null, vortexCardIndex: null, vortexDefenseIndex: null, targetAbility: null },
              fsmState: nextFsm, gameStatus: status
          };
      });
      // Clear selections on turn transition
      setActiveCardId(null);
      setSelectedCardsForLevelUp([]);
  };

  const validTargetIds = selectedCardsForLevelUp;
  const isAbilityFull = gameState.players.PLAYER.activeAbilities.length >= gameState.players.PLAYER.level + 1;

  // --- RENDER ---
  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-lato overflow-hidden relative">
      <EndGameEffects outcome={gameState.winner === 'PLAYER' ? 'VICTORY' : gameState.winner === 'AI' ? 'DEFEAT' : null} />

      {/* MODALS */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-800 border border-purple-500 rounded-xl p-6 max-w-lg shadow-2xl relative">
                <button onClick={() => setShowHistoryModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-2xl font-cinzel text-purple-300 mb-4 border-b border-purple-900/50 pb-2">{txt.lore.title}</h3>
                <div className="text-slate-300 text-sm leading-relaxed font-serif">
                    <p className="mb-2">{txt.lore.p1}</p><p className="mb-2">{txt.lore.p2}</p><p>{txt.lore.p3}</p>
                </div>
                <div className="mt-6 text-center"><button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded border border-purple-500">{ui.closeHistory}</button></div>
            </div>
        </div>
      )}
      
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
             <div className="bg-slate-900 border-2 border-yellow-600 rounded-xl p-6 max-w-3xl w-full shadow-2xl relative my-8">
                <button onClick={() => setShowRulesModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                <h3 className="text-3xl font-cinzel text-yellow-500 mb-6 text-center border-b border-yellow-900 pb-2">{txt.rules.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300 text-sm leading-relaxed">
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-yellow-400 font-bold mb-1 uppercase">{txt.rules.goal.title}</h4>
                        <p>{txt.rules.goal.text}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-yellow-400 font-bold mb-1 uppercase">{txt.rules.cards.title}</h4>
                        <p>{txt.rules.cards.text}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 md:col-span-2">
                        <h4 className="text-yellow-400 font-bold mb-1 uppercase">{txt.rules.combat.title}</h4>
                        <p>{txt.rules.combat.text}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 md:col-span-2">
                        <h4 className="text-yellow-400 font-bold mb-1 uppercase">{txt.rules.vortex.title}</h4>
                        <p>{txt.rules.vortex.text}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-yellow-400 font-bold mb-1 uppercase">{txt.rules.leveling.title}</h4>
                        <p>{txt.rules.leveling.text}</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-yellow-400 font-bold mb-1 uppercase">{txt.rules.abilities.title}</h4>
                        <p>{txt.rules.abilities.text}</p>
                    </div>
                </div>
                <div className="mt-6 text-center"><button onClick={() => setShowRulesModal(false)} className="px-6 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded border border-yellow-500 font-bold">{ui.closeRules}</button></div>
            </div>
        </div>
      )}

      {viewingCharacter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-xl p-6 max-w-xl shadow-2xl relative flex flex-col items-center max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900">
                <button onClick={() => setViewingCharacter(null)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                <div className="text-6xl mb-4 animate-bounce">{viewingCharacter.avatar}</div>
                <h3 className="text-3xl font-cinzel text-purple-300 mb-2">{viewingCharacter.name}</h3>
                
                <div className="flex gap-2 mb-4">
                    <div className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {viewingCharacter.affinityColor} Affinity
                    </div>
                </div>

                {/* Lore Section */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 w-full mb-4">
                    <h4 className="text-purple-400 text-xs font-bold uppercase mb-2 border-b border-purple-900/30 pb-1">Lore</h4>
                    <p className="text-slate-300 text-sm leading-relaxed font-serif italic text-justify">{/* @ts-ignore */ txt.characterLore[viewingCharacter.id]}</p>
                </div>
                
                {/* Ability Section */}
                <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30 w-full">
                     <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2 border-b border-indigo-900/30 pb-1">Starting Ability</h4>
                     {(() => {
                         const ability = getAbilityByTag(viewingCharacter.startingAbilityTag);
                         if (!ability) return null;
                         const trans = getTransAbility(ability.effectTag, language);
                         return (
                             <div>
                                 <div className="text-indigo-200 font-bold text-sm">{trans.name}</div>
                                 <div className="text-indigo-300/80 text-xs mt-1">{trans.desc}</div>
                             </div>
                         )
                     })()}
                </div>

                <div className="mt-6 text-center"><button onClick={() => setViewingCharacter(null)} className="px-6 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded border border-purple-500 transition-colors font-cinzel">{ui.closeHistory}</button></div>
            </div>
        </div>
      )}

      <header className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg z-10 shrink-0">
        <h1 className="text-2xl text-purple-400 tracking-widest font-bold font-cinzel">MAGICAL VORTEX</h1>
        <div className="text-sm text-slate-400">{gameState.uiMessage}</div>
      </header>

      <main className="h-full p-2 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-4 z-10 overflow-hidden">
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1">
            
            {gameState.gameStatus === 'PRE_GAME' && (
                <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="text-center max-w-2xl flex flex-col items-center">
                        <h2 className="text-5xl font-cinzel text-purple-400 mb-6 drop-shadow-lg">{ui.enterVortex}</h2>
                        
                        {/* Lore Box */}
                        <div className="bg-slate-900/80 p-6 rounded-lg border border-purple-500/30 shadow-inner mb-8 max-w-lg">
                            <p className="text-slate-300 font-serif italic text-sm leading-relaxed mb-2">{txt.lore.p1}</p>
                            <p className="text-slate-400 font-serif italic text-xs">{txt.lore.p3}</p>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setLanguage('en')} className={`text-2xl hover:scale-125 transition-transform ${language === 'en' ? 'scale-125' : 'opacity-50'}`}>ENG</button>
                            <button onClick={() => setLanguage('es')} className={`text-2xl hover:scale-125 transition-transform ${language === 'es' ? 'scale-125' : 'opacity-50'}`}>ESP</button>
                            <button onClick={() => setLanguage('ca')} className={`text-2xl hover:scale-125 transition-transform ${language === 'ca' ? 'scale-125' : 'opacity-50'}`}>CAT</button>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={startGame} className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-4 px-10 rounded-lg shadow-xl border border-purple-400 transition-all transform hover:scale-105">{ui.startGame}</button>
                            <button onClick={() => setShowRulesModal(true)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 px-6 rounded-lg shadow-lg border border-slate-500 transition-all">{ui.readRules}</button>
                        </div>
                    </div>
                </div>
            )}

            {gameState.fsmState === FsmState.PLAYER_CHOSE_CHAR && (
                <div className="flex-1 p-6 bg-slate-800 rounded-xl border border-slate-700 overflow-y-auto">
                    <h2 className="text-3xl font-cinzel text-center text-white mb-8">{ui.chooseChar}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {CHARACTERS.map(char => {
                            const ability = getAbilityByTag(char.startingAbilityTag);
                            const abName = ability ? getTransAbility(ability.effectTag, language).name : '';
                            return (
                                <div key={char.id} onClick={() => handleCharacterSelect(char)} className="bg-slate-900 border-slate-600 p-4 rounded-xl border-2 hover:border-blue-400 hover:scale-105 transition-all cursor-pointer flex flex-col items-center gap-2 group relative">
                                    <button onClick={(e) => { e.stopPropagation(); handleCharacterInfoClick(char); }} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors text-lg z-20">ℹ️</button>
                                    
                                    <div className="text-5xl group-hover:animate-bounce mt-2">{char.avatar}</div>
                                    <div className="font-bold text-lg font-cinzel text-white text-center leading-tight">{char.name}</div>
                                    
                                    <div className="mt-2 flex flex-col items-center gap-1 w-full">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded w-full text-center uppercase tracking-wider ${char.affinityColor === 'WHITE' ? 'bg-slate-200 text-slate-800' : char.affinityColor === 'BLACK' ? 'bg-black text-slate-200' : 'bg-slate-600 text-slate-300'}`}>
                                            {char.affinityColor}
                                        </div>
                                        <div className="text-[9px] bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded w-full text-center border border-indigo-500/30 truncate">
                                            {abName}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {gameState.gameStatus === 'GAME_OVER' && (
                 <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 relative z-20">
                    <div className="text-center p-8 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-500 shadow-2xl">
                        <h2 className={`text-5xl font-cinzel mb-4 ${gameState.winner === 'PLAYER' ? 'text-yellow-400' : 'text-red-500'}`}>{gameState.winner === 'PLAYER' ? ui.victory : ui.defeat}</h2>
                        <button onClick={startGame} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg border-2 border-slate-400">{ui.playAgain}</button>
                    </div>
                 </div>
            )}

            {gameState.gameStatus === 'PLAYING' && gameState.fsmState !== FsmState.PLAYER_CHOSE_CHAR && (
                <GameBoard 
                    ai={gameState.players.AI}
                    player={gameState.players.PLAYER}
                    vortexCards={gameState.vortexCards}
                    fsmState={gameState.fsmState}
                    pendingAction={gameState.pendingAction}
                    onCardClick={handleCardClick}
                    onAbilityClick={handleAbilityClick}
                    onActiveAbilityClick={handleActiveAbilityClick}
                    onCharacterClick={handleCharacterInfoClick}
                    selectedCardId={gameState.pendingAction.attackingCard?.id || gameState.pendingAction.defendingCard?.id || null}
                    activeCardId={activeCardId} // Pass active single card
                    selectedAbilityId={gameState.pendingAction.targetAbility?.id || null}
                    validTargetIds={validTargetIds}
                    language={language}
                    highlightedAbilityId={highlightedAbilityId}
                />
            )}
            
            {gameState.gameStatus === 'PLAYING' && gameState.fsmState !== FsmState.PLAYER_CHOSE_CHAR && (
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex gap-4 items-center min-h-[80px] flex-wrap">
                    <div className="text-slate-400 text-sm font-mono mr-auto w-full lg:w-auto mb-2 lg:mb-0">
                        {gameState.fsmState === FsmState.SHOWDOWN ? txt.ui.combatResolved : 
                         gameState.fsmState === FsmState.SELECT_DISCARD_FOR_DRAW ? txt.warnings?.selectDiscardForDraw :
                         gameState.fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP ? txt.warnings?.selectCardsForLevelUp :
                         gameState.fsmState === FsmState.SELECT_ATTACK_CARD ? txt.warnings?.selectAttackToExec :
                         gameState.fsmState === FsmState.SELECT_DISCARD_GENERIC ? txt.warnings?.selectDiscardGeneric :
                         gameState.pendingAction.attackingCard ? `${txt.ui.attackWith} ${gameState.pendingAction.attackingCard.value}` : 
                         ui.waiting}
                    </div>
                     
                     {/* Buttons for Level Up Confirmation */}
                     {gameState.fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP && (
                        <>
                            <div className="text-yellow-400 font-mono text-sm mr-2">
                                SUM: {gameState.players.PLAYER.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id)).reduce((a,b)=>a+b.value,0)}
                            </div>
                            <button onClick={handleConfirmLevelUp} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold">{ui.confirm}</button>
                            <button onClick={handleCancelLevelUp} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold">{ui.cancel}</button>
                        </>
                     )}

                     {/* Main Buttons */}
                     {gameState.fsmState === FsmState.MAIN_PHASE && (
                        <>
                             {!isAbilityFull && (
                                <button 
                                    onClick={handleDrawAbility}
                                    disabled={gameState.players.PLAYER.powerHand.length === 0}
                                    className={`px-3 py-1 bg-indigo-900/50 text-indigo-200 border border-indigo-700 rounded text-xs ${gameState.players.PLAYER.abilitiesDrawnThisTurn >= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-800'}`}
                                >
                                    {ui.drawAbility}
                                </button>
                             )}

                            {gameState.players.PLAYER.level < 3 && (
                                <button 
                                    onClick={handleLevelUp}
                                    disabled={gameState.players.PLAYER.levelUpsPerformed >= 1}
                                    className={`px-4 py-2 rounded font-bold ${gameState.players.PLAYER.levelUpsPerformed >= 1 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
                                >
                                    {ui.levelUp}
                                </button>
                            )}

                            <button 
                                disabled={gameState.players.PLAYER.attacksPerformed >= (1 + gameState.players.PLAYER.level) || !gameState.players.PLAYER.powerHand.some(c => c.type === 'ATK')}
                                onClick={() => handleConfirmAction('ATTACK_DIRECT')}
                                className={`px-4 py-2 rounded font-bold ${gameState.players.PLAYER.attacksPerformed >= (1 + gameState.players.PLAYER.level) || !gameState.players.PLAYER.powerHand.some(c => c.type === 'ATK') ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : gameState.pendingAction.attackingCard ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-800 hover:bg-red-700 text-red-100'}`}
                            >
                                {ui.attackDirect}
                            </button>

                            <button
                                onClick={handleDiscardAction}
                                disabled={gameState.players.PLAYER.powerHand.length === 0}
                                className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 text-slate-200 rounded font-bold border border-gray-600 ${gameState.players.PLAYER.powerHand.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {ui.discard}
                            </button>
                            
                            <button onClick={() => handleConfirmAction('END_TURN')} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold">{ui.endTurn}</button>
                        </>
                    )}
                    
                    {/* Cancel button for Attack Selection or Draw Selection */}
                    {(gameState.fsmState === FsmState.SELECT_ATTACK_CARD || gameState.fsmState === FsmState.SELECT_DISCARD_FOR_DRAW || gameState.fsmState === FsmState.SELECT_DISCARD_GENERIC) && (
                        <button onClick={() => setGameState(prev => ({...prev, fsmState: FsmState.MAIN_PHASE}))} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold">{ui.cancel}</button>
                    )}

                    {gameState.fsmState === FsmState.AWAITING_PLAYER_DEFENSE && (
                        <>
                             <button disabled={!gameState.pendingAction.defendingCard && gameState.pendingAction.vortexDefenseIndex === null} onClick={() => handleConfirmAction('DEFEND_WITH_CARD')} className={`px-4 py-2 rounded font-bold ${gameState.pendingAction.defendingCard || gameState.pendingAction.vortexDefenseIndex !== null ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'}`}>{gameState.pendingAction.vortexDefenseIndex !== null ? ui.confirmVortex : ui.confirmDef}</button>
                            <button onClick={() => handleConfirmAction('NO_DEFENSE')} className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded font-bold">{ui.takeDmg}</button>
                        </>
                    )}
                </div>
            )}
        </div>
        <div className="lg:col-span-1 flex flex-col gap-2 h-full overflow-hidden">
            <div className="flex-1 min-h-0 bg-slate-800 rounded-lg border border-slate-700 shadow-inner flex flex-col overflow-hidden relative"><div className="absolute inset-0 flex flex-col"><GameLog logs={gameState.gameLog} /></div></div>
            <div className="shrink-0 p-3 bg-slate-800 rounded-lg border border-slate-700 text-[11px] leading-tight text-slate-400 font-mono shadow-md">
                <h4 className="font-bold text-slate-200 mb-1 text-xs">{ui.quickRules}</h4>
                <ul className="space-y-1 list-disc list-inside">{ui.rulesList.map((r, i) => <li key={i}>{r}</li>)}</ul>
                <div className="mt-2 pt-2 border-t border-slate-700 text-center flex flex-col gap-2">
                    <button onClick={() => setShowRulesModal(true)} className="text-yellow-500 hover:text-yellow-400 underline text-xs font-bold font-cinzel tracking-wider">{ui.readRules}</button>
                    <button onClick={() => setShowHistoryModal(true)} className="text-purple-400 hover:text-purple-300 underline text-xs font-bold font-cinzel tracking-wider">{ui.readLore}</button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
