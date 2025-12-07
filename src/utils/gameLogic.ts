

import type { Card, Player, Language } from '../types';
import { TEXTS } from '../translations';

interface DamageResult {
  damage: number;
  targetId: 'PLAYER' | 'AI' | null; // Who takes the damage (Target or Attacker if bounced)
  logMessage: string;
  shieldRemaining?: number;
}

/**
 * MAX LIFE CALCULATION
 * Base 40 HP, plus bonuses from Magic Resistance (+10 per Level).
 */
export const getMaxLife = (player: Player): number => {
    let maxLife = 40; // Default
    const res = player.activeAbilities.find(a => a.effectTag === 'MAGIC_RESISTANCE');
    if (res) {
        maxLife += (player.level * 10);
    }
    return maxLife;
};

/**
 * CARD VALUE MODIFIER
 * Applies passive buffs based on Player Level and Active Abilities.
 * e.g., Dark Lord increases Black Attack cards.
 */
export const getModifiedValue = (card: Card, player: Player): number => {
  let value = card.value;
  
  // Dark Defense (Level 1): Black Def + Level
  const darkDefense = player.activeAbilities.find(a => a.effectTag === 'DARK_DEFENSE');
  if (darkDefense && card.type === 'DEF' && card.color === 'BLACK') {
      value += player.level;
  }
  
  // Light Defense (Level 1): White Def + Level
  const lightDefense = player.activeAbilities.find(a => a.effectTag === 'LIGHT_DEFENSE');
  if (lightDefense && card.type === 'DEF' && card.color === 'WHITE') {
      value += player.level;
  }

  // Dark Lord (Level 1): Black Atk + Level
  const darkLord = player.activeAbilities.find(a => a.effectTag === 'DARK_LORD');
  if (darkLord && card.type === 'ATK' && card.color === 'BLACK') {
      value += player.level;
  }

  // Paladin of Light (Level 1): White Atk + Level
  const paladin = player.activeAbilities.find(a => a.effectTag === 'PALADIN_OF_LIGHT');
  if (paladin && card.type === 'ATK' && card.color === 'WHITE') {
      value += player.level;
  }

  return value;
};

/**
 * DIRECT COMBAT CALCULATION
 * Handles Attack vs Defense card logic.
 */
export const calculateDirectDamage = (
  attackCard: Card,
  defenseCard: Card | null,
  attacker: Player,
  defender: Player,
  lang: Language = 'en'
): DamageResult => {
  let attackValue = getModifiedValue(attackCard, attacker);
  const log = TEXTS[lang].logs;
  
  // --- DEFENSIVE DEBUFFS (Level 3) ---
  // Dark Servant: Reduce Black Atk / 2
  if (attackCard.color === 'BLACK' && defender.activeAbilities.some(a => a.effectTag === 'DARK_SERVANT')) {
      attackValue = Math.floor(attackValue / 2);
  }
  // Acolyte of Light: Reduce White Atk / 2
  if (attackCard.color === 'WHITE' && defender.activeAbilities.some(a => a.effectTag === 'ACOLYTE_OF_LIGHT')) {
      attackValue = Math.floor(attackValue / 2);
  }

  // --- 1. PERMANENT SHIELD CHECK ---
  let currentShield = defender.permanentShield ? defender.permanentShield.value : 0;
  let damageThroughShield = attackValue;
  let shieldLogPart = "";
  
  if (currentShield > 0) {
      const absorbed = Math.min(currentShield, damageThroughShield);
      currentShield -= absorbed;
      damageThroughShield -= absorbed;
      shieldLogPart = log.shieldAbsorb(absorbed);
  }

  // If attack fully absorbed by shield, end here
  if (damageThroughShield <= 0) {
      return {
          damage: 0,
          targetId: null,
          logMessage: `${attacker.id}: ${attackValue}. ${log.blocked} ${shieldLogPart}`,
          shieldRemaining: currentShield
      };
  }
  
  // --- 2. NO DEFENSE CARD PLAYED ---
  if (!defenseCard) {
    return {
      damage: damageThroughShield,
      targetId: defender.id,
      logMessage: `${attacker.id}: ${attackValue} (${shieldLogPart}) ${log.vs} ${log.noDef} -> ${log.damage(damageThroughShield, defender.id)}`,
      shieldRemaining: currentShield
    };
  }

  // --- 3. ACTIVE DEFENSE CALCULATION ---
  const defenseValue = getModifiedValue(defenseCard, defender);
  let finalDamage = 0;
  let calculationLog = "";

  if (attackCard.color !== defenseCard.color) {
    // Opposite Colors: Atk - Def
    finalDamage = damageThroughShield - defenseValue;
    calculationLog = `${damageThroughShield} ${log.atkLabel} - ${defenseValue} ${log.defLabel}`;
  } else {
    // Same Color: Atk - floor(Def/2)
    const effectiveDef = Math.floor(defenseValue / 2);
    finalDamage = damageThroughShield - effectiveDef;
    calculationLog = `${damageThroughShield} ${log.atkLabel} - ${effectiveDef} [${defenseValue}/2] ${log.defLabel}`;
  }

  if (finalDamage > 0) {
    return {
      damage: finalDamage,
      targetId: defender.id,
      logMessage: `${calculationLog} = ${log.damage(finalDamage, defender.id)}`,
      shieldRemaining: currentShield
    };
  } else if (finalDamage < 0) {
    // Bounce Back Logic: Attacker takes damage
    const bounceDmg = Math.abs(finalDamage);
    return {
      damage: bounceDmg,
      targetId: attacker.id,
      logMessage: `${calculationLog}. ${log.bounce(bounceDmg, attacker.id)}`,
      shieldRemaining: currentShield
    };
  } else {
    // Exact block
    return {
      damage: 0,
      targetId: null,
      logMessage: `${log.blocked} ${calculationLog} = 0.`,
      shieldRemaining: currentShield
    };
  }
};

