
import type { Player, Card, AbilityCard, CardColor } from '../types';
import { calculateDirectDamage } from './gameLogic';

/**
 * AI LOGIC ENGINE V2.5
 * Handles specific decision making based on Round Difficulty.
 */

/**
 * PHASE 1: LEVEL UP CHECK
 * Round 1: Never levels up.
 * Round 2: Tries to level up if hand allows sum >= 10.
 * Round 3: Tries to level up using Defense cards primarily, keeping Attacks if possible.
 */
export const getAiLevelUpCards = (hand: Card[], round: number, level: number): Card[] | null => {
    if (round === 1) return null; // Beginner AI never levels up
    if (level >= round) return null; // Cap level at Round number (1, 2, or 3)

    // Helper: Find subset that sums >= 10
    const findSum = (cards: Card[]): Card[] | null => {
        // Simple greedy approach: Sort Descending
        const sorted = [...cards].sort((a, b) => b.value - a.value);
        let sum = 0;
        const selection: Card[] = [];
        
        for (const c of sorted) {
            selection.push(c);
            sum += c.value;
            if (sum >= 10) return selection;
        }
        return null;
    };

    if (round === 2) {
        // Intermediate: Just level up if possible with any cards
        return findSum(hand);
    }

    if (round === 3) {
        // Advanced: Try to level up without spending strong ATK cards if possible
        const defCards = hand.filter(c => c.type === 'DEF');
        const pureDefSum = findSum(defCards);
        if (pureDefSum) return pureDefSum;

        // If not possible with just DEF, try keeping at least 1 high ATK card
        const atkCards = hand.filter(c => c.type === 'ATK').sort((a,b) => b.value - a.value);
        if (atkCards.length > 0) {
            const bestAtk = atkCards[0];
            const others = hand.filter(c => c.id !== bestAtk.id);
            const mixSum = findSum(others);
            if (mixSum) return mixSum;
        }
        
        // Desperation: Level up anyway if possible
        return findSum(hand);
    }

    return null;
};

/**
 * PHASE 1b: ABILITY DRAW CHECK
 * Round 3 Only: If hand has weak cards (1 or 2), discard to draw ability.
 */
export const getAiAbilityDiscard = (hand: Card[], round: number, abilitiesDrawn: number): Card | null => {
    if (round < 3) return null; // Only Advanced AI optimizes deck
    if (abilitiesDrawn >= 1) return null;

    // Find weak card (Value 1 or 2)
    const weakCard = hand.find(c => c.value <= 2);
    return weakCard || null;
};

/**
 * PHASE 2: ATTACK SELECTION
 * Round 1 & 2: Highest ATK.
 * Round 3: Select top N attacks (where N = allowed attacks). Play them in ASCENDING order (lowest of best first).
 */
export const getAiAttackCard = (hand: Card[], round: number, attacksPerformed: number, maxAttacks: number): Card | null => {
    const atkCards = hand.filter(c => c.type === 'ATK').sort((a, b) => b.value - a.value);
    
    if (atkCards.length === 0) return null;

    // Beginner & Intermediate logic: Strongest Card
    if (round < 3) {
        return atkCards[0];
    }

    // Advanced logic: Optimization sequence
    // If AI can do N attacks, it selects the best N cards.
    // Then plays them starting from the weakest of that set.
    const attacksRemaining = maxAttacks - attacksPerformed;
    if (attacksRemaining <= 0) return null;

    // Determine the 'plan' based on current hand.
    // Assuming AI re-evaluates the "Best Set" every turn based on current hand state.
    
    // Take the best 'attacksRemaining' cards.
    const bestSet = atkCards.slice(0, attacksRemaining);
    
    // Play the lowest value from this best set to bait defense
    const cardToPlay = bestSet[bestSet.length - 1]; // Last item is the smallest of the top set
    return cardToPlay;
};

/**
 * DEFENSE SELECTION
 * Round 1: Highest DEF.
 * Round 2: Smart Match (Minimizes waste, prefers opposite color).
 * Round 3: Simulation (Minimizes actual HP loss).
 */
export const getAiDefenseCard = (
    hand: Card[], 
    attackCard: Card, 
    round: number, 
    attacker: Player, 
    defender: Player
): Card | null => {
    const defCards = hand.filter(c => c.type === 'DEF');
    if (defCards.length === 0) return null;

    // Beginner: Highest Value
    if (round === 1) {
        return defCards.sort((a, b) => b.value - a.value)[0];
    }

    // Intermediate: Smart Match (Close to attack value, Opposite Color preferred)
    if (round === 2) {
        const attackVal = attackCard.value;
        const oppositeColor = attackCard.color === 'BLACK' ? 'WHITE' : 'BLACK';
        
        // Sort by how efficient they are.
        // We want Def >= Atk (Opposite) or Floor(Def/2) >= Atk (Same)
        // Score: Lower 'waste' is better.
        
        const scored = defCards.map(c => {
            let effectiveness = c.value;
            if (c.color !== oppositeColor) effectiveness = Math.floor(c.value / 2);
            
            // Waste = Effectiveness - AttackVal. We want >= 0.
            const waste = effectiveness - attackVal;
            
            // Penalty for failing to block
            if (waste < 0) return { card: c, score: -1000 + waste }; // Negative score for taking damage
            
            // Penalty for Overkill (wasting a high card on low attack)
            return { card: c, score: -waste }; // Closer to 0 is better
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].card;
    }

    // Advanced: Simulation
    if (round === 3) {
        let bestCard: Card | null = null;
        let minDamage = 999;
        let bestValue = 999; // Tiebreaker: use cheapest card

        for (const card of defCards) {
            // Simulate damage
            const result = calculateDirectDamage(attackCard, card, attacker, defender);
            // Check if damage targets defender (Player ID or AI ID)
            // If result.targetId is AI, it's damage taken. If NULL, it's 0. If PLAYER, it's reflected (Good!)
            let dmgTaken = 0;
            if (result.targetId === defender.id) dmgTaken = result.damage;
            if (result.targetId === attacker.id) dmgTaken = -result.damage; // Bonus for reflecting!

            if (dmgTaken < minDamage) {
                minDamage = dmgTaken;
                bestCard = card;
                bestValue = card.value;
            } else if (dmgTaken === minDamage) {
                // Save resources: use lower value card for same result
                if (card.value < bestValue) {
                    bestCard = card;
                    bestValue = card.value;
                }
            }
        }
        return bestCard;
    }

    return defCards[0]; // Fallback
};