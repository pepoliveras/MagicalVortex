import { Language } from './types';

// Define strict types for translations to prevent runtime errors
interface UI {
    startGame: string;
    enterVortex: string;
    chooseChar: string;
    opponent: string;
    player: string;
    life: string;
    level: string;
    attacks: string;
    shield: string;
    abilities: string;
    empty: string;
    vortexLabel: string;
    drawAbility: string;
    levelUp: string;
    maxLevel: string;
    attackDirect: string;
    endTurn: string;
    confirmDef: string;
    confirmVortex: string;
    takeDmg: string;
    victory: string;
    defeat: string;
    playAgain: string;
    readLore: string;
    readRules: string;
    abilityGuide: string;
    closeHistory: string;
    closeRules: string;
    closeGuide: string;
    quickRules: string;
    rulesList: string[];
    waiting: string;
    activate: string;
    confirm: string;
    cancel: string;
    combatResolved: string;
    attackWith: string;
    discard: string;
    round: string;
    aiLevel: string;
    levelBeg: string;
    levelInt: string;
    levelAdv: string;
    roundClear: string;
    nextRound: string;
    roundDesc: string;
    finalVictory: string;
}

interface Rules {
    title: string;
    goal: { title: string; text: string };
    cards: { title: string; text: string };
    combat: { title: string; text: string };
    vortex: { title: string; text: string };
    leveling: { title: string; text: string };
    abilities: { title: string; text: string };
}

interface Lore {
    title: string;
    p1: string;
    p2: string;
    p3: string;
    win: string;
    loss: string;
}

interface CharacterLore {
    [key: string]: string;
}

interface AbilityInfo {
    name: string;
    desc: string;
}

interface Abilities {
    [key: string]: AbilityInfo;
}

interface AbilityDefinitionItem {
    tag: string;
    icon: string;
    name: string;
    type: string;
    desc: string;
}

interface AbilityLevelGroup {
    1: AbilityDefinitionItem[];
    2: AbilityDefinitionItem[];
    3: AbilityDefinitionItem[];
}

interface AbilityDefinitionCategory {
    title: string;
    levels: AbilityLevelGroup;
}

interface AbilityDefinitions {
    neutral: AbilityDefinitionCategory;
    white: AbilityDefinitionCategory;
    black: AbilityDefinitionCategory;
}

interface Warnings {
    levelTooLow: string;
    alreadyActive: string;
    drawLimit: string;
    vortexLimit: string;
    maxAttacks: string;
    maxLevel: string;
    selectSum: string;
    oneLevelPerTurn: string;
    selectOneToDiscard: string;
    lightAffinityReq: string;
    darkAffinityReq: string;
    shieldActive: string;
    abilityUsed: string;
    noAbilities: string;
    selectAttackCard: string;
    abilityLimitReached: string;
    selectAttackToExec: string;
    selectDiscardForDraw: string;
    selectCardsForLevelUp: string;
    selectDiscardGeneric: string;
    wrongAffinity: string;
}

interface Logs {
    turnStart: (p: string) => string;
    drewCards: (p: string, n: number) => string;
    handFull: string;
    aiAttacks: (val: number, col: string, n: number) => string;
    aiEnds: string;
    discardToAct: (val: number, name: string) => string;
    shieldSet: (val: number) => string;
    healed: (n: number) => string;
    mindControl: (v: number, n: number) => string;
    selectTarget: string;
    changedCard: (desc: string) => string;
    vortexAttack: string;
    defendWith: (val: number, col: string) => string;
    noDef: string;
    damage: (dmg: number, target: string) => string;
    blocked: string;
    bounce: (dmg: number, target: string) => string;
    shieldAbsorb: (n: number) => string;
    addedToZone: (name: string) => string;
    levelUp: (lvl: number) => string;
    activating: (name: string) => string;
    handsDealt: string;
    matchStart: (p: string, ai: string) => string;
    vortexDefensePrefix: string;
    vortexHitPrefix: string;
    instabilityPrefix: string;
    vortexNeutralized: string;
    vs: string;
    atkLabel: string;
    defLabel: string;
    vortexLabel: string;
    discardedGeneric: (val: number, col: string, type: string) => string;
    visionActivated: string;
    aiLevelsUp: string;
    aiDrawsAbility: string;
    actionCancelled: (name: string) => string;
}

export interface Translation {
    ui: UI;
    rules: Rules;
    lore: Lore;
    characterLore: CharacterLore;
    abilities: Abilities;
    abilityDefinitions: AbilityDefinitions;
    warnings: Warnings;
    logs: Logs;
}

