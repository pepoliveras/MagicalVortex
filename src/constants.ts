
import { FsmState } from './types';
import type { Card, AbilityCard, GameState, Character } from './types';

export const INITIAL_LIFE = 40;
export const MAX_HAND_SIZE = 5;

/**
 * GENERATE POWER DECK
 * Creates the standard deck of 80 cards:
 * - 40 White, 40 Black
 * - Per Color: 20 Attack, 20 Defense
 * - Values 1-10 (Two copies of each value per type/color)
 */
export const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  const colors: ('BLACK' | 'WHITE')[] = ['BLACK', 'WHITE'];
  const types: ('ATK' | 'DEF')[] = ['ATK', 'DEF'];

  let idCounter = 1;

  colors.forEach(color => {
    types.forEach(type => {
      for (let val = 1; val <= 10; val++) {
        // Add two copies of each card configuration
        deck.push({ id: `c-${idCounter++}`, type, color, value: val });
        deck.push({ id: `c-${idCounter++}`, type, color, value: val });
      }
    });
  });

  return shuffle(deck);
};

/**
 * ABILITIES DATA V2.0
 * Defines the rules and effects for all 20 unique abilities.
 * Includes Affinity property.
 */
export const ABILITIES_LIST: Omit<AbilityCard, 'id'>[] = [
    // NEUTRAL ABILITIES
    { name: 'Magic Wall', icon: '🧱', level: 1, description: 'Discard a card to create a permanent shield.', effectTag: 'MAGIC_WALL', affinity: 'NEUTRAL' },
    // DISABLED: Magic Affinity
    // { name: 'Magic Affinity', icon: '❤️', level: 1, description: 'Discard 1. Heal Value/2 + Level.', effectTag: 'MAGIC_AFFINITY', affinity: 'NEUTRAL' },
    { name: 'Magic Vision', icon: '🪬', level: 1, description: 'Discard 1. Reveal opponent hand.', effectTag: 'MAGIC_VISION', affinity: 'NEUTRAL' },
    { name: 'Magic Knowledge', icon: '📖', level: 1, description: 'Max Hand Size +Level.', effectTag: 'MAGIC_KNOWLEDGE', affinity: 'NEUTRAL' },
    { name: 'Magic Resistance', icon: '💪', level: 1, description: 'Max HP +10 per Level.', effectTag: 'MAGIC_RESISTANCE', affinity: 'NEUTRAL' },
    { name: 'Mind Control', icon: '🧠', level: 2, description: 'Discard 1. Opponent discards N cards.', effectTag: 'MIND_CONTROL', affinity: 'NEUTRAL' },
    { name: 'Elemental Control', icon: '🔄️', level: 2, description: 'Discard 1. Change card color.', effectTag: 'ELEMENTAL_CONTROL', affinity: 'NEUTRAL' },
    { name: 'Magic Control', icon: '🔀', level: 2, description: 'Discard 1. Change card type.', effectTag: 'MAGIC_CONTROL', affinity: 'NEUTRAL' },
    { name: 'Vortex Control', icon: '🌀', level: 2, description: 'Use Vortex for Defense once per turn.', effectTag: 'VORTEX_CONTROL', affinity: 'NEUTRAL' },
    // DISABLED: Master Control
    // { name: 'Master Control', icon: '♻️', level: 3, description: 'Discard 1. Change color or type.', effectTag: 'MASTER_CONTROL', affinity: 'NEUTRAL' },
    { name: 'Master Affinity', icon: '💖', level: 3, description: 'Discard 1. Heal full Value.', effectTag: 'MASTER_AFFINITY', affinity: 'NEUTRAL' },
    { name: 'Master Vortex', icon: '♾️', level: 3, description: 'Use Vortex for Attack unlimited times.', effectTag: 'MASTER_VORTEX', affinity: 'NEUTRAL' },

    // WHITE ABILITIES
    { name: 'Light Defense', icon: '🛡️', level: 1, description: 'White Def cards +Level.', effectTag: 'LIGHT_DEFENSE', affinity: 'WHITE' },
    { name: 'Paladin of Light', icon: '⚔️', level: 1, description: 'White Atk cards +Level.', effectTag: 'PALADIN_OF_LIGHT', affinity: 'WHITE' },
    { name: 'Light Affinity', icon: '🤍', level: 2, description: 'Discard White card. Heal Value/2 + Level.', effectTag: 'LIGHT_AFFINITY', affinity: 'WHITE' },
    { name: 'Acolyte of Light', icon: '🔆', level: 3, description: 'Reduce incoming White Atk by half.', effectTag: 'ACOLYTE_OF_LIGHT', affinity: 'WHITE' },

    // BLACK ABILITIES
    { name: 'Dark Defense', icon: '🛡️', level: 1, description: 'Black Def cards +Level.', effectTag: 'DARK_DEFENSE', affinity: 'BLACK' },
    { name: 'Dark Lord', icon: '⚔️', level: 1, description: 'Black Atk cards +Level.', effectTag: 'DARK_LORD', affinity: 'BLACK' },
    { name: 'Dark Affinity', icon: '🖤', level: 2, description: 'Discard Black card. Heal Value/2 + Level.', effectTag: 'DARK_AFFINITY', affinity: 'BLACK' },
    { name: 'Dark Servant', icon: '🌑', level: 3, description: 'Reduce incoming Black Atk by half.', effectTag: 'DARK_SERVANT', affinity: 'BLACK' }
];

