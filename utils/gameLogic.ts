
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
 * LOGIC: Combat Result first, THEN Shield absorption.
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
  if (attackCard.color === 'BLACK' && defender.activeAbilities.some(a => a.effectTag === 'DARK_SERVANT')) {
      attackValue = Math.floor(attackValue / 2);
  }
  if (attackCard.color === 'WHITE' && defender.activeAbilities.some(a => a.effectTag === 'ACOLYTE_OF_LIGHT')) {
      attackValue = Math.floor(attackValue / 2);
  }

  // --- 1. RESOLVE COMBAT MATH (Attack vs Defense) ---
  let combatDamage = 0; // Positive = Damage to Defender. Negative = Damage to Attacker.
  let calculationLog = "";

  if (!defenseCard) {
    combatDamage = attackValue;
    calculationLog = `${attacker.id}: ${attackValue} ${log.vs} ${log.noDef}`;
  } else {
    const defenseValue = getModifiedValue(defenseCard, defender);
    
    if (attackCard.color !== defenseCard.color) {
      // Opposite Colors: Atk - Def
      combatDamage = attackValue - defenseValue;
      calculationLog = `${attackValue} ${log.atkLabel} - ${defenseValue} ${log.defLabel}`;
    } else {
      // Same Color: Atk - floor(Def/2)
      const effectiveDef = Math.floor(defenseValue / 2);
      combatDamage = attackValue - effectiveDef;
      calculationLog = `${attackValue} ${log.atkLabel} - ${effectiveDef} [${defenseValue}/2] ${log.defLabel}`;
    }
  }

  // --- 2. APPLY MAGIC WALL (SHIELD) AFTER MATH ---
  // If result is Positive, Defender takes damage -> Check Defender's Shield
  // If result is Negative, Attacker takes damage -> Check Attacker's Shield

  if (combatDamage > 0) {
      // Damage to Defender
      let finalDamage = combatDamage;
      let currentShield = defender.permanentShield ? defender.permanentShield.value : 0;
      let shieldMsg = "";

      if (currentShield > 0) {
          const absorbed = Math.min(currentShield, finalDamage);
          currentShield -= absorbed;
          finalDamage -= absorbed;
          shieldMsg = ` ${log.shieldAbsorb(absorbed)}`;
      }

      return {
          damage: finalDamage,
          targetId: defender.id,
          logMessage: `${calculationLog} = ${finalDamage > 0 ? log.damage(finalDamage, defender.id) : log.blocked}${shieldMsg}`,
          shieldRemaining: currentShield
      };

  } else if (combatDamage < 0) {
      // Recoil to Attacker (Instability / Bounce)
      let recoil = Math.abs(combatDamage);
      let finalDamage = recoil;
      let currentShield = attacker.permanentShield ? attacker.permanentShield.value : 0;
      let shieldMsg = "";

      if (currentShield > 0) {
          const absorbed = Math.min(currentShield, finalDamage);
          currentShield -= absorbed;
          finalDamage -= absorbed;
          shieldMsg = ` ${log.shieldAbsorb(absorbed)}`;
      }

      return {
          damage: finalDamage,
          targetId: attacker.id,
          logMessage: `${calculationLog}. ${log.bounce(recoil, attacker.id)}${shieldMsg}`,
          shieldRemaining: currentShield
      };

  } else {
      // EXACT BLOCK (0 Damage)
      return {
          damage: 0,
          targetId: null,
          logMessage: `${log.blocked} ${calculationLog} = 0.`,
          shieldRemaining: defender.permanentShield ? defender.permanentShield.value : 0
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
    
    // --- 1. RESOLVE VORTEX MATH ---
    let combatDamage = 0;
    let calculationLog = "";

    // Vortex Math Logic
    if (attackCard.color === vortexCard.color) {
        combatDamage = attackValue + vortexValue;
        calculationLog = `${attackValue} ${log.atkLabel} + ${vortexValue} ${log.vortexLabel}`;
    } else {
        combatDamage = attackValue - vortexValue;
        calculationLog = `${attackValue} ${log.atkLabel} - ${vortexValue} ${log.vortexLabel}`;
    }

    // --- 2. APPLY MAGIC WALL (SHIELD) ---
    
    if (combatDamage > 0) {
        // Positive result: Hit the defender
        let finalDamage = combatDamage;
        let currentShield = defender.permanentShield ? defender.permanentShield.value : 0;
        let shieldMsg = "";

        if (currentShield > 0) {
            const absorbed = Math.min(currentShield, finalDamage);
            currentShield -= absorbed;
            finalDamage -= absorbed;
            shieldMsg = ` ${log.shieldAbsorb(absorbed)}`;
        }

        return {
            damage: finalDamage,
            targetId: defender.id,
            logMessage: `${log.vortexHitPrefix}${calculationLog} = ${finalDamage > 0 ? log.damage(finalDamage, defender.id) : log.blocked}${shieldMsg}`,
            shieldRemaining: currentShield
        };
       
    } else if (combatDamage < 0) {
        // Negative result: Instability / Recoil on Attacker
        let recoil = Math.abs(combatDamage);
        let finalDamage = recoil;
        let currentShield = attacker.permanentShield ? attacker.permanentShield.value : 0;
        let shieldMsg = "";

        if (currentShield > 0) {
            const absorbed = Math.min(currentShield, finalDamage);
            currentShield -= absorbed;
            finalDamage -= absorbed;
            shieldMsg = ` ${log.shieldAbsorb(absorbed)}`;
        }

        return {
            damage: finalDamage,
            targetId: attacker.id,
            logMessage: `${log.instabilityPrefix}${calculationLog}. ${log.bounce(recoil, attacker.id)}${shieldMsg}`,
            shieldRemaining: currentShield
        };

    } else {
        // 0 Damage
        return {
            damage: 0,
            targetId: null,
            logMessage: `${log.vortexNeutralized} ${calculationLog} = 0.`,
            shieldRemaining: defender.permanentShield ? defender.permanentShield.value : 0
        };
    }
};