export const TEXTS: Record<Language, Translation> = {
  en: {
    ui: {
      startGame: "START GAME",
      enterVortex: "Enter the Vortex",
      chooseChar: "Select Your Character",
      opponent: "OPPONENT (AI)",
      player: "PLAYER (YOU)",
      life: "Life",
      level: "Level",
      attacks: "Attacks",
      shield: "Shield",
      abilities: "Abilities",
      empty: "Empty",
      vortexLabel: "THE VORTEX",
      drawAbility: "DRAW ABILITY",
      levelUp: "LEVEL UP",
      maxLevel: "MAX LEVEL",
      attackDirect: "ATTACK DIRECT",
      endTurn: "END TURN",
      confirmDef: "CONFIRM DEFENSE",
      confirmVortex: "CONFIRM VORTEX",
      takeDmg: "TAKE DAMAGE",
      victory: "VICTORY",
      defeat: "DEFEAT",
      playAgain: "PLAY AGAIN",
      readLore: "📜 READ LORE & HISTORY",
      readRules: "📜 READ EXTENDED RULES",
      abilityGuide: "📘 ABILITY GUIDE",
      closeHistory: "Close History",
      closeRules: "Close Rules",
      closeGuide: "Close Guide",
      quickRules: "QUICK RULES",
      rulesList: [
        "Opposite Colors: Atk - Def",
        "Same Colors: Atk - floor(Def/2)",
        "Level Up: Cards sum >= 10. Max Lv 3.",
        "Ability: Discard 1 to draw.",
        "Vortex: Same + ; Diff -",
        "Vortex Attack ends turn."
      ],
      waiting: "Select an action...",
      activate: "ACTIVATE",
      confirm: "CONFIRM",
      cancel: "CANCEL",
      combatResolved: "COMBAT RESOLVED! Revealing...",
      attackWith: "Attack with:",
      discard: "DISCARD",
      round: "ROUND",
      aiLevel: "AI Difficulty",
      levelBeg: "INITIAL",
      levelInt: "INTERMEDIATE",
      levelAdv: "ADVANCED",
      roundClear: "ROUND CLEARED!",
      nextRound: "NEXT ROUND",
      roundDesc: "The opponent evolves. Prepare for the next battle.",
      finalVictory: "ULTIMATE VICTORY!"
    },
    rules: {
      title: "Extended Rules",
      goal: { title: "Goal", text: "Defeat the opponent by reducing their Life to 0. You can attack directly or use the Chaos of the Magic Vortex, risking the blow returning against you." },
      cards: { title: "Cards", text: "The deck consists of White and Black cards, divided into Attack (Lightning) and Defense (Shield) types, with values from 1 to 10." },
      combat: { title: "Combat Logic", text: "When Attacking: If colors are Opposite (Black vs White), damage result is Attack value minus Defense value. If they are the Same Color, damage is Attack minus (Defense / 2) rounded down. If the combat result is negative, damage bounces back against the attacker!" },
      vortex: { title: "The Vortex", text: "The 4 central cards form the Vortex. You can use them once per turn to Attack (or to Defend with special abilities). How it works: Same Color adds power to your card. Different Color subtracts power. A negative result causes Instability and deals Recoil damage to the attacker. The Vortex attack cannot be defended with cards." },
      leveling: { title: "Level Up", text: "Select cards in your hand that sum to a value of 10 or more to Level Up once per turn. Max Level is 3. Leveling up increases attacks per turn and unlocks superior abilities." },
      abilities: { title: "Abilities", text: "Discard 1 card to draw 1 Ability per turn. Characters with White or Black magic affinity have (Max Abil = Level + 1) and can only use Neutral abilities or their own affinity. Neutrals have (Max Abil = Level) and can use ALL abilities. Abilities can be Passive or Active (actives require discarding 1 card each time)." }
    },
    lore: {
      title: "The Universe of the Vortex",
      p1: "We are in a universe where magic is a fundamental force, the origin of everything. But this balance has been broken. A Magic Vortex of astronomical dimensions has appeared, threatening to consume all existence.",
      p2: "Only a few chosen ones, capable of channeling primordial energies, can avoid total destruction.",
      p3: "White Magic and Black Magic are two sides of the same coin: natural opposites that attract and nullify each other. You must master these forces, exploit their duality, and survive the chaos of the Vortex to save the universe... or become the last survivor of its end.",
      win: "You have survived the Vortex!",
      loss: "You have been consumed by the chaos."
    },
    characterLore: {
        char1: "Member of the council of sages of the fairy forest. Priest of Nature, Protector of the Forest and its creatures, Judge and executor of the dictates of the eternal circle, which governs the balance of every being that enters Gaia's domains. Powerful character, with morals and a strong sense of ethics and virtue, sensitive to light magic, especially everything related to mother nature and her delicate balance, evolution and constant change.",
        char2: "High Priest of the Scaled Ones, dwelling in the Emerald Ziggurats deep within the primal jungle. He guards the ancient blood rituals that keep the sun burning. A warrior-caste leader who believes strength is the only absolute truth, channeling dark energies to manipulate the fabric of magic itself.",
        char3: "Seraph of the Crystalline Spire, descended from the High Heavens to purge the corruption of the Vortex. Wielding a blade of pure starlight, they judge the unworthy with impartial divine wrath. A being of absolute purity who views the Vortex as a stain on creation that must be cleansed by the Light.",
        char4: "Archduke of the Obsidian Pit, a tyrant born of shadow and malice seeking to twist the Vortex into a gateway for his infernal legions. He feeds on despair and commands the dark arts with terrifying mastery, believing that chaos is the only true ladder to power.",
        char5: "Grandmaster of the Silent Peak. Having meditated for centuries atop the highest spire of the world, he has achieved perfect equilibrium between body and spirit. He fights not to destroy, but to restore the flow of harmony, using his iron will to deflect attacks with the fluidity of water.",
        char6: "Prime Alpha of the Hive. A biological war-machine evolved for efficiency in a world consumed by swarms. In their hive-mind, there is no self, only the colony. Magic is just another resource to be harvested, and they are a ruthless predator adapted to survive any environment.",
        char7: "The Lich Lord of the Crypts. Once a scholar who feared death, now a master of it. He has sacrificed his humanity to bind his soul to phylacteries of dark power. He commands the forbidden arts to drain the life of his enemies, proving that death is not the end, but a weapon.",
        char8: "Knight-Commander of the Sun Pride. A noble warrior from the Golden Savanna citadels. His roar summons the courage of kings, and his blade shines with the fury of the midday sun. Driven by an unshakable code of honor, he stands as a beacon of hope against the encroaching darkness.",
        char9: "Voice of the Ancestors. A spiritual guide from the lush tropics, attuned to the whispers of the earth and sky. He channels the primal totems to see what others cannot, guiding his tribe through the chaos with visions of the future and the wisdom of the past.",
        char10: "Unit 734-M, The Singularity. Born from a world where biology and circuitry have merged. He perceives magic as complex algorithms waiting to be optimized. His logic is absolute, his calculations flawless, and he seeks to decode the Vortex to upgrade the universe's operating system.",
        char11: "Archmage of the Violet Tower. A prodigy from a civilization where magic is as common as air. She weaves spells with effortless grace, manipulating the fabric of reality itself. To her, the Vortex is not a threat, but a limitless source of mana waiting to be shaped by a master hand.",
        char12: "Avatar of the Primal Storm. Born from the Vortex itself, a chaotic convergence of fire, water, earth, and air. It has no morality, only the raw, untamed force of nature seeking to return all to elemental chaos. It is the storm that approaches, the earthquake that shatters, and the fire that consumes."
    },
    abilities: {
        MAGIC_WALL: { name: "Magic Wall", desc: "Active. Discard 1. Create Shield = Card Value." },
        DARK_DEFENSE: { name: "Dark Defense", desc: "Passive. Black Def cards +Level." },
        LIGHT_DEFENSE: { name: "Light Defense", desc: "Passive. White Def cards +Level." },
        PALADIN_OF_LIGHT: { name: "Paladin of Light", desc: "Passive. White Atk cards +Level." },
        DARK_LORD: { name: "Dark Lord", desc: "Passive. Black Atk cards +Level." },
        // MAGIC_AFFINITY: { name: "Magic Affinity", desc: "Active. Discard 1. Heal Value/2 + Level." },
        MAGIC_VISION: { name: "Magic Vision", desc: "Active. Discard 1. Reveal opponent hand." },
        MAGIC_KNOWLEDGE: { name: "Magic Knowledge", desc: "Passive. Max Hand Size +Level." },
        MAGIC_RESISTANCE: { name: "Magic Resistance", desc: "Passive. Max HP +10 per Level." },
        MIND_CONTROL: { name: "Mind Control", desc: "Active. Discard 1. Foe discards Level cards." },
        ELEMENTAL_CONTROL: { name: "Elemental Control", desc: "Active. Discard 1. Change card Color." },
        MAGIC_CONTROL: { name: "Magic Control", desc: "Active. Discard 1. Change card Type." },
        VORTEX_CONTROL: { name: "Vortex Control", desc: "Passive. Use Vortex for Defense 1/turn." },
        LIGHT_AFFINITY: { name: "Light Affinity", desc: "Active. Discard White. Heal Value/2 + Level." },
        DARK_AFFINITY: { name: "Dark Affinity", desc: "Active. Discard Black. Heal Value/2 + Level." },
        // MASTER_CONTROL: { name: "Master Control", desc: "Active. Discard 1. Change Color & Type." },
        DARK_SERVANT: { name: "Dark Servant", desc: "Passive. Half incoming Black dmg." },
        ACOLYTE_OF_LIGHT: { name: "Acolyte of Light", desc: "Passive. Half incoming White dmg." },
        MASTER_AFFINITY: { name: "Master Affinity", desc: "Active. Discard 1. Heal Full Value." },
        MASTER_VORTEX: { name: "Master Vortex", desc: "Passive. Unlimited Vortex Attacks." }
    },
    abilityDefinitions: {
      neutral: {
        title: "NEUTRAL ABILITIES",
        levels: {
            1: [
              { tag: 'MAGIC_WALL', icon: '🧱', name: 'Magic Wall', type: 'Active', desc: "Discard a card to create a permanent shield. The Shield weakens with each attack. You cannot replace it until it is destroyed." },
              // { tag: 'MAGIC_AFFINITY', icon: '❤️', name: 'Magic Affinity', type: 'Active', desc: "Discard a card. Recover HP equal to half the value of the discarded card plus the player's level. [♥X/2 + LV]" },
              { tag: 'MAGIC_VISION', icon: '🪬', name: 'Magic Vision', type: 'Active', desc: "Discard a card. All opponent's cards are shown." },
              { tag: 'MAGIC_KNOWLEDGE', icon: '📖', name: 'Magic Knowledge', type: 'Passive', desc: "Increases the maximum allowed number of cards in hand by +1 per level. [MAX Cards + Lv]" },
              { tag: 'MAGIC_RESISTANCE', icon: '💪', name: 'Magic Resistance', type: 'Passive', desc: "Increases the maximum allowed HP by +10 per level). [MAX vit ♥ + Lv x10]" }
            ],
            2: [
              { tag: 'MIND_CONTROL', icon: '🧠', name: 'Mind Control', type: 'Active', desc: "Discard a card. An opponent discards as many cards as the character's Level." },
              { tag: 'ELEMENTAL_CONTROL', icon: '🔄️', name: 'Elemental Control', type: 'Active', desc: "Discard a card. Change the color of one of your own cards. [□ ◄ ► ■]" },
              { tag: 'MAGIC_CONTROL', icon: '🔀', name: 'Magic Control', type: 'Active', desc: "Discard a card. Change the type of one of your own cards. [ATK ◄ ► DEF]" },
              { tag: 'VORTEX_CONTROL', icon: '🌀', name: 'Vortex Control', type: 'Passive', desc: "Allows using the VORTEX for defense once per turn (at the same moments the player could defend). The VORTEX mechanic is the same as for attacking." }
            ],
            3: [
              // { tag: 'MASTER_CONTROL', icon: '♻️', name: 'Master Control', type: 'Active', desc: "Discard a card. Change the color and type of one of your own cards. [□ ◄ ► ■][ATK ◄ ► DEF]" },
              { tag: 'MASTER_AFFINITY', icon: '💖', name: 'Master Affinity', type: 'Active', desc: "Discard a card. Recover HP equal to the full value of the discarded card.[♥X]" },
              { tag: 'MASTER_VORTEX', icon: '♾️', name: 'Master Vortex', type: 'Passive', desc: "Allows using the VORTEX as many times as the player wants for attack during their turn. Meaning the VORTEX is no longer limited to once per turn." }
            ]
        }
      },
      white: {
        title: "WHITE AFFINITY ABILITIES",
        levels: {
            1: [
              { tag: 'LIGHT_DEFENSE', icon: '🛡️', name: 'Light Defense', type: 'Passive', desc: "Increases any White defense card by +1 per level. [DEF □ + Lv]" },
              { tag: 'PALADIN_OF_LIGHT', icon: '⚔️', name: 'Paladin of Light', type: 'Passive', desc: "Increases any White attack card by +1 per level. [ATK □ + Lv]" }
            ],
            2: [
              { tag: 'LIGHT_AFFINITY', icon: '🤍', name: 'Light Affinity', type: 'Active', desc: "Discard a White card. Recover HP equal to half the value of the discarded card. [♥X/2 □ + Lv]" }
            ],
            3: [
              { tag: 'ACOLYTE_OF_LIGHT', icon: '🔆', name: 'Acolyte of Light', type: 'Passive', desc: "Reduces all damage from a White attack by half (rounded down). [ATK □ /2]" }
            ]
        }
      },
      black: {
        title: "BLACK AFFINITY ABILITIES",
        levels: {
            1: [
              { tag: 'DARK_DEFENSE', icon: '🛡️', name: 'Dark Defense', type: 'Passive', desc: "Increases any Black defense card by +1 per level. [DEF ■ + Lv]" },
              { tag: 'DARK_LORD', icon: '⚔️', name: 'Dark Lord', type: 'Passive', desc: "Increases any Black attack card by +1 per level. [ATK ■ + Lv]" }
            ],
            2: [
              { tag: 'DARK_AFFINITY', icon: '🖤', name: 'Dark Affinity', type: 'Active', desc: "Discard a Black card. Recover HP equal to half the value of the discarded card. [♥X/2 ■ + Lv]" }
            ],
            3: [
              { tag: 'DARK_SERVANT', icon: '🌑', name: 'Dark Servant', type: 'Passive', desc: "Reduces all damage from a Black attack by half (rounded down). [ATK ■ /2]" }
            ]
        }
      }
    },
    warnings: {
        levelTooLow: "Level too low to use this ability.",
        alreadyActive: "Ability already active.",
        drawLimit: "Can only draw 1 ability per turn.",
        vortexLimit: "Vortex limit reached.",
        maxAttacks: "Attack limit reached for your level.",
        maxLevel: "Max level reached.",
        selectSum: "Cards must sum to 10.",
        oneLevelPerTurn: "One level up per turn.",
        selectOneToDiscard: "Select exactly 1 card to discard.",
        lightAffinityReq: "Light Affinity requires discarding a WHITE card.",
        darkAffinityReq: "Dark Affinity requires discarding a BLACK card.",
        shieldActive: "Shield already active. Must reach 0 to replace.",
        abilityUsed: "Ability already used this turn.",
        noAbilities: "No abilities available for your level/affinity.",
        selectAttackCard: "Please select an Attack card first.",
        abilityLimitReached: "Active Ability limit reached.",
        selectAttackToExec: "Select an Attack card to execute.",
        selectDiscardForDraw: "Select a card to discard for ability.",
        selectCardsForLevelUp: "Select cards to sum 10 or more.",
        selectDiscardGeneric: "Select a card to discard.",
        wrongAffinity: "Your character cannot use this affinity.",
    },
    logs: {
        turnStart: (p: string) => `--- Start of ${p} Turn ---`,
        drewCards: (p: string, n: number) => `${p} drew ${n} power cards.`,
        handFull: "Hand full. Main Phase.",
        aiAttacks: (val: number, col: string, n: number) => `AI Attacks with ${val} ${col}! (Attack ${n}/2)`,
        aiEnds: "AI Ends Turn.",
        discardToAct: (val: number, name: string) => `Discarded ${val} to activate ${name}.`,
        shieldSet: (val: number) => `Permanent Shield set to ${val}.`,
        healed: (n: number) => `Healed ${n} HP.`,
        mindControl: (v: number, n: number) => `You discarded ${v}. AI discarded ${n} cards.`,
        selectTarget: "Now select a card in hand to modify.",
        changedCard: (desc: string) => `Changed card: ${desc}`,
        vortexAttack: "Initiating Vortex Attack...",
        defendWith: (val: number, col: string) => `Defends with ${val} ${col}.`,
        noDef: "Decides not to defend.",
        damage: (dmg: number, target: string) => `${dmg} dmg to ${target}.`,
        blocked: "Blocked! 0 dmg.",
        bounce: (dmg: number, target: string) => `BOUNCE! ${target} takes ${dmg} recoil!`,
        shieldAbsorb: (n: number) => `(Shield absorbed ${n})`,
        addedToZone: (name: string) => `Added ${name} to Command Zone.`,
        levelUp: (lvl: number) => `Leveled Up! Now Level ${lvl}.`,
        activating: (name: string) => `Activating ${name}...`,
        handsDealt: "Hands dealt. Vortex formed. Begin!",
        matchStart: (p: string, ai: string) => `Player: ${p} vs AI: ${ai}.`,
        vortexDefensePrefix: "DEFENSA VÒRTEX! ",
        vortexHitPrefix: "VÒRTEX! ",
        instabilityPrefix: "INESTABILITAT! ",
        vortexNeutralized: "VÒRTEX NEUTRALIZED.",
        vs: " vs ",
        atkLabel: "(Atk)",
        defLabel: "(Def)",
        vortexLabel: "(Vortex)",
        discardedGeneric: (val: number, col: string, type: string) => `Discarded ${val} ${col} ${type}.`,
        visionActivated: "Magic Vision! Opponent's hand revealed.",
        aiLevelsUp: "AI Leveled Up!",
        aiDrawsAbility: "AI draws an Ability.",
        actionCancelled: (name: string) => `Cancel·lada activació de ${name}.`
    }
  },
  es: {
    ui: {
      startGame: "EMPEZAR JUEGO",
      enterVortex: "Entra en el Vórtice",
      chooseChar: "Elige tu Personaje",
      opponent: "OPONENTE (IA)",
      player: "JUGADOR (TÚ)",
      life: "Vida",
      level: "Nivel",
      attacks: "Ataques",
      shield: "Escudo",
      abilities: "Habilidades",
      empty: "Vacío",
      vortexLabel: "EL VÓRTICE",
      drawAbility: "ROBAR HABILIDAD",
      levelUp: "SUBIR NIVEL",
      maxLevel: "NIVEL MÁX",
      attackDirect: "ATAQUE DIRECTO",
      endTurn: "FINALIZAR TURNO",
      confirmDef: "CONFIRMAR DEFENSA",
      confirmVortex: "CONFIRMAR VÓRTICE",
      takeDmg: "RECIBIR DAÑO",
      victory: "VICTORIA",
      defeat: "DERROTA",
      playAgain: "JUGAR DE NUEVO",
      readLore: "📜 LEER HISTORIA",
      readRules: "📕 LEER REGLAS EXTENDIDAS",
      abilityGuide: "📘 GUÍA DE HABILIDADES",
      closeHistory: "Cerrar Historia",
      closeRules: "Cerrar Reglas",
      closeGuide: "Cerrar Guía",
      quickRules: "REGLAS RÁPIDAS",
      rulesList: [
        "Colores Opuestos: Atq - Def",
        "Mismo Color: Atq - suelo(Def/2)",
        "Subir Nivel: Suma cartas >= 10. Máx Nv 3.",
        "Habilidad: Descarta 1 para robar.",
        "Vórtice: Igual + ; Diferente -",
        "Ataque Vórtice termina el turno."
      ],
      waiting: "Selecciona una acción...",
      activate: "ACTIVAR",
      confirm: "CONFIRMAR",
      cancel: "CANCELAR",
      combatResolved: "¡COMBATE RESUELTO! Revelando...",
      attackWith: "Ataca con:",
      discard: "DESCARTAR",
      round: "RONDA",
      aiLevel: "Dificultad IA",
      levelBeg: "INICIAL",
      levelInt: "INTERMEDIA",
      levelAdv: "AVANZADA",
      roundClear: "¡RONDA SUPERADA!",
      nextRound: "SIGUIENTE RONDA",
      roundDesc: "El oponente evoluciona. Prepárate para la batalla.",
      finalVictory: "¡VICTORIA FINAL!"
    },
    rules: {
      title: "Reglas Extendidas",
      goal: { title: "Objetivo", text: "Derrota al oponente reduciendo su Vida a 0. Puedes atacar directamente o utilizar el Caos del Vórtice mágico arriesgándote a que el golpe vuelva contra ti." },
      cards: { title: "Cartas", text: "El mazo consta de cartas Blancas y Negras, divididas en tipos Ataque (Rayo) y Defensa (Escudo). Valores del 1 al 10." },
      combat: { title: "Lógica de Combate", text: "Al Atacar: Si los colores son Opuestos (Negro vs Blanco), el resultado del daño es el valor de Ataque menos el de la Defensa. Si son el Mismo Color, el daño es Ataque menos (Defensa / 2) redondeando hacia abajo. ¡Si el resultado del combate es negativo, el daño rebota contra el atacante!" },
      vortex: { title: "El Vórtice", text: "Las 4 cartas centrales forman el Vórtice. Puedes usarlas una vez por turno para Atacar (o para Defender con habilidades especiales). El funcionamiento es: Mismo Color suma poder a tu carta. Color Diferente resta poder. Un resultado negativo causa Inestabilidad y genera Daño de retroceso al atacante. El ataque del Vórtice no se puede defender con cartas." },
      leveling: { title: "Subir Nivel", text: "Selecciona cartas en tu mano que sumen un valor de 10 o más para Subir de Nivel una vez por turno. Máx Nivel es 3. Subir de nivel aumenta los ataques por turno y desbloquea habilidades superiores." },
      abilities: { title: "Habilidades", text: "Descarta 1 carta para robar 1 Habilidad por turno. Personajes con afinidad por magia Blanca o Negra tienen (Máx Hab = Nivel + 1) y tan solo pueden utilizar habilidades Neutrales o de su afinidad. Los Neutrales tienen (Máx Hab = Nivel) y pueden utilizar TODAS las habilidades. Las habilidades pueden ser Pasivas o Activas (las activas requieren descartar 1 carta cada vez)." }
    },
    lore: {
      title: "El Universo del Vórtice",
      p1: "Estamos en un universo donde la magia es una fuerza fundamental, el origen de todo. Pero este equilibrio se ha roto. Un Vórtice Mágico de dimensiones astronómicas ha aparecido, amenazando con consumir toda la existencia.",
      p2: "Solo unos pocos elegidos, capaces de canalizar energías primordiales, pueden evitar la destrucción total.",
      p3: "La Magia Blanca y la Magia Negra son dos caras de la misma moneda: opuestos naturales que se atraen y anulan. Debes dominar estas fuerzas, explotar su dualidad y sobrevivir al caos del Vórtice para salvar el universo... o convertirte en el último superviviente de su fin.",
      win: "¡Has sobrevivido al Vórtice!",
      loss: "Has sido consumido por el caos."
    },
    characterLore: {
        char1: "Miembro del consejo de sabios del bosque de las hadas. Sacerdote de la Naturaleza, Protector del Bosque y sus criaturas, Juez y ejecutor de los dictámenes del círculo eterno, que gobierna el equilibrio de todo ser que se adentre en los dominios de Gaia. Poderoso personaje, con una moral y un fuerte sentido de la ética y la virtud, sensible a la magia de la luz, especialmente a todo lo que tiene que ver con la madre naturaleza y su delicado equilibrio, evolución y cambio constante.",
        char2: "Sumo Sacerdote de los Escamados, habitante de los Zigurat Esmeralda en lo profundo de la selva primigenia. Custodia los antiguos rituales de sangre que mantienen el sol ardiendo. Líder de una casta guerrera que cree que la fuerza es la única verdad absoluta, canalizando energías oscuras para manipular el tejido de la magia.",
        char3: "Serafín de la Aguja Cristalina, descendido de los Cielos Altos para purgar la corrupción del Vórtice. Empuñando una espada de luz estelar pura, juzga a los indignos con imparcial ira divina. Un ser de pureza absoluta que ve el Vórtice como una mancha en la creación que debe ser limpiada por la Luz.",
        char4: "Archiduque del Pozo de Obsidiana, un tirano nacido de la sombra y la malicia que busca torcer el Vórtice para convertirlo en un portal para sus legiones infernales. Se alimenta de la desesperación y comanda las artes oscuras con una maestría aterradora, creyendo que el caos es la única escalera real al poder.",
        char5: "Gran Maestro del Pico Silencioso. Tras meditar durante siglos en la aguja más alta del mundo, ha alcanzado el equilibrio perfecto entre cuerpo y espíritu. No lucha para destruir, sinó para restaurar el flujo de la armonía, usando su voluntad de hierro para desviar ataques con la fluidez del agua.",
        char6: "Alfa Supremo de la Colmena. Una máquina de guerra biológica evolucionada para la eficiencia en un mundo consumido por enjambres. En su mente colmena no hay 'yo', solo la colonia. La magia es solo otro recurso para cosechar, y es un depredador implacable adaptado para sobrevivir en cualquier entorno.",
        char7: "El Señor Liche de las Criptas. Antaño un erudito que temía a la muerte, ahora su maestro. Ha sacrificado su humanidad para atar su alma a filacterias de poder oscuro. Comanda las artes prohibidas para drenar la vida de sus enemigos, demostrando que la muerte no es el final, sino un arma.",
        char8: "Caballero Comandante del Orgullo Solar. Un noble guerrero de las ciudadelas de la Sabana Dorada. Su rugido invoca el coraje de los reyes, y su espada brilla con la furia del sol de mediodía. Guiado por un inquebrantable código de honor, se erige como un faro de esperanza contra la oscuridad invasora.",
        char9: "Voz de los Ancestros. Un guía espiritual de los trópicos exuberantes, sintonizado con los susurros de la tierra y el cielo. Canaliza los tótems primigenis para ver lo que otros no pueden, guiando a su tribu a través del caos con visiones del futuro y la sabiduría del pasado.",
        char10: "Unidad 734-M, La Singularidad. Nacido de un mundo donde la biología y los circuitos se han fusionado. Percibe la magia como algoritmos complejos esperando ser optimizados. Su lógica es absoluta, sus cálculos impecables, y busca decodificar el Vórtice para actualizar el sistema operativo del universo.",
        char11: "Archimaga de la Torre Violeta. Una prodigio de una civilización donde la magia es tan común como el aire. Teje hechizos con gracia natural, manipulando el tejido de la realidad misma. Para ella, el Vórtice no es una amenaza, sino una fuente ilimitada de maná esperando ser moldeada por una mano maestra.",
        char12: "Avatar de la Tormenta Primigenia. Nacido del propio Vórtice, una convergencia caótica de fuego, agua, tierra y aire. No tiene moralidad, solo la fuerza bruta e indómita de la naturaleza buscando devolver todo al caos elemental. Es la tormenta que se acerca, el terremoto que destruye y el fuego que consume."
    },
    abilities: {
        MAGIC_WALL: { name: "Muro Mágico", desc: "Activa. Descarta 1. Crea Escudo = Valor Carta." },
        DARK_DEFENSE: { name: "Defensa Oscura", desc: "Pasiva. Cartas Def Negras +Nivel." },
        LIGHT_DEFENSE: { name: "Defensa de Luz", desc: "Pasiva. Cartas Def Blancas +Nivel." },
        PALADIN_OF_LIGHT: { name: "Paladín de Luz", desc: "Pasiva. Cartas Atq Blancas +Nivel." },
        DARK_LORD: { name: "Señor Oscuro", desc: "Pasiva. Cartas Atq Negras +Nivel." },
        // MAGIC_AFFINITY: { name: "Afinidad Mágica", desc: "Activa. Descarta 1. Cura Valor/2 + Nivel." },
        MAGIC_VISION: { name: "Visión Mágica", desc: "Activa. Descarta 1. Revela mano oponente." },
        MAGIC_KNOWLEDGE: { name: "Conocimiento Mágico", desc: "Pasiva. Tam. Mano +Nivel." },
        MAGIC_RESISTANCE: { name: "Resistencia Mágica", desc: "Pasiva. Vida Máx +10/Nivel." },
        MIND_CONTROL: { name: "Control Mental", desc: "Activa. Descarta 1. Oponente descarta Nivel." },
        ELEMENTAL_CONTROL: { name: "Control Elemental", desc: "Activa. Descarta 1. Cambia color carta." },
        MAGIC_CONTROL: { name: "Control Mágico", desc: "Activa. Descarta 1. Cambia tipo carta." },
        VORTEX_CONTROL: { name: "Control de Vórtice", desc: "Pasiva. Usa Vórtice en Defensa 1/turno." },
        LIGHT_AFFINITY: { name: "Afinidad Luz", desc: "Activa. Descarta Blanca. Cura Valor/2 + Nivel." },
        DARK_AFFINITY: { name: "Afinidad Oscura", desc: "Activa. Descarta Negra. Cura Valor/2 + Nivel." },
        // MASTER_CONTROL: { name: "Control Maestro", desc: "Activa. Descarta 1. Cambia color y tipo." },
        DARK_SERVANT: { name: "Siervo Oscuro", desc: "Pasiva. Mitad daño Negro entrante." },
        ACOLYTE_OF_LIGHT: { name: "Acólito de Luz", desc: "Pasiva. Mitad daño Blanco entrante." },
        MASTER_AFFINITY: { name: "Afinidad Maestra", desc: "Activa. Descarta 1. Cura Valor total." },
        MASTER_VORTEX: { name: "Vórtice Maestro", desc: "Pasiva. Ataques Vórtice ilimitados." }
    },
    abilityDefinitions: {
      neutral: {
        title: "HABILIDADES NEUTRALES",
        levels: {
            1: [
              { tag: 'MAGIC_WALL', icon: '🧱', name: 'Muro Mágico', type: 'Activa', desc: "Descarta una carta. Genera un escudo permanente que no tiene color y que tiene el valor de la carta descartada. El Muro siempre resta el daño del ataque que se reciba, incluido el ataque rebotado que venga del VÓRTICE. El Muro se va debilitando con cada ataque hasta que se queda a 0. Solo se puede activar un muro o escudo durante el propio turno. Pero una vez un jugador tiene un muro este se queda hasta que es destruido. El propio jugador no puede deshacerse de su escudo o muro ni sustituirlo por otro hasta que sea destruido." },
              // { tag: 'MAGIC_AFFINITY', icon: '❤️', name: 'Afinidad Mágica', type: 'Activa', desc: "Descarta una carta. Recupera tantos puntos de vitalidad como la mitad del valor de la carta descartada más el nivel del jugador. [♥X/2 + LV]" },
              { tag: 'MAGIC_VISION', icon: '🪬', name: 'Visión Mágica', type: 'Activa', desc: "Descarta una carta. Se muestran todas las cartas del oponente." },
              { tag: 'MAGIC_KNOWLEDGE', icon: '📖', name: 'Conocimiento Mágico', type: 'Pasiva', desc: "Incrementa el máximo número permitido de cartas en la mano en +1 por nivel. [MAX Cartas + Nv]" },
              { tag: 'MAGIC_RESISTANCE', icon: '💪', name: 'Resistencia Mágica', type: 'Pasiva', desc: "Incrementa el máximo de puntos de vitalidad permitido en +10 por nivel). [MAX vit ♥ + Nv x10]" }
            ],
            2: [
              { tag: 'MIND_CONTROL', icon: '🧠', name: 'Control Mental', type: 'Activa', desc: "Descarta una carta. Un oponente se descarta de tantas cartas como Nv del personaje." },
              { tag: 'ELEMENTAL_CONTROL', icon: '🔄️', name: 'Control Elemental', type: 'Activa', desc: "Descarta una carta. Cambia el color de una carta propia. [□ ◄ ► ■]" },
              { tag: 'MAGIC_CONTROL', icon: '🔀', name: 'Control Mágico', type: 'Activa', desc: "Descarta una carta. Cambia el tipo (Atq/Def) de una carta propia. [ATK ◄ ► DEF]" },
              { tag: 'VORTEX_CONTROL', icon: '🌀', name: 'Control de Vórtice', type: 'Pasiva', desc: "Permite utilizar el VÓRTICE en defensa una vez por turno (en los mismos momentos en que se podría defender el jugador). La mecánica de funcionamiento del VÓRTICE es la misma que para el ataque." }
            ],
            3: [
              // { tag: 'MASTER_CONTROL', icon: '♻️', name: 'Control Maestro', type: 'Activa', desc: "Descarta una carta. Cambia el color y el tipo de una carta propia. [□ ◄ ► ■][ATK ◄ ► DEF]" },
              { tag: 'MASTER_AFFINITY', icon: '💖', name: 'Afinidad Maestra', type: 'Activa', desc: "Descarta una carta. Recupera tantos puntos de vitalidad como el valor de la carta descartada.[♥X]" },
              { tag: 'MASTER_VORTEX', icon: '♾️', name: 'Vórtice Maestro', type: 'Pasiva', desc: "Permite utilizar el VÓRTICE tantas veces como el jugador quiera en ataque durante su turno. Es decir el VÓRTICE ya no está limitado a una vez por turno." }
            ]
        }
      },
      white: {
        title: "HABILIDADES DE AFINIDAD BLANCA",
        levels: {
            1: [
              { tag: 'LIGHT_DEFENSE', icon: '🛡️', name: 'Defensa de Luz', type: 'Pasiva', desc: "Incrementa cualquier carta de defensa blanca en +1 por nivel. [DEF □ + Nv]" },
              { tag: 'PALADIN_OF_LIGHT', icon: '⚔️', name: 'Paladín de Luz', type: 'Pasiva', desc: "Incrementa cualquier carta de ataque blanca en +1 por nivel. [ATK □ + Nv]" }
            ],
            2: [
              { tag: 'LIGHT_AFFINITY', icon: '🤍', name: 'Afinidad de Luz', type: 'Activa', desc: "Descarta una carta blanca. Recupera tantos puntos de vitalidad como la mitad del valor de la carta descartada. [♥X/2 □ + Nv]" }
            ],
            3: [
              { tag: 'ACOLYTE_OF_LIGHT', icon: '🔆', name: 'Acólito de Luz', type: 'Pasiva', desc: "Redueix todo el daño de un ataque blanco a la mitad (redondeando hacia abajo). [ATK □ /2]" }
            ]
        }
      },
      black: {
        title: "HABILIDADES DE AFINIDAD NEGRA",
        levels: {
            1: [
              { tag: 'DARK_DEFENSE', icon: '🛡️', name: 'Defensa Oscura', type: 'Pasiva', desc: "Incrementa cualquier carta de defensa Negra en +1 per nivel. [DEF ■ + Nv]" },
              { tag: 'DARK_LORD', icon: '⚔️', name: 'Señor Oscuro', type: 'Pasiva', desc: "Incrementa cualquier carta de ataque negra en +1 por nivel. [ATK ■ + Nv]" }
            ],
            2: [
              { tag: 'DARK_AFFINITY', icon: '🖤', name: 'Afinidad Oscura', type: 'Activa', desc: "Descarta una carta negra. Recupera tantos puntos de vitalidad como la mitad del valor de la carta descartada. [♥X/2 ■ + Nv]" }
            ],
            3: [
              { tag: 'DARK_SERVANT', icon: '🌑', name: 'Siervo Oscuro', type: 'Pasiva', desc: "Redueix todo el daño de un ataque negre a la mitad (redondeando hacia abajo). [ATK ■ /2]" }
            ]
        }
      }
    },
    warnings: {
        levelTooLow: "Nivel insuficiente.",
        alreadyActive: "Habilidad ya activa.",
        drawLimit: "Solo 1 habilidad por turno.",
        vortexLimit: "Límite de Vórtice alcanzado.",
        maxAttacks: "Límite de ataques alcanzado por tu nivel.",
        maxLevel: "Nivel Máximo alcanzado.",
        selectSum: "Cartas deben sumar 10.",
        oneLevelPerTurn: "Solo 1 nivel por turno.",
        selectOneToDiscard: "Selecciona exactamente 1 carta para descartar.",
        lightAffinityReq: "Afinidad de Luz requiere descartar carta BLANCA.",
        darkAffinityReq: "Afinidad Oscura requiere descartar carta NEGRA.",
        shieldActive: "Escudo ya activo. Debe llegar a 0 para reemplazar.",
        abilityUsed: "Habilidad ya usada este turno.",
        noAbilities: "No hay habilidades disponibles para tu afinidad/nivel.",
        selectAttackCard: "Por favor, selecciona una carta de Ataque primero.",
        abilityLimitReached: "Límite de Habilidades activas alcanzado.",
        selectAttackToExec: "Selecciona una carta de Ataque para ejecutar.",
        selectDiscardForDraw: "Selecciona una carta para descartar.",
        selectCardsForLevelUp: "Selecciona cartas que sumen 10 o más.",
        selectDiscardGeneric: "Selecciona una carta para descartar.",
        wrongAffinity: "Tu personaje no puede usar esta afinidad.",
    },
    logs: {
        turnStart: (p: string) => `--- Inicio Turno de ${p} ---`,
        drewCards: (p: string, n: number) => `${p} robó ${n} cartas de poder.`,
        handFull: "Mano llena. Fase Principal.",
        aiAttacks: (val: number, col: string, n: number) => `IA Ataca con ${val} ${col}! (Ataque ${n}/2)`,
        aiEnds: "IA Termina Turno.",
        discardToAct: (val: number, name: string) => `Descartado ${val} para activar ${name}.`,
        shieldSet: (val: number) => `Escudo Permanente fijado en ${val}.`,
        healed: (n: number) => `Curado ${n} HP.`,
        mindControl: (v: number, n: number) => `Descartaste ${v}. IA descartó ${n} cartas.`,
        selectTarget: "Ahora elige carta en mano para modificar.",
        changedCard: (desc: string) => `Carta cambiada: ${desc}`,
        vortexAttack: "Iniciando Ataque de Vórtice...",
        defendWith: (val: number, col: string) => `Defiende con ${val} ${col}.`,
        noDef: "Decide no defender.",
        damage: (dmg: number, target: string) => `${dmg} daño a ${target}.`,
        blocked: "¡Bloqueado! 0 daño.",
        bounce: (dmg: number, target: string) => `¡REBOTE! ${target} recibe ${dmg} retroceso!`,
        shieldAbsorb: (n: number) => `(Escudo absorbe ${n})`,
        addedToZone: (name: string) => `Añadido ${name} a Zona de Mando.`,
        levelUp: (lvl: number) => `¡Subió de Nivel! Ahora Nivel ${lvl}.`,
        activating: (name: string) => `Activando ${name}...`,
        handsDealt: "Manos repartidas. Vórtice formado. ¡Empieza!",
        matchStart: (p: string, ai: string) => `Jugador: ${p} vs IA: ${ai}.`,
        vortexDefensePrefix: "¡DEFENSA VÓRTICE! ",
        vortexHitPrefix: "¡VÓRTICE! ",
        instabilityPrefix: "¡INESTABILIDAD! ",
        vortexNeutralized: "VÓRTICE NEUTRALIZADO.",
        vs: " vs ",
        atkLabel: "(Atq)",
        defLabel: "(Def)",
        vortexLabel: "(Vórtice)",
        discardedGeneric: (val: number, col: string, type: string) => `Descartado ${val} ${col} ${type}.`,
        visionActivated: "¡Visión Mágica! Mano oponente revelada.",
        aiLevelsUp: "¡IA sube de Nivel!",
        aiDrawsAbility: "IA roba una Habilidad.",
        actionCancelled: (name: string) => `Cancelada activación de ${name}.`
    }
  },
  ca: {
    ui: {
      startGame: "COMENÇAR JOC",
      enterVortex: "Entra al Vòrtex",
      chooseChar: "Tria el teu Personatge",
      opponent: "OPONENT (IA)",
      player: "JUGADOR (TU)",
      life: "Vida",
      level: "Nivell",
      attacks: "Atacs",
      shield: "Escut",
      abilities: "Habilitats",
      empty: "Buit",
      vortexLabel: "EL VÒRTEX",
      drawAbility: "ROBAR HABILITAT",
      levelUp: "PUJAR NIVELL",
      maxLevel: "NIVELL MÀX",
      attackDirect: "ATAC DIRECTE",
      endTurn: "ACABAR TORN",
      confirmDef: "CONFIRMAR DEFENSA",
      confirmVortex: "CONFIRMAR VÒRTEX",
      takeDmg: "REBRE DANY",
      victory: "VICTÒRIA",
      defeat: "DERROTA",
      playAgain: "JUGAR DE NOU",
      readLore: "📜 LLEGIR HISTÒRIA",
      readRules: "📕 LLEGIR REGLES EXTESES",
      abilityGuide: "📘 GUIA D'HABILITATS",
      closeHistory: "Tancar Història",
      closeRules: "Tancar Regles",
      closeGuide: "Tancar Guia",
      quickRules: "REGLES RÀPIDES",
      rulesList: [
        "Colors Oposats: Atc - Def",
        "Mateix Color: Atc - (Def/2)",
        "Pujar Nivell: Suma cartas >= 10. Máx Nv 3.",
        "Habilitat: Descarta 1 per robar.",
        "Vòrtex: Mateix + ; Diferent -",
        "Atac Vòrtex acaba el torn."
      ],
      waiting: "Selecciona una acció...",
      activate: "ACTIVAR",
      confirm: "CONFIRMAR",
      cancel: "CANCEL·LAR",
      combatResolved: "COMBAT RESOLT! Revelant...",
      attackWith: "Ataca amb:",
      discard: "DESCARTAR",
      round: "RONDA",
      aiLevel: "Dificultat IA",
      levelBeg: "INICIAL",
      levelInt: "INTERMITJA",
      levelAdv: "AVANÇADA",
      roundClear: "RONDA SUPERADA!",
      nextRound: "SEGÜENT RONDA",
      roundDesc: "L'oponent evoluciona. Prepara't per a la següent batalla.",
      finalVictory: "VICTÒRIA TOTAL!"
    },
    rules: {
      title: "Regles Exteses",
      goal: { title: "Objectiu", text: "Derrota l'oponent reduint la seva Vida a 0. Pots atacar directament o utilitzar el Caos del Vòrtex màgic arriscant-te a que el cop torni contra teu." },
      cards: { title: "Cartes", text: "La baralla consta de cartes Blanques i Negras, dividides en tipus Atac (Llamp) i Defensa (Escut), amb valors de l'1 al 10." },
      combat: { title: "Lògica de Combat", text: "En Atacar: Si els colors són Oposats (Negre vs Blanc), el resultat del dany és valor d'Atac menys el de la Defensa. Si són el Mateix Color, el dany és Atac menys (Defensa / 2) arrodonint cap avall. Si el resultat del combat és negatiu, el dany rebota contra l'atacant!" },
      vortex: { title: "El Vòrtex", text: "Les 4 cartas centrals formen el Vòrtex. Pots utilitzar-les un cop per torn per Atacar (o per Defensar amb habilitats especials). El funcionament és: Mateix Color suma poder a la teva carta. Color Diferente resta poder. Un resultat negatiu causa Inestabilitat i genera Dany de retrocés cap l'atacant. L'atac del Vòrtex no es pot defensar amb cartes." },
      leveling: { title: "Pujar Nivell", text: "Selecciona cartes a la teva mà que sumin un valor de 10 o més per Pujar de Nivell un cop per torn. Màx Nivell és 3. Pujar de nivell augmenta els atacs per torn i desbloqueja habilitats superiors." },
      abilities: { title: "Habilitats", text: "Descarta 1 carta per robar 1 Habilitat per torn. Personatges amb afinitat per màgia Blanca o Negra tenen (Màx Hab = Nivell + 1) i tan sols poden utilitzar habilitats Neutrals o de la seva afinitat. Els Neutrals tenen (Màx Hab = Nivell) i poden utilitzar TOTES les habilitats. Les habilitats poden ser Passives o Actives (les actives requereixen descartar 1 carta cada vegada)." }
    },
    lore: {
      title: "L'Univers del Vòrtex",
      p1: "Som en un univers on la màgia és una força fonamental, l'origen de tot plegat. Però aquest equilibri s'ha trencat. Un Vòrtex Màgic de dimensions galàctiques ha aparegut, amenaçant de consumir tota l'existència.",
      p2: "Tan sols uns pocs escollits, capaços de canalitzar les energies primordiales de la màgia, poden evitar la destrucció total.",
      p3: "La Màgia Blanca i la Màgia Negra són dues cares de la mateixa moneda: oposats naturals que s'atrauen i s'anul·len. Has de dominar aquestes forces, explotar la seva dualitat i sobreviure al caos del Vòrtex per salvar l'univers... o convertir-te en l'executor supervivent del seu final.",
      win: "Has sobreviscut al Vòrtex!",
      loss: "Has estat consumit pel caos!"
    },
    characterLore: {
        char1: "Membre del consell de savis del bosc de les fades. Sacerdot de la Natura, Protector del Bosc i les seves criatures, Jutge i executor dels dictàmens del cercle etern, que governa l'equilibri de tot ésser que s'endinsi en els dominis de Gaia. Poderós personatge, amb una moral i un fort sentit de la ètica i la virtud, sensible a la màgia de la llum, especialment a tot allò que té a veure amb la mare natura i el seu delicat equilibri, evolució i canvi constant.",
        char2: "Summum Sacerdot dels Escamats, habitant dels Zigurats Maragda en la profunditat de la selva primigènia. Custodia els antics rituals de sangre que mantenen el sol cremant. Líder d'una casta guerrera que creu que la força és l'única veritat absoluta, canalitzant energies fosques per manipular el teixit de la màgia.",
        char3: "Serafí de l'Agulla Cristal·lina, que ha devallat dels Alts Cels Infinits per purgar la corrupció del Vòrtex. Empunyant una espasa de llum estel·lar pura, jutja els indignes amb una imparcial ira divina. Un ésser de puresa absoluta que veu el Vòrtex com una taca en la creació que ha de ser netejada per la Llum.",
        char4: "Arxiduc del Pou d'Obsidiana, tirà nascut de l'ombra i la malícia que busca tòrcer el Vòrtex per convertir-lo en un portal per a les seves legions infernals. S'alimenta de la desesperació i comanda les arts fosques amb una mestresa aterradora, creient que el caos és l'única escala real al poder.",
        char5: "Gran Mestre del Pic Silenciós. Després de meditar durant segles a l'agulla més alta del món, ha assolit l'equilibri perfecte entre cos i esperit. No lluita per destruir, sinó per restaurar el flujo de l'harmonia, utilitzant la seva voluntat de ferro per desviar atacs amb la fluïdesa de l'aigua.",
        char6: "Alfa Supremo de l'Eixam. Una màquina de guerra biològica evolucionada per a l'eficiència en un món consumit per eixams d'insectes massius. En la seva ment rusc no hi ha un 'jo', només la colònia. La màgia és només un altre recurs per a collir i utilitzar. És un depredador implacable adaptat per sobreviure en qualsevol entorn.",
        char7: "El Senyor Lich de les Criptes. Antany un erudit que temia la mort, ara el seu mestre. Ha sacrificat la seva humanitat per lligar la seva ànima a filactèries de poder fosc. Comanda les arts prohibides per drenar la vida dels seus enemics, demostrant que la mort no és el final, sino una arma per fer-se més fort.",
        char8: "Cavaller Lònid Comandant de l'Orgull Solar. Un noble guerrer de les ciutats estat de la Sabana Daurada. El seu rugit invoca i inspira el coratge dels reis i soldats, i la seva espasa brilla amb la fúria del sol de migdia. Guiat per un indestructible codi d'honor, s'erigeix com un far d'esperança contra la foscor invasora.",
        char9: "Veu dels Ancestres. Guía espiritual dels tròpics exuberants, sintonitzat amb els murmuris de la terra i el cel. Canalitza els tòtems primigenis per veure el que els altres no poden imaginar, guiant la seva tribu a través del caos amb visions del futuro i la saviesa del passat.",
        char10: "Unitat 734-M, Singularitat personificada. Nascut d'un món on la biologia i els circuits s'han fusionat. Perceb la màgia com algoritmes complexos esperant a ser optimitzats. La seva lògica és absoluta, els seus càlculs impecables, i busca descodificar el Vòrtex per actualitzar el sistema operatiu de l'univers.",
        char11: "Arximaga de la Torre Violeta. Una prodigi d'una civilització on la màgia és tan comuna com l'aire que respiren. Teixeix encanteris amb gràcia natural, manipulando el teixit de la realitat mateixa. Per a ella, el Vòrtex no és una amenaça, sinó una font il·limitada de mannà esperant ser modelada per una mà mestra.",
        char12: "Avatar de la Tempesta Primigènia. Nascut del propi Vòrtex, una convergencia caótica de foc, aigua, terra i l'aire. No té moralitat, només la força bruta i indòmita de la natura buscant tornar-ho tot al caos elemental. És la tempesta que s'apropa, el terratrèmol que destrueix i el foc que consumeix."
    },
    abilities: {
        MAGIC_WALL: { name: "Mur Màgic", desc: "Activa. Descarta 1. Crea Escut = Valor Carta." },
        DARK_DEFENSE: { name: "Defensa Fosca", desc: "Passiva. Cartas Def Negres +Nivell." },
        LIGHT_DEFENSE: { name: "Defensa de Llum", desc: "Passiva. Cartas Def Blanques +Nivell." },
        PALADIN_OF_LIGHT: { name: "Paladí de Llum", desc: "Passiva. Cartas Atc Blanques +Nivell." },
        DARK_LORD: { name: "Senyor Fosc", desc: "Passiva. Cartas Atc Negres +Nivell." },
        // MAGIC_AFFINITY: { name: "Afinitat Màgica", desc: "Activa. Descarta 1. Cura Valor/2 + Nivell." },
        MAGIC_VISION: { name: "Visió Màgica", desc: "Activa. Descarta 1. Revela mà oponente." },
        MAGIC_KNOWLEDGE: { name: "Coneixement Màgic", desc: "Passiva. Mida Mà +Nivell." },
        MAGIC_RESISTANCE: { name: "Resistència Màgica", desc: "Passiva. Vida Màx +10/Nivell." },
        MIND_CONTROL: { name: "Control Mental", desc: "Activa. Descarta 1. Oponente descarta Nivell." },
        ELEMENTAL_CONTROL: { name: "Control Elemental", desc: "Activa. Descarta 1. Canvia color carta." },
        MAGIC_CONTROL: { name: "Control Màgic", desc: "Activa. Descarta 1. Canvia tipus carta." },
        VORTEX_CONTROL: { name: "Control de Vòrtex", desc: "Passiva. Usa Vòrtex per Defensa 1 cop/torn." },
        LIGHT_AFFINITY: { name: "Afinitat Llum", desc: "Activa. Descarta Blanca. Cura Valor/2 + Nivell." },
        DARK_AFFINITY: { name: "Afinitat Fosca", desc: "Activa. Descarta Negra. Cura Valor/2 + Nivell." },
        // MASTER_CONTROL: { name: "Control Mestre", desc: "Activa. Descarta 1. Canvia color i tipus." },
        DARK_SERVANT: { name: "Servent Fosc", desc: "Passiva. Meitat dany Negre entrant." },
        ACOLYTE_OF_LIGHT: { name: "Acòlit de Llum", desc: "Passiva. Meitat dany Blanc entrant." },
        MASTER_AFFINITY: { name: "Afinitat Mestra", desc: "Activa. Descarta 1. Cura Valor complet." },
        MASTER_VORTEX: { name: "Vòrtex Mestre", desc: "Passiva. Atacs Vòrtex il·limitats." }
    },
    abilityDefinitions: {
      neutral: {
        title: "HABILITATS NEUTRALS",
        levels: {
            1: [
              { tag: 'MAGIC_WALL', icon: '🧱', name: 'Mur Màgic', type: 'Activa', desc: "Descarta una carta. Genera un escut permanent que no té color i que té el valor de la carta descartada. El Mur sempre resta el dany de l'atac que es rebi, inclòs l'atac rebotat que vingui del VORTEX. El Mur es va afeblint amb cada atac fins que es queda a 0. Només es pot activar un mur o escut durant el propi torn. Però un cop un jugador té un mur aquest es queda fins que és destruït. El propi jugador no pot desfer-se del seu escut o mur ni substituir-lo per un altre fins que sigui destruït." },
              // { tag: 'MAGIC_AFFINITY', icon: '❤️', name: 'Afinitat Màgica', type: 'Activa', desc: "Descarta una carta. Recupera tants punts de vitalidad com la meitat del valor de la carta descartada més el nivell del jugador. [♥X/2 + LV]" },
              { tag: 'MAGIC_VISION', icon: '🪬', name: 'Visió Màgica', type: 'Activa', desc: "Descarta una carta. Es mostren totes les cartes de l'oponent." },
              { tag: 'MAGIC_KNOWLEDGE', icon: '📖', name: 'Coneixement Màgic', type: 'Passiva', desc: "Incrementa el màxim nombre permés de cartes a la mà en +1 per nivell. [MAX Cartas + Nv]" },
              { tag: 'MAGIC_RESISTANCE', icon: '💪', name: 'Resistència Màgica', type: 'Passiva', desc: "Incrementa el màxim de punts de vitalitat permès en +10 per nivell). [MAX vit ♥ + Nv x10]" }
            ],
            2: [
              { tag: 'MIND_CONTROL', icon: '🧠', name: 'Control Mental', type: 'Activa', desc: "Descarta una carta. Un oponente es descarta de tantes cartes com Nv del personatge." },
              { tag: 'ELEMENTAL_CONTROL', icon: '🔄️', name: 'Control Elemental', type: 'Activa', desc: "Descarta una carta. Canvia el color d'una carta pròpia. [□ ◄ ► ■]" },
              { tag: 'MAGIC_CONTROL', icon: '🔀', name: 'Control Màgic', type: 'Activa', desc: "Descarta una carta. Canvia el tipus d'una carta pròpia. [ATK ◄ ► DEF]" },
              { tag: 'VORTEX_CONTROL', icon: '🌀', name: 'Control de Vòrtex', type: 'Passiva', desc: "Permet utilitzar el VORTEX en defensa una vegada per torn (en els mateixos moments en què es podria defensar el jugador). La mecànica de funcionament del VORTEX és la mateixa que per l'atac." }
            ],
            3: [
              // { tag: 'MASTER_CONTROL', icon: '♻️', name: 'Control Mestre', type: 'Activa', desc: "Descarta una carta. Canvia el color i el tipus d'una carta pròpia. [□ ◄ ► ■][ATK ◄ ► DEF]" },
              { tag: 'MASTER_AFFINITY', icon: '💖', name: 'Afinitat Mestra', type: 'Activa', desc: "Descarta una carta. Recupera tants punts de vitalitat com el valor de la carta descartada.[♥X]" },
              { tag: 'MASTER_VORTEX', icon: '♾️', name: 'Vòrtex Mestre', type: 'Passiva', desc: "Permet utilitzar el VORTEX tantes vegades com el jugador vulgui en atac durant el seu torn. És a dir el VORTEX ja no està limitat a una vegada per torn." }
            ]
        }
      },
      white: {
        title: "HABILITATS D'AFINITAT BLANCA",
        levels: {
            1: [
              { tag: 'LIGHT_DEFENSE', icon: '🛡️', name: 'Defensa de Llum', type: 'Passiva', desc: "Incrementa qualsevol carta de defensa blanca en +1 per nivell. [DEF □ + Nv]" },
              { tag: 'PALADIN_OF_LIGHT', icon: '⚔️', name: 'Paladí de Llum', type: 'Passiva', desc: "Incrementa qualsevol carta d'atac blanca en +1 per nivell. [ATK □ + Nv]" }
            ],
            2: [
              { tag: 'LIGHT_AFFINITY', icon: '🤍', name: 'Afinitat de Llum', type: 'Activa', desc: "Descarta una carta blanca. Recupera tants punts de vitalidad com la meitat del valor de la carta descartada. [♥X/2 □ + Nv]" }
            ],
            3: [
              { tag: 'ACOLYTE_OF_LIGHT', icon: '🔆', name: 'Acòlit de Llum', type: 'Passiva', desc: "Redueix tot el dany d'un atac blanc a la meitat (arrodonint cap a baix). [ATK □ /2]" }
            ]
        }
      },
      black: {
        title: "HABILITATS D'AFINITAT NEGRA",
        levels: {
            1: [
              { tag: 'DARK_DEFENSE', icon: '🛡️', name: 'Defensa Fosca', type: 'Passiva', desc: "Incrementa qualsevol carta de defensa Negra en +1 per nivell. [DEF ■ + Nv]" },
              { tag: 'DARK_LORD', icon: '⚔️', name: 'Senyor Fosc', type: 'Passiva', desc: "Incrementa qualsevol carta d'atac negra en +1 per nivell. [ATK ■ + Nv]" }
            ],
            2: [
              { tag: 'DARK_AFFINITY', icon: '🖤', name: 'Afinitat Fosca', type: 'Activa', desc: "Descarta una carta negra. Recupera tants punts de vitalidad com la meitat del valor de la carta descartada. [♥X/2 ■ + Nv]" }
            ],
            3: [
              { tag: 'DARK_SERVANT', icon: '🌑', name: 'Servent Fosc', type: 'Passiva', desc: "Redueix tot el dany d'un atac negre a la meitat (arrodonint cap a baix). [ATK ■ /2]" }
            ]
        }
      }
    },
    warnings: {
        levelTooLow: "Nivell insuficient.",
        alreadyActive: "Habilitat ja activa.",
        drawLimit: "Només 1 habilitat per torn.",
        vortexLimit: "Límit de Vòrtex assolit.",
        maxAttacks: "Límit d'atacs assolit pel teu nivell.",
        maxLevel: "Nivell Màxim assolit.",
        selectSum: "Cartas han de sumar 10.",
        oneLevelPerTurn: "Només 1 nivell per torn.",
        selectOneToDiscard: "Selecciona exactament 1 carta per descartar.",
        lightAffinityReq: "Afinitat de Llum requereix descartar carta BLANCA.",
        darkAffinityReq: "Afinitat Fosca requereix descartar carta NEGRA.",
        shieldActive: "Escut ja actiu. Ha d'arribar a 0 per reemplaçar.",
        abilityUsed: "Habilitat ja usada aquest torn.",
        noAbilities: "No hi ha habilitats disponibles per a la teva afinitat/nivell.",
        selectAttackCard: "Si us plau, selecciona una carta d'Atac primer.",
        abilityLimitReached: "Límit d'Habilitats actives assolit.",
        selectAttackToExec: "Selecciona una carta d'Atac per executar.",
        selectDiscardForDraw: "Selecciona una carta per descartar.",
        selectCardsForLevelUp: "Selecciona cartas que sumen 10 o més.",
        selectDiscardGeneric: "Selecciona una carta per descartar.",
        wrongAffinity: "El teu personatge no pot utilitzar aquesta afinitat.",
    },
    logs: {
        turnStart: (p: string) => `--- Inici Torn de ${p} ---`,
        drewCards: (p: string, n: number) => `${p} va robar ${n} cartes de poder.`,
        handFull: "Mà plena. Fase Principal.",
        aiAttacks: (val: number, col: string, n: number) => `IA Ataca amb ${val} ${col}! (Atac ${n}/2)`,
        aiEnds: "IA Acaba Torn.",
        discardToAct: (val: number, name: string) => `Descartat ${val} per activar ${name}.`,
        shieldSet: (val: number) => `Escut Permanent fixat a ${val}.`,
        healed: (n: number) => `Curat ${n} HP.`,
        mindControl: (v: number, n: number) => `Vas descartar ${v}. IA va descartar ${n} cartas.`,
        selectTarget: "Ara tria carta a la mà per modificar.",
        changedCard: (desc: string) => `Carta canviada: ${desc}`,
        vortexAttack: "Iniciant Atac de Vòrtex...",
        defendWith: (val: number, col: string) => `Defensa amb ${val} ${col}.`,
        noDef: "Decideix no defensar.",
        damage: (dmg: number, target: string) => `${dmg} dany a ${target}.`,
        blocked: "Bloquejat! 0 dany.",
        bounce: (dmg: number, target: string) => `REBOT! ${target} rep ${dmg} retrocés!`,
        shieldAbsorb: (n: number) => `(Escut absorbeix ${n})`,
        addedToZone: (name: string) => `Afegit ${name} a Zona de Comandament.`,
        levelUp: (lvl: number) => `Pujat de Nivell! Ara Nivell ${lvl}.`,
        activating: (name: string) => `Activant ${name}...`,
        handsDealt: "Mans repartides. Vòrtex format. Comença!",
        matchStart: (p: string, ai: string) => `Jugador: ${p} vs IA: ${ai}.`,
        vortexDefensePrefix: "DEFENSA VÒRTEX! ",
        vortexHitPrefix: "VÒRTEX! ",
        instabilityPrefix: "INESTABILITAT! ",
        vortexNeutralized: "VÒRTEX NEUTRALIZED.",
        vs: " vs ",
        atkLabel: "(Atc)",
        defLabel: "(Def)",
        vortexLabel: "(Vòrtex)",
        discardedGeneric: (val: number, col: string, type: string) => `Descartat ${val} ${col} ${type}.`,
        visionActivated: "Visió Màgica! Mà oponent revelada.",
        aiLevelsUp: "IA puja de Nivell!",
        aiDrawsAbility: "IA roba una Habilitat.",
        actionCancelled: (name: string) => `Cancel·lada activació de ${name}.`
    }
  }
};

export const getTransAbility = (tag: string, lang: Language) => {
  // @ts-ignore - dynamic access
  return TEXTS[lang].abilities[tag] || { name: tag, desc: "..." };
};