/**
 * CHARACTER ROSTER
 * The 12 playable characters with their starting abilities and affinity colors.
 * ORDERED: White -> Black -> Neutral
 */
export const CHARACTERS: Character[] = [
    // WHITE AFFINITY
    { id: 'char1', name: 'Druid', avatar: '🧙‍♂️', startingAbilityTag: 'ELEMENTAL_CONTROL', affinityColor: 'WHITE' },
    { id: 'char3', name: 'Angelus', avatar: '👼', startingAbilityTag: 'LIGHT_AFFINITY', affinityColor: 'WHITE' },
    { id: 'char5', name: 'Monk', avatar: '🧘', startingAbilityTag: 'LIGHT_DEFENSE', affinityColor: 'WHITE' },
    { id: 'char8', name: 'LightingCat', avatar: '🦁', startingAbilityTag: 'PALADIN_OF_LIGHT', affinityColor: 'WHITE' },
    
    // BLACK AFFINITY
    { id: 'char2', name: 'Lizard', avatar: '🦎', startingAbilityTag: 'MAGIC_CONTROL', affinityColor: 'BLACK' },
    { id: 'char4', name: 'Diabolus', avatar: '👿', startingAbilityTag: 'DARK_LORD', affinityColor: 'BLACK' },
    { id: 'char6', name: 'Insectoid', avatar: '🦟', startingAbilityTag: 'DARK_DEFENSE', affinityColor: 'BLACK' },
    { id: 'char7', name: 'Necro', avatar: '💀', startingAbilityTag: 'DARK_AFFINITY', affinityColor: 'BLACK' },

    // NEUTRAL AFFINITY
    { id: 'char9', name: 'Shaman', avatar: '👺', startingAbilityTag: 'MAGIC_VISION', affinityColor: 'NEUTRAL' },
    { id: 'char10', name: 'Techno', avatar: '🤖', startingAbilityTag: 'MAGIC_KNOWLEDGE', affinityColor: 'NEUTRAL' },
    { id: 'char11', name: 'Mystic', avatar: '🔮', startingAbilityTag: 'MAGIC_WALL', affinityColor: 'NEUTRAL' },
    { id: 'char12', name: 'Elemental', avatar: '💧', startingAbilityTag: 'VORTEX_CONTROL', affinityColor: 'NEUTRAL' },
];

/**
 * GENERATE ABILITY DECK
 * Creates a deck with exactly one copy of each ability.
 */
export const generateAbilityDeck = (): AbilityCard[] => {
    const deck = ABILITIES_LIST.map((ab, i) => ({
        ...ab,
        id: `ab-${i}-${ab.effectTag}`
    }));
    return shuffle(deck);
};

// Fisher-Yates Shuffle Algorithm
export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Helper to retrieve starting ability for character assignment
export const getAbilityByTag = (tag: string): AbilityCard | undefined => {
    const base = ABILITIES_LIST.find(a => a.effectTag === tag);
    if (!base) return undefined;
    return { ...base, id: `start-${tag}` };
};

/**
 * INITIAL STATE FACTORY
 * Resets the game to a clean slate.
 * round: Determines AI starting stats.
 */
export const createInitialState = (round: number = 1): GameState => {
  const deck = generateDeck();
  const abilities = generateAbilityDeck();

  // Round Logic
  // Round 1 (Initial): 40 HP
  // Round 2 (Intermediate): 50 HP
  // Round 3 (Advanced): 60 HP
  const aiHp = round === 1 ? 40 : round === 2 ? 50 : 60;

  return {
    gameStatus: 'PRE_GAME',
    fsmState: FsmState.INIT,
    currentPlayer: 'PLAYER',
    winner: null,
    round: round,
    players: {
      PLAYER: {
        id: 'PLAYER',
        character: null, // Assigned in selection phase
        life: INITIAL_LIFE,
        level: 1, // Rule: Start at Level 1
        maxHandSize: MAX_HAND_SIZE,
        powerHand: [],
        abilityHand: [],
        activeAbilities: [], 
        permanentShield: null,
        levelUpProgress: 0,
        isHandRevealed: false,
        usedAbilitiesThisTurn: [],
        attacksPerformed: 0,
        vortexAttacksPerformed: 0,
        vortexDefensesPerformed: 0, // NEW: Counter
        levelUpsPerformed: 0,
        abilitiesDrawnThisTurn: 0
      },
      AI: {
        id: 'AI',
        character: null, // Assigned in selection phase
        life: aiHp,
        level: 1, // AI Always starts at 1, but intermediate/advanced can level up
        maxHandSize: MAX_HAND_SIZE, 
        powerHand: [],
        abilityHand: [],
        activeAbilities: [],
        permanentShield: null,
        levelUpProgress: 0,
        isHandRevealed: false,
        usedAbilitiesThisTurn: [],
        attacksPerformed: 0,
        vortexAttacksPerformed: 0,
        vortexDefensesPerformed: 0,
        levelUpsPerformed: 0,
        abilitiesDrawnThisTurn: 0
      }
    },
    powerDeck: deck,
    abilityDeck: abilities,
    discardPile: [],
    vortexCards: [], // Filled during START_GAME
    gameLog: ["Welcome to Magical Vortex.", "Choose your Character."],
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
    uiMessage: "Welcome.",
    aiActionQueue: []
  };
};
