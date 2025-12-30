
import type { Player, Card, AbilityCard, CardColor } from '../types';
import { calculateDirectDamage } from './gameLogic';

/**
 * AI LOGIC ENGINE V2.6 (Optimized)
 * Handles specific decision making based on Round Difficulty.
 */

/**
 * PHASE 1: LEVEL UP CHECK
 * Optimization: Solves Subset Sum Problem to find combo closest to 10 without going too high,
 * or minimizing the loss of high value cards.
 */
export const getAiLevelUpCards = (hand: Card[], round: number, level: number): Card[] | null => {
    if (round === 1) return null; // Beginner AI never levels up
    if (level >= round) return null; // Cap level at Round number

    // Helper: Find exact subset sum >= 10 with minimum card count or minimum value overflow
    const findOptimalSubset = (cards: Card[]): Card[] | null => {
        // Filter out cards effectively to avoid complexity, though for hand size 5 it's negligible.
        // We want a combination that sums >= 10.
        
        let bestCombination: Card[] | null = null;
        let minSum = 999;

        // Power Set approach (2^N) is fine for N=5 to 7 cards.
        const totalSubsets = 1 << cards.length;
        for (let i = 0; i < totalSubsets; i++) {
            const currentSubset: Card[] = [];
            let currentSum = 0;

            for (let j = 0; j < cards.length; j++) {
                if ((i & (1 << j)) !== 0) {
                    currentSubset.push(cards[j]);
                    currentSum += cards[j].value;
                }
            }

            if (currentSum >= 10) {
                // Criteria: prefer sums closer to 10 (less waste)
                if (currentSum < minSum) {
                    minSum = currentSum;
                    bestCombination = currentSubset;
                } else if (currentSum === minSum) {
                    // Tie-breaker: prefer discarding FEWER cards (keep hand size)
                    // OR prefer discarding MORE cards (cycle deck)? 
                    // Let's prefer discarding FEWER high value cards -> smaller length usually means higher values, wait.
                    // Actually, we want to discard worst cards. 
                    // Simple logic: Minimize sum is usually best.
                    if (bestCombination && currentSubset.length > bestCombination.length) {
                         // If sums are equal, discard the one with MORE cards (get rid of junk)
                         bestCombination = currentSubset;
                    }
                }
            }
        }
        return bestCombination;
    };

    if (round === 2) {
        // Intermediate: Just level up if possible
        return findOptimalSubset(hand);
    }

    if (round === 3) {
        // Advanced: Try to avoid using the single best Attack card
        const atkCards = hand.filter(c => c.type === 'ATK').sort((a, b) => b.value - a.value);
        
        if (atkCards.length > 0) {
            const bestAtkId = atkCards[0].id;
            const handWithoutBest = hand.filter(c => c.id !== bestAtkId);
            const optimalWithoutBest = findOptimalSubset(handWithoutBest);
            
            if (optimalWithoutBest) return optimalWithoutBest;
        }
        
        // If we can't save the best card, just level up normally
        return findOptimalSubset(hand);
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
    const attacksRemaining = maxAttacks - attacksPerformed;
    if (attacksRemaining <= 0) return null;

    // Take the best 'attacksRemaining' cards.
    const bestSet = atkCards.slice(0, attacksRemaining);
    
    // Play the lowest value from this best set to bait defense
    const cardToPlay = bestSet[bestSet.length - 1]; 
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

    // Intermediate: Smart Match
    if (round === 2) {
        const attackVal = attackCard.value;
        const oppositeColor = attackCard.color === 'BLACK' ? 'WHITE' : 'BLACK';
        
        const scored = defCards.map(c => {
            let effectiveness = c.value;
            if (c.color !== oppositeColor) effectiveness = Math.floor(c.value / 2);
            
            const waste = effectiveness - attackVal;
            
            if (waste < 0) return { card: c, score: -1000 + waste }; 
            return { card: c, score: -waste }; 
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].card;
    }

    // Advanced: Simulation
    if (round === 3) {
        let bestCard: Card | null = null;
        let minDamage = 999;
        let bestValue = 999;

        for (const card of defCards) {
            const result = calculateDirectDamage(attackCard, card, attacker, defender);
            let dmgTaken = 0;
            if (result.targetId === defender.id) dmgTaken = result.damage;
            if (result.targetId === attacker.id) dmgTaken = -result.damage;

            if (dmgTaken < minDamage) {
                minDamage = dmgTaken;
                bestCard = card;
                bestValue = card.value;
            } else if (dmgTaken === minDamage) {
                if (card.value < bestValue) {
                    bestCard = card;
                    bestValue = card.value;
                }
            }
        }
        return bestCard || defCards[0]; 
    }

    return defCards[0];
};