/**
 * VORTEX COMBAT CALCULATION
 * Handles interaction when Vortex is used for Attack or Defense.
 * Rule: Same Color = Add, Different Color = Subtract.
 */
export const calculateVortexDamage = (
  attackCard: Card,
  vortexCard: Card,
  attacker: Player,
  defender: Player,
  lang: Language = 'en'
): DamageResult => {
    let attackValue = getModifiedValue(attackCard, attacker);
    const vortexValue = vortexCard.value;
    const log = TEXTS[lang].logs;
    
    let damage = 0;
    let calculationLog = "";

    // Vortex Math Logic
    if (attackCard.color === vortexCard.color) {
        damage = attackValue + vortexValue;
        calculationLog = `${attackValue} ${log.atkLabel} + ${vortexValue} ${log.vortexLabel}`;
    } else {
        damage = attackValue - vortexValue;
        calculationLog = `${attackValue} ${log.atkLabel} - ${vortexValue} ${log.vortexLabel}`;
    }

    // Apply shield logic for defender
    let currentShield = defender.permanentShield ? defender.permanentShield.value : 0;
    
    if (damage > 0) {
        // Positive result: Hit the defender
        if (currentShield > 0) {
            const absorbed = Math.min(currentShield, damage);
            currentShield -= absorbed;
            damage -= absorbed;
        }

        if (damage > 0) {
             return {
                damage: damage,
                targetId: defender.id,
                logMessage: `${log.vortexHitPrefix}${calculationLog} = ${log.damage(damage, defender.id)}`,
                shieldRemaining: currentShield
            };
        } else {
            return {
                damage: 0,
                targetId: null,
                logMessage: `${log.vortexHitPrefix}${calculationLog} ${log.shieldAbsorb(damage + (currentShield - (currentShield - damage)))}`, // Simplified msg
                shieldRemaining: currentShield
            };
        }
       
    } else if (damage < 0) {
        // Negative result: Instability / Recoil on Attacker
        const recoil = Math.abs(damage);
        return {
            damage: recoil,
            targetId: attacker.id,
            logMessage: `${log.instabilityPrefix}${calculationLog}. ${log.bounce(recoil, attacker.id)}`,
            shieldRemaining: defender.permanentShield ? defender.permanentShield.value : 0
        };
    } else {
        return {
            damage: 0,
            targetId: null,
            logMessage: `${log.vortexNeutralized} ${calculationLog} = 0.`,
            shieldRemaining: currentShield
        };
    }
};