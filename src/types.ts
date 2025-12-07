

/**
 * TYPE DEFINITIONS
 * This file contains all the interfaces and types used to manage the global game state.
 */

export type CardType = 'ATK' | 'DEF';
export type CardColor = 'BLACK' | 'WHITE';
export type PlayerId = 'PLAYER' | 'AI';
export type Language = 'en' | 'es' | 'ca';

/**
 * FINITE STATE MACHINE (FSM)
 * Replaced 'enum' with 'const object' to satisfy erasableSyntaxOnly settings.
 * This acts exactly like the enum but is safer for modern bundlers.
 */
export const FsmState = {
  INIT: 'INIT', // Initial load
  PLAYER_CHOSE_CHAR: 'PLAYER_CHOSE_CHAR', // Character selection screen
  START_GAME: 'START_GAME', // Setup (dealing hands)
  START_TURN: 'START_TURN', // Resetting turn counters
  DRAW_PHASE: 'DRAW_PHASE', // Player drawing cards
  MAIN_PHASE: 'MAIN_PHASE', // Main interaction phase (Play cards, abilities, attack)
  
  // Combat Phases
  SELECT_ATTACK_CARD: 'SELECT_ATTACK_CARD', // NEW: Player clicked Attack without selection
  AWAITING_AI_DEFENSE: 'AWAITING_AI_DEFENSE', // Player attacked, AI thinking
  AWAITING_PLAYER_DEFENSE: 'AWAITING_PLAYER_DEFENSE', // AI attacked, Player selects defense
  RESOLVE_DIRECT_COMBAT: 'RESOLVE_DIRECT_COMBAT', // Calculating math for standard combat
  RESOLVE_VORTEX_COMBAT: 'RESOLVE_VORTEX_COMBAT', // Calculating math for vortex interactions
  
  // Ability Interaction Phases (Cost Payment)
  SELECT_DISCARD_FOR_DRAW: 'SELECT_DISCARD_FOR_DRAW', // NEW: Discarding to draw ability
  SELECT_DISCARD_FOR_ABILITY: 'SELECT_DISCARD_FOR_ABILITY', // Discarding to play a card from hand
  SELECT_DISCARD_FOR_HEAL: 'SELECT_DISCARD_FOR_HEAL', // Discarding for Affinity/Healing
  SELECT_DISCARD_FOR_MIND: 'SELECT_DISCARD_FOR_MIND', // Discarding for Mind Control
  SELECT_DISCARD_FOR_MODIFICATION: 'SELECT_DISCARD_FOR_MODIFICATION', // Discarding for Elemental/Magic/Master Control
  SELECT_TARGET_FOR_MODIFICATION: 'SELECT_TARGET_FOR_MODIFICATION', // Choosing the card to modify after paying cost
  SELECT_DISCARD_FOR_WALL: 'SELECT_DISCARD_FOR_WALL', // Discarding to activate Magic Wall from active bar
  
  // Generic Actions
  SELECT_DISCARD_GENERIC: 'SELECT_DISCARD_GENERIC', // NEW: Generic discard action
  
  // Level Up Phase
  SELECT_CARDS_FOR_LEVEL_UP: 'SELECT_CARDS_FOR_LEVEL_UP', // NEW: Selecting multiple cards to sum 10

  SHOWDOWN: 'SHOWDOWN', // 3-second delay to reveal cards before cleanup
  AI_TURN_LOGIC: 'AI_TURN_LOGIC', // AI processing its turn
  GAME_OVER: 'GAME_OVER' // End screen
} as const;

export type FsmState = typeof FsmState[keyof typeof FsmState];

// Data model for a playable card (Attack or Defense)
export interface Card {
  id: string;
  type: CardType;
  color: CardColor;
  value: number;
}

// Data model for Special Abilities
export interface AbilityCard {
  id: string;
  name: string;
  level: number;
  description: string;
  effectTag: string; // Used for logic identification (e.g., 'MAGIC_WALL')
}

// Data model for Characters
export interface Character {
    id: string;
    name: string;
    avatar: string;
    startingAbilityTag: string;
    affinityColor: 'WHITE' | 'BLACK' | 'NEUTRAL';
}

// Data model for a Player (Human or AI)
export interface Player {
  id: PlayerId;
  character: Character | null;
  life: number;
  level: number;
  maxHandSize: number;
  powerHand: Card[]; // Current cards in hand
  abilityHand: AbilityCard[]; // Unplayed abilities in hand
  activeAbilities: AbilityCard[]; // Abilities currently in play (Passive or Active)
  permanentShield: { value: number } | null; // Magic Wall state
  levelUpProgress: number; 
  
  // Turn Constraints & Counters
  usedAbilitiesThisTurn: string[]; // IDs of abilities used (to prevent spam)
  attacksPerformed: number; // Max 2 per turn
  vortexAttacksPerformed: number; // Max 1 per turn (unless Master Vortex)
  levelUpsPerformed: number; // Max 1 per turn
  abilitiesDrawnThisTurn: number; // Max 1 per turn
}

// Tracks the current interaction being processed
export interface PendingAction {
  type: 'DIRECT_ATTACK' | 'VORTEX_ATTACK' | 'VORTEX_DEFENSE' | 'PLAY_ABILITY' | 'USE_ACTIVE_ABILITY' | null;
  attackerId: PlayerId | null;
  targetId: PlayerId | null;
  attackingCard: Card | null;
  defendingCard: Card | null;
  vortexCardIndex: number | null; // Which Vortex card is being used for attack
  vortexDefenseIndex: number | null; // Which Vortex card is being used for defense
  targetAbility: AbilityCard | null; // Which ability is waiting for a cost (discard)
}

// The Single Source of Truth for the Game
export interface GameState {
  gameStatus: 'PRE_GAME' | 'PLAYING' | 'GAME_OVER';
  fsmState: FsmState;
  currentPlayer: PlayerId;
  winner: PlayerId | null;
  
  players: {
    PLAYER: Player;
    AI: Player;
  };
  
  powerDeck: Card[]; // Main draw pile
  abilityDeck: AbilityCard[]; // Ability draw pile
  discardPile: Card[];
  vortexCards: (Card | null)[]; // The 4 center cards
  
  gameLog: string[]; // Battle history
  pendingAction: PendingAction; // Action currently being constructed
  uiMessage: string; // Status bar text
  
  aiActionQueue: string[]; // Helper for AI sequencing
}