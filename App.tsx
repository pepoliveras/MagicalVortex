
import React, { useState, useEffect } from 'react';
import { FsmState } from './types';
import type { GameState, Card, PlayerId, AbilityCard, Character } from './types';
import { createInitialState, MAX_HAND_SIZE, shuffle, CHARACTERS, getAbilityByTag } from './constants';
import { calculateDirectDamage, calculateVortexDamage, getMaxLife } from './utils/gameLogic';
import GameBoard from './components/GameBoard';
import GameLog from './components/GameLog';
import EndGameEffects from './components/EndGameEffects';

/**
 * APP COMPONENT (CONTROLLER)
 * This is the heart of the application. It handles:
 * 1. Global Game State
 * 2. The Game Loop (useEffect)
 * 3. User Interactions (Clicks)
 * 4. AI Logic
 * 5. Combat Resolution
 */

// CONSTANT: Game Lore Text
const LORE_TITLE = "The Universe of the Vortex";
const LORE_TEXT = (
    <>
        <p className="mb-2">
            We are in a universe where magic is a fundamental force, the origin of everything. But this balance has been broken.
            A <strong>Magic Vortex</strong> of astronomical dimensions has appeared, threatening to consume all existence.
        </p>
        <p className="mb-2">
            Only a few chosen ones, capable of channeling primordial energies, can avoid total destruction.
        </p>
        <p>
            <strong>White Magic</strong> and <strong>Black Magic</strong> are two sides of the same coin: natural opposites that attract and nullify each other.
            You must master these forces, exploit their duality, and survive the chaos of the Vortex to save the universe... or become the last survivor of its end.
        </p>
    </>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedCardsForLevelUp, setSelectedCardsForLevelUp] = useState<string[]>([]);
  
  // NEW: State for History Popup
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // --- HELPER: ADD LOG ---
  // Appends a message to the game log for the UI
  const addLog = (state: GameState, message: string): string[] => {
    return [...state.gameLog, message];
  };

  // --- STARTUP LOGIC ---

  // Called when "START GAME" or "PLAY AGAIN" is clicked
  const startGame = () => {
    const freshState = createInitialState();
    
    // Move to Character Selection phase
    setGameState({
        ...freshState,
        gameStatus: 'PLAYING',
        fsmState: FsmState.PLAYER_CHOSE_CHAR,
        uiMessage: "Choose your Character"
    });
  };

  // Called when a character is clicked in the selection screen
  const handleCharacterSelect = (character: Character) => {
      // 1. Assign Player Character and Starting Ability
      const playerStartAbility = getAbilityByTag(character.startingAbilityTag)!;
      
      // 2. Assign AI Character (Random from remaining)
      const availableChars = CHARACTERS.filter(c => c.id !== character.id);
      const aiChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      const aiStartAbility = getAbilityByTag(aiChar.startingAbilityTag)!;

      setGameState(prev => {
          const newState = { ...prev };
          
          // Setup Player
          newState.players.PLAYER.character = character;
          newState.players.PLAYER.activeAbilities = [playerStartAbility];
          // Handle specific passive bonuses immediately
          if (character.startingAbilityTag === 'MAGIC_KNOWLEDGE') {
              newState.players.PLAYER.maxHandSize += 1;
          }

          // Setup AI
          newState.players.AI.character = aiChar;
          newState.players.AI.activeAbilities = [aiStartAbility];
          if (aiChar.startingAbilityTag === 'MAGIC_KNOWLEDGE') {
              newState.players.AI.maxHandSize += 1;
          }

          newState.fsmState = FsmState.START_GAME;
          newState.gameLog = addLog(prev, `You chose ${character.name}. AI chose ${aiChar.name}. Both start at Level 1.`);
          return newState;
      });
  };

  // --- GAME LOOP / EFFECT HOOK ---
  // Listens for FsmState changes and executes automatic game logic (Turn flow, AI actions)
  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') return;

    const handleState = async () => {
      switch (gameState.fsmState) {
        
        // Setup Hands and Vortex
        case FsmState.START_GAME:
          setGameState(prev => {
            const deck = [...prev.powerDeck];
            const pHand = deck.splice(0, 5);
            const aiHand = deck.splice(0, 5);
            // 4 cards for Vortex
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
              gameLog: addLog(prev, "Hands dealt. Vortex formed. Begin!")
            };
          });
          break;

        // Reset Turn Counters
        case FsmState.START_TURN:
          const activeId = gameState.currentPlayer;
          setGameState(prev => ({
             ...prev,
             fsmState: activeId === 'PLAYER' ? FsmState.DRAW_PHASE : FsmState.AI_TURN_LOGIC,
             uiMessage: `${activeId}'s Turn`,
             gameLog: addLog(prev, `--- Start of ${activeId} Turn ---`),
             // Reset pending action to avoid stale state
             pendingAction: { 
                 type: null,
                 attackerId: null,
                 targetId: null,
                 attackingCard: null,
                 defendingCard: null,
                 vortexCardIndex: null,
                 vortexDefenseIndex: null,
                 targetAbility: null 
             },
             // Reset Turn Specific Counters (Attacks, Ability Limits, etc)
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

        // Player Draw Phase
        case FsmState.DRAW_PHASE:
           if (gameState.currentPlayer === 'PLAYER') {
             setTimeout(() => {
                setGameState(prev => {
                    const deck = [...prev.powerDeck];
                    const discard = [...prev.discardPile];
                    
                    // Recycle discard if deck is empty (simplified)
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
                            ...prev,
                            powerDeck: deck,
                            discardPile: discard,
                            players: { ...prev.players, PLAYER: player },
                            fsmState: FsmState.MAIN_PHASE,
                            gameLog: addLog(prev, `Player drew ${drawn.length} power cards.`)
                        };
                    }
                    return { ...prev, fsmState: FsmState.MAIN_PHASE, gameLog: addLog(prev, "Hand full. Main Phase.") };
                });
             }, 500);
           }
           break;

        // AI Logic Engine
        case FsmState.AI_TURN_LOGIC:
           setTimeout(() => {
             setGameState(prev => {
                 const ai = { ...prev.players.AI };
                 
                 // 1. AI DRAW (At start of turn only)
                 if (ai.attacksPerformed === 0) {
                     const deck = [...prev.powerDeck];
                     const needed = ai.maxHandSize - ai.powerHand.length;
                     if (needed > 0) {
                         const drawn = deck.splice(0, needed);
                         ai.powerHand = [...ai.powerHand, ...drawn];
                         return { 
                             ...prev, 
                             powerDeck: deck, 
                             players: { ...prev.players, AI: ai },
                             gameLog: addLog(prev, `AI drew ${drawn.length} cards.`) 
                         };
                     }
                 }

                 // 2. AI ATTACK (Max 2 attacks per turn)
                 if (ai.attacksPerformed < 2) {
                     const atkCards = ai.powerHand.filter(c => c.type === 'ATK').sort((a,b) => b.value - a.value);
                     
                     if (atkCards.length > 0) {
                         const bestAtk = atkCards[0];
                         ai.attacksPerformed += 1;
                         
                         return {
                             ...prev,
                             players: { ...prev.players, AI: ai },
                             fsmState: FsmState.AWAITING_PLAYER_DEFENSE,
                             pendingAction: {
                                 type: 'DIRECT_ATTACK',
                                 attackerId: 'AI',
                                 targetId: 'PLAYER',
                                 attackingCard: bestAtk,
                                 defendingCard: null,
                                 vortexCardIndex: null,
                                 vortexDefenseIndex: null,
                                 targetAbility: null
                             },
                             gameLog: addLog(prev, `AI Attacks with ${bestAtk.value} ${bestAtk.color}! (Attack ${ai.attacksPerformed}/2)`)
                         };
                     }
                 }

                 // 3. END TURN
                 return {
                     ...prev,
                     currentPlayer: 'PLAYER',
                     fsmState: FsmState.START_TURN,
                     gameLog: addLog(prev, `AI Ends Turn.`)
                 };
             });
           }, 1000);
           break;

         // Combat Reveal Phase (3 seconds delay)
         case FsmState.SHOWDOWN:
            setTimeout(() => {
                finalizeTurn();
            }, 3000);
            break;
          
         case FsmState.GAME_OVER:
            break;
      }
    };

    handleState();
  }, [gameState.fsmState, gameState.gameStatus, gameState.currentPlayer, gameState.players.AI.powerHand.length]);


  // --- USER INTERACTION HANDLERS (Card Clicks) ---

  const handleCardClick = (card: Card, owner: 'PLAYER' | 'AI' | 'VORTEX', index?: number) => {
    const { fsmState, pendingAction, players } = gameState;

    // 1. SELECT DISCARD FOR ABILITY (Paying cost to play ability card)
    if (fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;
        
        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            let logMsg = `Player discarded ${card.value} to activate ${ability.name}.`;
            
            // Logic for specific "Playable" abilities
            if (ability.effectTag === 'MAGIC_WALL') {
                player.permanentShield = { value: card.value };
                logMsg += ` Permanent Shield set to ${card.value}.`;
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

    // 2. ACTIVE ABILITY: MAGIC WALL (Active Button Click)
    if (fsmState === FsmState.SELECT_DISCARD_FOR_WALL && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;

        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            
            // Activate Shield
            player.permanentShield = { value: card.value };
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];

            return {
                ...prev,
                players: { ...prev.players, PLAYER: player },
                discardPile: discards,
                fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, `Activated Magic Wall! Discarded ${card.value}. Shield is now ${card.value}.`)
            };
        });
        return;
    }

    // 3. ACTIVE ABILITY: HEALING / AFFINITY
    if (fsmState === FsmState.SELECT_DISCARD_FOR_HEAL && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;

        // Validation for Color Specific Affinity
        if (ability.effectTag === 'LIGHT_AFFINITY' && card.color !== 'WHITE') {
            alert("Light Affinity requires discarding a WHITE card.");
            return;
        }
        if (ability.effectTag === 'DARK_AFFINITY' && card.color !== 'BLACK') {
            alert("Dark Affinity requires discarding a BLACK card.");
            return;
        }

        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];

            let healAmount = 0;
            if (ability.effectTag === 'MASTER_AFFINITY') {
                healAmount = card.value;
            } else {
                healAmount = Math.floor(card.value / 2) + player.level;
            }

            const maxHP = getMaxLife(player);
            player.life = Math.min(maxHP, player.life + healAmount);
            player.usedAbilitiesThisTurn.push(ability.id);

            return {
                ...prev,
                players: { ...prev.players, PLAYER: player },
                discardPile: discards,
                fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, `Used ${ability.name}. Discarded ${card.value}. Healed ${healAmount} HP.`)
            };
        });
        return;
    }

    // 4. ACTIVE ABILITY: MIND CONTROL
    if (fsmState === FsmState.SELECT_DISCARD_FOR_MIND && owner === 'PLAYER') {
        const ability = pendingAction.targetAbility;
        if (!ability) return;

        setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            const ai = { ...prev.players.AI };
            
            // Player Discard
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];

            // AI Discard Logic (Randomly removes cards)
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
                ...prev,
                players: { ...prev.players, PLAYER: player, AI: ai },
                discardPile: discards,
                fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, `Used ${ability.name}. You discarded ${card.value}. AI discarded ${aiDiscardedCount} cards.`)
            };
        });
        return;
    }

    // 5. ACTIVE ABILITY: MODIFICATION (Step 1: Pay Cost)
    if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION && owner === 'PLAYER') {
         const ability = pendingAction.targetAbility;
         if (!ability) return;

         setGameState(prev => {
            const player = { ...prev.players.PLAYER };
            player.powerHand = player.powerHand.filter(c => c.id !== card.id);
            const discards = [...prev.discardPile, card];
            player.usedAbilitiesThisTurn = [...player.usedAbilitiesThisTurn, ability.id];

            return {
                ...prev,
                players: { ...prev.players, PLAYER: player },
                discardPile: discards,
                fsmState: FsmState.SELECT_TARGET_FOR_MODIFICATION, // Next Step
                gameLog: addLog(prev, `Used ${ability.name}. Discarded ${card.value}. Now select a card in hand to modify.`)
            };
         });
         return;
    }

    // 6. ACTIVE ABILITY: MODIFICATION (Step 2: Choose Target)
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
                logMsg = `Elemental Control: Changed card to ${modCard.color}.`;
            } else if (ability.effectTag === 'MAGIC_CONTROL') {
                modCard.type = modCard.type === 'ATK' ? 'DEF' : 'ATK';
                logMsg = `Magic Control: Changed card to ${modCard.type}.`;
            } else if (ability.effectTag === 'MASTER_CONTROL') {
                // Cycle: Black Atk -> White Atk -> White Def -> Black Def -> Black Atk
                if (modCard.color === 'BLACK' && modCard.type === 'ATK') { modCard.color = 'WHITE'; }
                else if (modCard.color === 'WHITE' && modCard.type === 'ATK') { modCard.type = 'DEF'; }
                else if (modCard.color === 'WHITE' && modCard.type === 'DEF') { modCard.color = 'BLACK'; }
                else { modCard.type = 'ATK'; }
                logMsg = `Master Control: Changed card to ${modCard.value} ${modCard.color} ${modCard.type}.`;
            }

            player.powerHand[handIndex] = modCard;

            return {
                ...prev,
                players: { ...prev.players, PLAYER: player },
                fsmState: FsmState.MAIN_PHASE,
                pendingAction: { ...prev.pendingAction, targetAbility: null },
                gameLog: addLog(prev, logMsg)
            };
        });
        return;
    }

    // 7. MAIN PHASE: CARD SELECTION (Level Up or Attack)
    if (fsmState === FsmState.MAIN_PHASE && owner === 'PLAYER') {
        
        // TOGGLE: Deselect attacking card if clicked again
        if (gameState.pendingAction.attackingCard?.id === card.id) {
            setGameState(prev => ({
                ...prev,
                pendingAction: { ...prev.pendingAction, attackingCard: null }
            }));
            return;
        }

        // Logic to differentiate selecting for Level Up vs Selecting for Attack
        if (selectedCardsForLevelUp.includes(card.id)) {
            // Deselect from Level Up group
            setSelectedCardsForLevelUp(prev => prev.filter(id => id !== card.id));
        } else if (card.type === 'ATK') {
            // Select as Attacker
            setGameState(prev => ({
                ...prev,
                pendingAction: { ...prev.pendingAction, attackingCard: card }
            }));
            // Ensure it's not in level up group
            if (selectedCardsForLevelUp.includes(card.id)) {
                setSelectedCardsForLevelUp(prev => prev.filter(id => id !== card.id));
            }
        } else {
             // Add to Level Up group
             setSelectedCardsForLevelUp(prev => [...prev, card.id]);
        }
    }

    // 8. VORTEX ATTACK
    if (fsmState === FsmState.MAIN_PHASE && owner === 'VORTEX' && gameState.pendingAction.attackingCard) {
        if (index === undefined) return;
        
        // Vortex Limit Check
        const hasMasterVortex = players.PLAYER.activeAbilities.some(a => a.effectTag === 'MASTER_VORTEX');
        if (players.PLAYER.vortexAttacksPerformed >= 1 && !hasMasterVortex) {
            alert("You can only use the Vortex once per turn (unless you have Master Vortex).");
            return;
        }

        setGameState(prev => ({
            ...prev,
            fsmState: FsmState.RESOLVE_VORTEX_COMBAT,
            pendingAction: {
                ...prev.pendingAction,
                type: 'VORTEX_ATTACK',
                attackerId: 'PLAYER',
                targetId: 'AI',
                vortexCardIndex: index
            },
            gameLog: addLog(prev, "Initiating Vortex Attack...")
        }));
        setTimeout(resolveCombat, 500);
    }

    // 9. NORMAL DEFENSE SELECTION
    if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && owner === 'PLAYER' && card.type === 'DEF') {
        setGameState(prev => ({
            ...prev,
            pendingAction: { ...prev.pendingAction, defendingCard: card }
        }));
    }
    
    // 10. VORTEX DEFENSE SELECTION (Ability Required)
    if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && owner === 'VORTEX') {
        const hasVortexControl = players.PLAYER.activeAbilities.some(a => a.effectTag === 'VORTEX_CONTROL');
        if (!hasVortexControl) return;

        if (index === undefined) return;

        setGameState(prev => ({
            ...prev,
            pendingAction: { 
                ...prev.pendingAction, 
                defendingCard: null, 
                vortexDefenseIndex: index 
            }
        }));
    }
  };

  // --- HANDLER: PLAY ABILITY FROM HAND ---
  const handleAbilityClick = (ability: AbilityCard) => {
      if (gameState.fsmState !== FsmState.MAIN_PHASE) return;
      
      // Level Requirement
      if (gameState.players.PLAYER.level < ability.level) {
          alert("Level too low to use this ability.");
          return;
      }

      // Unique Active Requirement
      const isDuplicate = gameState.players.PLAYER.activeAbilities.some(a => a.effectTag === ability.effectTag);
      if (isDuplicate) {
          alert(`You already have ${ability.name} active! Abilities cannot be repeated.`);
          return;
      }

      // Route based on Ability Type (Cost vs Instant)
      if (['MAGIC_WALL', 'MAGIC_KNOWLEDGE'].includes(ability.effectTag)) {
          setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_ABILITY,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `Playing ${ability.name}. Select a card to discard as fuel.`)
          }));
      } else if (ability.effectTag === 'MIND_CONTROL') {
           setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_MIND,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `Mind Control. Select a card to discard.`)
          }));
      } else if (['ELEMENTAL_CONTROL', 'MAGIC_CONTROL', 'MASTER_CONTROL'].includes(ability.effectTag)) {
           setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_MODIFICATION,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `${ability.name}. Select a card to discard.`)
          }));
      } else {
          // Instant activation for buffs
          setGameState(prev => {
              const player = { ...prev.players.PLAYER };
              player.activeAbilities = [...player.activeAbilities, ability];
              player.abilityHand = player.abilityHand.filter(a => a.id !== ability.id);
              
              if (ability.effectTag === 'MAGIC_KNOWLEDGE') { player.maxHandSize += player.level; }
              
              return {
                  ...prev,
                  players: { ...prev.players, PLAYER: player },
                  gameLog: addLog(prev, `Activated ${ability.name}!`),
                  fsmState: FsmState.MAIN_PHASE
              };
          });
      }
  };

  // --- HANDLER: CLICK ACTIVE ABILITY (ON BOARD) ---
  const handleActiveAbilityClick = (ability: AbilityCard) => {
      if (gameState.fsmState !== FsmState.MAIN_PHASE) return;
      
      if (gameState.players.PLAYER.usedAbilitiesThisTurn.includes(ability.id)) {
          alert(`You have already used ${ability.name} this turn.`);
          return;
      }

      // MAGIC WALL
      if (ability.effectTag === 'MAGIC_WALL') {
          const currentShield = gameState.players.PLAYER.permanentShield?.value || 0;
          if (currentShield > 0) {
              alert("You already have a Shield active. It must be destroyed (reach 0) before you can create a new one.");
              return;
          }
          setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_WALL,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `Activating Magic Wall...`)
          }));
      }
      // HEALING
      else if (['MAGIC_AFFINITY', 'LIGHT_AFFINITY', 'DARK_AFFINITY', 'MASTER_AFFINITY'].includes(ability.effectTag)) {
          setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_HEAL,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `Activating ${ability.name}...`)
          }));
      }
      // MIND CONTROL
      else if (ability.effectTag === 'MIND_CONTROL') {
          setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_MIND,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `Activating ${ability.name}...`)
          }));
      }
      // MODIFICATIONS
      else if (['ELEMENTAL_CONTROL', 'MAGIC_CONTROL', 'MASTER_CONTROL'].includes(ability.effectTag)) {
          setGameState(prev => ({
              ...prev,
              fsmState: FsmState.SELECT_DISCARD_FOR_MODIFICATION,
              pendingAction: { ...prev.pendingAction, targetAbility: ability },
              gameLog: addLog(prev, `Activating ${ability.name}...`)
          }));
      }
  };

  // --- HANDLER: DRAW ABILITY (Main Phase Action) ---
  const handleDrawAbility = () => {
      if (gameState.players.PLAYER.powerHand.length === 0) return;
      if (gameState.players.PLAYER.abilitiesDrawnThisTurn >= 1) {
          alert("You can only draw 1 ability per turn.");
          return;
      }
      
      setGameState(prev => {
          const player = { ...prev.players.PLAYER };
          
          // Filter available abilities based on Level and Uniqueness
          const activeTags = player.activeAbilities.map(a => a.effectTag);
          const handTags = player.abilityHand.map(a => a.effectTag);
          
          const validIndices = prev.abilityDeck
            .map((c, i) => {
                if (c.level > player.level) return -1;
                if (activeTags.includes(c.effectTag)) return -1;
                if (handTags.includes(c.effectTag)) return -1;
                return i;
            })
            .filter(i => i !== -1);

          if (validIndices.length === 0) {
              return { ...prev, gameLog: addLog(prev, "No abilities available for your current level (or you have them all).") };
          }

          // Discard Cost & Draw
          const randIdx = Math.floor(Math.random() * player.powerHand.length);
          const discarded = player.powerHand.splice(randIdx, 1)[0];
          const discards = [...prev.discardPile, discarded];

          const drawIndexInValid = Math.floor(Math.random() * validIndices.length);
          const deckIndex = validIndices[drawIndexInValid];
          const newDeck = [...prev.abilityDeck];
          const newAbility = newDeck.splice(deckIndex, 1)[0];
          
          player.abilityHand = [...player.abilityHand, newAbility];
          player.abilitiesDrawnThisTurn += 1;

          return {
              ...prev,
              players: { ...prev.players, PLAYER: player },
              abilityDeck: newDeck,
              discardPile: discards,
              gameLog: addLog(prev, `Discarded ${discarded.value} to draw ability: ${newAbility.name}`)
          };
      });
  };

  // --- HANDLER: LEVEL UP ---
  const handleLevelUp = () => {
      const { players } = gameState;
      const player = players.PLAYER;
      const selectedCards = player.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id));
      const sum = selectedCards.reduce((acc, c) => acc + c.value, 0);
      
      // Constraints
      if (player.level >= 3) { alert("Maximum level (3) reached."); return; }
      if (player.levelUpsPerformed >= 1) { alert("You can only level up once per turn."); return; }
      if (sum < 10) { alert("Selected cards must sum to at least 10."); return; }

      setGameState(prev => {
          const newPlayer = { ...prev.players.PLAYER };
          newPlayer.powerHand = newPlayer.powerHand.filter(c => !selectedCardsForLevelUp.includes(c.id));
          const newDiscard = [...prev.discardPile, ...selectedCards];
          
          newPlayer.level += 1;
          newPlayer.levelUpsPerformed += 1;
          
          // Apply immediate scaling effects
          if (newPlayer.activeAbilities.some(a => a.effectTag === 'MAGIC_KNOWLEDGE')) {
              newPlayer.maxHandSize += 1; 
          }

          return {
              ...prev,
              players: { ...prev.players, PLAYER: newPlayer },
              discardPile: newDiscard,
              gameLog: addLog(prev, `Leveled Up! Now Level ${newPlayer.level}.`)
          };
      });
      setSelectedCardsForLevelUp([]);
  };

  // --- HANDLER: CONFIRMATION ACTIONS ---
  const handleConfirmAction = (action: string) => {
      // 1. End Turn
      if (action === 'END_TURN') {
          if (gameState.fsmState === FsmState.MAIN_PHASE) {
              setGameState(prev => ({
                  ...prev,
                  currentPlayer: 'AI',
                  fsmState: FsmState.START_TURN,
                  pendingAction: { ...prev.pendingAction, attackingCard: null },
                  selectedCardsForLevelUp: []
              }));
              setSelectedCardsForLevelUp([]);
          }
      }

      // 2. Direct Attack
      if (action === 'ATTACK_DIRECT' && gameState.pendingAction.attackingCard) {
          setGameState(prev => ({
              ...prev,
              fsmState: FsmState.AWAITING_AI_DEFENSE,
              pendingAction: {
                  ...prev.pendingAction,
                  type: 'DIRECT_ATTACK',
                  attackerId: 'PLAYER',
                  targetId: 'AI'
              }
          }));
          setTimeout(runAiDefenseLogic, 1000);
      }

      // 3. Player Defends
      if (action === 'DEFEND_WITH_CARD') {
          setGameState(prev => ({ ...prev, fsmState: FsmState.RESOLVE_DIRECT_COMBAT }));
          setTimeout(resolveCombat, 500);
      }

      // 4. Player Takes Damage
      if (action === 'NO_DEFENSE') {
          setGameState(prev => ({
              ...prev,
              pendingAction: { ...prev.pendingAction, defendingCard: null, vortexDefenseIndex: null },
              fsmState: FsmState.RESOLVE_DIRECT_COMBAT
          }));
          setTimeout(resolveCombat, 500);
      }
  };

  // --- AI DEFENSE LOGIC ---
  const runAiDefenseLogic = () => {
      setGameState(prev => {
          const ai = prev.players.AI;
          const attackCard = prev.pendingAction.attackingCard!;
          
          let chosenDef: Card | null = null;
          const defCards = ai.powerHand.filter(c => c.type === 'DEF');
          // Simple logic: Try to find opposite color first, else match first defense
          if (defCards.length > 0) {
              const opposite = defCards.find(c => c.color !== attackCard.color);
              chosenDef = opposite || defCards[0];
          }

          const logMsg = chosenDef 
              ? `AI defends with ${chosenDef.value} ${chosenDef.color}.`
              : `AI decides not to defend.`;

          return {
              ...prev,
              gameLog: addLog(prev, logMsg),
              pendingAction: { ...prev.pendingAction, defendingCard: chosenDef },
              fsmState: FsmState.RESOLVE_DIRECT_COMBAT
          };
      });
      setTimeout(resolveCombat, 1000);
  };

  // --- COMBAT RESOLUTION ---
  const resolveCombat = () => {
      setGameState(prev => {
          const pending = prev.pendingAction;
          const attacker = prev.players[pending.attackerId!];
          const defender = prev.players[pending.targetId!];
          
          let result;
          
          // Calculate Result based on Combat Type
          if (pending.type === 'VORTEX_ATTACK') {
               const vIndex = pending.vortexCardIndex!;
               const vCard = prev.vortexCards[vIndex]!;
               result = calculateVortexDamage(pending.attackingCard!, vCard, attacker, defender);
          } else {
              if (pending.vortexDefenseIndex !== null) {
                  // Player used Vortex as Defense
                  const vCard = prev.vortexCards[pending.vortexDefenseIndex]!;
                  result = calculateVortexDamage(pending.attackingCard!, vCard, attacker, defender);
                  result.logMessage = `VORTEX DEFENSE! ` + result.logMessage;
              } else {
                  // Standard Combat
                  result = calculateDirectDamage(pending.attackingCard!, pending.defendingCard, attacker, defender);
              }
          }

          // Apply Damage
          const newPlayers = { ...prev.players };
          if (result.targetId) {
              const target = newPlayers[result.targetId];
              target.life = Math.max(0, target.life - result.damage);
          }
          // Update Shield
          if (result.shieldRemaining !== undefined && pending.targetId) {
             const def = newPlayers[pending.targetId];
             if (def.permanentShield) def.permanentShield.value = result.shieldRemaining;
          }

          // Update Counters
          if (pending.type === 'VORTEX_ATTACK' && pending.attackerId === 'PLAYER') {
               newPlayers.PLAYER.vortexAttacksPerformed += 1;
          }

          return {
              ...prev,
              players: newPlayers,
              gameLog: [...prev.gameLog, result.logMessage],
              fsmState: FsmState.SHOWDOWN 
          };
      });
  };

  // --- END OF TURN CLEANUP ---
  const finalizeTurn = () => {
      setGameState(prev => {
          const pending = prev.pendingAction;
          const newPlayers = { ...prev.players };
          let discardUpdate = [...prev.discardPile];
          let vortexUpdate = [...prev.vortexCards];
          let powerDeckUpdate = [...prev.powerDeck];

          // Discard played cards
          if (pending.attackerId && pending.attackingCard) {
              newPlayers[pending.attackerId].powerHand = newPlayers[pending.attackerId].powerHand.filter(c => c.id !== pending.attackingCard?.id);
              discardUpdate.push(pending.attackingCard);
          }
          if (pending.targetId && pending.defendingCard) {
              newPlayers[pending.targetId].powerHand = newPlayers[pending.targetId].powerHand.filter(c => c.id !== pending.defendingCard?.id);
              discardUpdate.push(pending.defendingCard);
          }

          // Cycle Used Vortex Cards
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

          // Next State Logic
          let nextFsm: FsmState;
          let currentPlayerOverride = prev.currentPlayer;

          if (prev.currentPlayer === 'PLAYER') {
             // AUTO-END TURN RULE: Using Vortex ends turn immediately (unless Master Vortex)
             const wasVortexAttack = pending.type === 'VORTEX_ATTACK';
             const hasMasterVortex = newPlayers.PLAYER.activeAbilities.some(a => a.effectTag === 'MASTER_VORTEX');
             
             if (wasVortexAttack && !hasMasterVortex) {
                 nextFsm = FsmState.START_TURN; 
                 currentPlayerOverride = 'AI';
             } else {
                 nextFsm = FsmState.MAIN_PHASE;
             }
          } else {
             // AI always returns to its decision logic
             nextFsm = FsmState.AI_TURN_LOGIC;
          }
          
          // Win/Loss Check
          let status: 'PLAYING' | 'GAME_OVER' = 'PLAYING';
          let log = [...prev.gameLog];
          let winner: PlayerId | null = prev.winner;

          if (newPlayers.PLAYER.life <= 0) {
              status = 'GAME_OVER';
              nextFsm = FsmState.GAME_OVER;
              winner = 'AI';
              log.push("GAME OVER. You have been defeated by the Vortex.");
          } else if (newPlayers.AI.life <= 0) {
              status = 'GAME_OVER';
              nextFsm = FsmState.GAME_OVER;
              winner = 'PLAYER';
              log.push("VICTORY! You have survived the Vortex.");
          }

          return {
              ...prev,
              players: newPlayers,
              currentPlayer: currentPlayerOverride,
              winner: winner,
              discardPile: discardUpdate,
              vortexCards: vortexUpdate,
              powerDeck: powerDeckUpdate,
              gameLog: log,
              // Full Reset of Pending Action
              pendingAction: { 
                  type: null, 
                  attackerId: null, 
                  targetId: null, 
                  attackingCard: null, 
                  defendingCard: null, 
                  vortexCardIndex: null, 
                  vortexDefenseIndex: null,
                  targetAbility: null 
              },
              fsmState: nextFsm,
              gameStatus: status
          };
      });
  };

  const validTargetIds = selectedCardsForLevelUp;

  // --- RENDER ---
  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col font-lato overflow-hidden relative">
      
      {/* VISUAL EFFECTS OVERLAY */}
      <EndGameEffects outcome={gameState.winner === 'PLAYER' ? 'VICTORY' : gameState.winner === 'AI' ? 'DEFEAT' : null} />

      {/* NEW: HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-purple-500 rounded-xl p-6 max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                >
                    ✕
                </button>
                <h3 className="text-2xl font-cinzel text-purple-300 mb-4 border-b border-purple-900/50 pb-2">{LORE_TITLE}</h3>
                <div className="text-slate-300 text-sm leading-relaxed font-serif">
                    {LORE_TEXT}
                </div>
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => setShowHistoryModal(false)}
                        className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded border border-purple-500 transition-colors"
                    >
                        Close History
                    </button>
                </div>
            </div>
        </div>
      )}

      <header className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg z-10 shrink-0">
        <h1 className="text-2xl text-purple-400 tracking-widest font-bold font-cinzel">MAGICAL VORTEX</h1>
        <div className="text-sm text-slate-400">{gameState.uiMessage}</div>
      </header>

      <main className="h-full p-2 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-4 z-10 overflow-hidden">
        
        {/* LEFT COLUMN: GAME BOARDS & MENUS */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1">
            
            {/* 1. START SCREEN WITH LORE */}
            {gameState.gameStatus === 'PRE_GAME' && (
                <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="text-center max-w-2xl">
                        <h2 className="text-5xl font-cinzel text-purple-400 mb-6 drop-shadow-lg">Enter the Vortex</h2>
                        
                        {/* Intro Lore Box */}
                        <div className="bg-slate-900/80 p-6 rounded-lg border-l-4 border-purple-500 text-left mb-8 shadow-inner">
                            <h3 className="font-cinzel text-xl text-slate-200 mb-3">{LORE_TITLE}</h3>
                            <div className="text-slate-400 text-sm leading-relaxed font-serif italic">
                                {LORE_TEXT}
                            </div>
                        </div>

                        <button onClick={startGame} className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-4 px-10 rounded-lg shadow-xl border border-purple-400 transition-all transform hover:scale-105">
                            START GAME
                        </button>
                    </div>
                </div>
            )}

            {/* 2. CHARACTER SELECTION WITH AFFINITY STYLES */}
            {gameState.fsmState === FsmState.PLAYER_CHOSE_CHAR && (
                <div className="flex-1 p-6 bg-slate-800 rounded-xl border border-slate-700 overflow-y-auto">
                    <h2 className="text-3xl font-cinzel text-center text-white mb-8">Select Your Character</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {CHARACTERS.map(char => {
                            const ability = getAbilityByTag(char.startingAbilityTag);
                            
                            // Determine Style based on Affinity
                            let cardStyle = "bg-slate-900 border-slate-600";
                            let textStyle = "text-slate-400";
                            if (char.affinityColor === 'WHITE') {
                                cardStyle = "bg-slate-200/5 border-yellow-200/60 shadow-[0_0_10px_rgba(254,240,138,0.1)]";
                                textStyle = "text-yellow-100";
                            } else if (char.affinityColor === 'BLACK') {
                                cardStyle = "bg-black/40 border-purple-900/80 shadow-[0_0_10px_rgba(88,28,135,0.2)]";
                                textStyle = "text-purple-200";
                            }

                            return (
                                <div 
                                    key={char.id}
                                    onClick={() => handleCharacterSelect(char)}
                                    className={`${cardStyle} p-4 rounded-xl border-2 hover:border-blue-400 hover:scale-105 transition-all cursor-pointer flex flex-col items-center gap-3 group`}
                                >
                                    <div className="text-5xl group-hover:animate-bounce">{char.avatar}</div>
                                    <div className="font-bold text-lg font-cinzel text-white">{char.name}</div>
                                    <div className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-slate-950/50 ${textStyle}`}>
                                        {char.affinityColor} Affinity
                                    </div>
                                    {ability && (
                                        <div className="mt-2 text-center w-full bg-slate-950/30 p-2 rounded">
                                            <div className="text-xs font-bold text-blue-300">{ability.name}</div>
                                            <div className="text-[10px] text-slate-400 leading-tight mt-1">{ability.description}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* 3. GAME OVER */}
            {gameState.gameStatus === 'GAME_OVER' && (
                 // ... (Game Over block remains same) ...
                 <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700 relative z-20">
                    <div className="text-center p-8 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-500 shadow-2xl">
                        <h2 className={`text-5xl font-cinzel mb-4 ${gameState.winner === 'PLAYER' ? 'text-yellow-400' : 'text-red-500'}`}>
                            {gameState.winner === 'PLAYER' ? "VICTORY" : "DEFEAT"}
                        </h2>
                        <div className="text-slate-300 mb-6 font-mono">
                            {gameState.winner === 'PLAYER' ? "You have survived the Vortex!" : "You have been consumed by the chaos."}
                        </div>
                        <button onClick={startGame} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg border-2 border-slate-400">PLAY AGAIN</button>
                    </div>
                 </div>
            )}

            {/* 4. MAIN GAME BOARD */}
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
                    selectedCardId={gameState.pendingAction.attackingCard?.id || gameState.pendingAction.defendingCard?.id || null}
                    selectedAbilityId={gameState.pendingAction.targetAbility?.id || null}
                    validTargetIds={validTargetIds}
                />
            )}
            
            {/* 5. ACTION CONTROL BAR (Remains same) */}
            {gameState.gameStatus === 'PLAYING' && gameState.fsmState !== FsmState.PLAYER_CHOSE_CHAR && (
                // ... (Action bar code remains same) ...
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex gap-4 items-center min-h-[80px] flex-wrap">
                    <div className="text-slate-400 text-sm font-mono mr-auto w-full lg:w-auto mb-2 lg:mb-0">
                         {/* ... (Prompt logic remains same) ... */}
                        {gameState.fsmState === FsmState.SHOWDOWN 
                            ? "COMBAT RESOLVED! Revealing..."
                            : gameState.fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY 
                            ? `To play ${gameState.pendingAction.targetAbility?.name}, select a card to discard as cost...`
                            : gameState.fsmState === FsmState.SELECT_DISCARD_FOR_HEAL 
                            ? `Activating ${gameState.pendingAction.targetAbility?.name}: Select a card to discard for healing...`
                            : gameState.fsmState === FsmState.SELECT_DISCARD_FOR_WALL 
                            ? `Activating Magic Wall: Discard a card to create your Shield...`
                            : gameState.fsmState === FsmState.SELECT_DISCARD_FOR_MIND
                            ? `Activating ${gameState.pendingAction.targetAbility?.name}: Discard a card to attack AI hand...`
                            : gameState.fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION
                            ? `Activating ${gameState.pendingAction.targetAbility?.name}: Discard a card to proceed...`
                            : gameState.fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION
                            ? `Activating ${gameState.pendingAction.targetAbility?.name}: Select a card in your hand to modify...`
                            : gameState.pendingAction.attackingCard 
                                ? `Attack with: ${gameState.pendingAction.attackingCard.value}` 
                                : selectedCardsForLevelUp.length > 0 
                                    ? `Selected for Level: ${selectedCardsForLevelUp.length} (Sum: ${gameState.players.PLAYER.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id)).reduce((a,b)=>a+b.value,0)})` 
                                    : "Select an action..."}
                    </div>
                     {/* ... (Buttons remain same) ... */}
                     {gameState.fsmState === FsmState.MAIN_PHASE && (
                        <>
                             <button 
                                onClick={handleDrawAbility}
                                disabled={gameState.players.PLAYER.powerHand.length === 0}
                                className={`px-3 py-1 bg-indigo-900/50 text-indigo-200 border border-indigo-700 rounded text-xs ${gameState.players.PLAYER.abilitiesDrawnThisTurn >= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-800'}`}
                            >
                                DRAW ABILITY (Discard 1)
                            </button>

                            <button 
                                onClick={handleLevelUp}
                                disabled={
                                    gameState.players.PLAYER.level >= 3 || 
                                    gameState.players.PLAYER.levelUpsPerformed >= 1 ||
                                    gameState.players.PLAYER.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id)).reduce((a,b)=>a+b.value,0) < 10
                                }
                                className={`px-4 py-2 rounded font-bold ${
                                    gameState.players.PLAYER.level >= 3 || gameState.players.PLAYER.levelUpsPerformed >= 1 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                                    gameState.players.PLAYER.powerHand.filter(c => selectedCardsForLevelUp.includes(c.id)).reduce((a,b)=>a+b.value,0) >= 10 ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                {gameState.players.PLAYER.level >= 3 ? "MAX LEVEL" : "LEVEL UP (10pts)"}
                            </button>

                            <button 
                                disabled={!gameState.pendingAction.attackingCard}
                                onClick={() => handleConfirmAction('ATTACK_DIRECT')}
                                className={`px-4 py-2 rounded font-bold ${gameState.pendingAction.attackingCard ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                ATTACK DIRECT
                            </button>
                            
                            <button 
                                onClick={() => handleConfirmAction('END_TURN')}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold"
                            >
                                END TURN
                            </button>
                        </>
                    )}
                    
                    {/* Defense Phase Buttons */}
                    {gameState.fsmState === FsmState.AWAITING_PLAYER_DEFENSE && (
                        <>
                             <button 
                                disabled={!gameState.pendingAction.defendingCard && gameState.pendingAction.vortexDefenseIndex === null}
                                onClick={() => handleConfirmAction('DEFEND_WITH_CARD')}
                                className={`px-4 py-2 rounded font-bold ${gameState.pendingAction.defendingCard || gameState.pendingAction.vortexDefenseIndex !== null ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'}`}
                            >
                                {gameState.pendingAction.vortexDefenseIndex !== null ? 'CONFIRM VORTEX' : 'CONFIRM DEFENSE'}
                            </button>
                            <button 
                                onClick={() => handleConfirmAction('NO_DEFENSE')}
                                className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded font-bold"
                            >
                                TAKE DAMAGE
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: LOGS & RULES - UPDATED LAYOUT */}
        <div className="lg:col-span-1 flex flex-col gap-2 h-full overflow-hidden">
            
            {/* 1. BATTLE LOG - Grows to fill space */}
            <div className="flex-1 min-h-0 bg-slate-800 rounded-lg border border-slate-700 shadow-inner flex flex-col overflow-hidden relative">
                {/* Wrapped GameLog to ensure it catches height */}
                <div className="absolute inset-0 flex flex-col">
                    <GameLog logs={gameState.gameLog} />
                </div>
            </div>

            {/* 2. COMPACT RULES & HISTORY */}
            <div className="shrink-0 p-3 bg-slate-800 rounded-lg border border-slate-700 text-[11px] leading-tight text-slate-400 font-mono shadow-md">
                <h4 className="font-bold text-slate-200 mb-1 text-xs">QUICK RULES</h4>
                <ul className="space-y-1 list-disc list-inside">
                    <li>Opposite Colors: <span className="text-white">Atk - Def</span></li>
                    <li>Same Colors: <span className="text-white">Atk - floor(Def/2)</span></li>
                    <li>Level Up: Cards sum &ge; 10. Max Lv 3.</li>
                    <li>Ability: Discard 1 to draw.</li>
                    <li>Vortex: Same + ; Diff -</li>
                    <li><b>Vortex Attack ends turn.</b></li>
                </ul>
                
                {/* NEW: History Link */}
                <div className="mt-2 pt-2 border-t border-slate-700 text-center">
                    <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="text-purple-400 hover:text-purple-300 underline text-xs font-bold font-cinzel tracking-wider"
                    >
                        📜 READ LORE & HISTORY
                    </button>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;
