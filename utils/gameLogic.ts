
import type { Card, Player, Language } from '../types';
import { TEXTS } from '../translations';

interface DamageResult {
  damage: number;
  targetId: 'PLAYER' | 'AI' | null; 
  logMessage: string;
  shieldRemaining?: number;
}

export const getMaxLife = (player: Player): number => {
    let maxLife = 40; 
    const res = player.activeAbilities.find(a => a.effectTag === 'MAGIC_RESISTANCE');
    if (res) {
        maxLife += (player.level * 10);
    }
    return maxLife;
};

export const getModifiedValue = (card: Card, player: Player): number => {
  let value = card.value;
  
  const darkDefense = player.activeAbilities.find(a => a.effectTag === 'DARK_DEFENSE');
  if (darkDefense && card.type === 'DEF' && card.color === 'BLACK') value += player.level;
  
  const lightDefense = player.activeAbilities.find(a => a.effectTag === 'LIGHT_DEFENSE');
  if (lightDefense && card.type === 'DEF' && card.color === 'WHITE') value += player.level;

  const darkLord = player.activeAbilities.find(a => a.effectTag === 'DARK_LORD');
  if (darkLord && card.type === 'ATK' && card.color === 'BLACK') value += player.level;

  const paladin = player.activeAbilities.find(a => a.effectTag === 'PALADIN_OF_LIGHT');
  if (paladin && card.type === 'ATK' && card.color === 'WHITE') value += player.level;

  return value;
};

/**
 * HELPER: Applies Shield logic to incoming damage
 */
const applyShieldToDamage = (damage: number, victim: Player, log: any): { finalDamage: number, shieldRemaining: number, logSnippet: string } => {
    let finalDamage = damage;
    let currentShield = victim.permanentShield ? victim.permanentShield.value : 0;
    let logSnippet = "";

    if (currentShield > 0) {
        const absorbed = Math.min(currentShield, finalDamage);
        currentShield -= absorbed;
        finalDamage -= absorbed;
        logSnippet = ` ${log.shieldAbsorb(absorbed)}`;
    }
    return { finalDamage, shieldRemaining: currentShield, logSnippet };
};

export const calculateDirectDamage = (
  attackCard: Card,
  defenseCard: Card | null,
  attacker: Player,
  defender: Player,
  lang: Language = 'en'
): DamageResult => {
  let attackValue = getModifiedValue(attackCard, attacker);
  const log = (TEXTS[lang] || TEXTS['en']).logs;
  
  if (attackCard.color === 'BLACK' && defender.activeAbilities.some(a => a.effectTag === 'DARK_SERVANT')) {
      attackValue = Math.floor(attackValue / 2);
  }
  if (attackCard.color === 'WHITE' && defender.activeAbilities.some(a => a.effectTag === 'ACOLYTE_OF_LIGHT')) {
      attackValue = Math.floor(attackValue / 2);
  }

  let combatDamage = 0; 
  let calculationLog = "";

  if (!defenseCard) {
    combatDamage = attackValue;
    calculationLog = `${attacker.id}: ${attackValue} ${log.vs} ${log.noDef}`;
  } else {
    const defenseValue = getModifiedValue(defenseCard, defender);
    if (attackCard.color !== defenseCard.color) {
      combatDamage = attackValue - defenseValue;
      calculationLog = `${attackValue} ${log.atkLabel} - ${defenseValue} ${log.defLabel}`;
    } else {
      const effectiveDef = Math.floor(defenseValue / 2);
      combatDamage = attackValue - effectiveDef;
      calculationLog = `${attackValue} ${log.atkLabel} - ${effectiveDef} [${defenseValue}/2] ${log.defLabel}`;
    }
  }

  if (combatDamage > 0) {
      const { finalDamage, shieldRemaining, logSnippet } = applyShieldToDamage(combatDamage, defender, log);
      return {
          damage: finalDamage,
          targetId: defender.id,
          logMessage: `${calculationLog} = ${finalDamage > 0 ? log.damage(finalDamage, defender.id) : log.blocked}${logSnippet}`,
          shieldRemaining
      };
  } else if (combatDamage < 0) {
      const recoil = Math.abs(combatDamage);
      const { finalDamage, shieldRemaining, logSnippet } = applyShieldToDamage(recoil, attacker, log);
      return {
          damage: finalDamage,
          targetId: attacker.id,
          logMessage: `${calculationLog}. ${log.bounce(recoil, attacker.id)}${logSnippet}`,
          shieldRemaining
      };
  } else {
      return {
          damage: 0,
          targetId: null,
          logMessage: `${log.blocked} ${calculationLog} = 0.`,
          shieldRemaining: defender.permanentShield ? defender.permanentShield.value : 0
      };
  }
};

export const calculateVortexDamage = (
  attackCard: Card,
  vortexCard: Card,
  attacker: Player,
  defender: Player,
  lang: Language = 'en'
): DamageResult => {
    let attackValue = getModifiedValue(attackCard, attacker);
    const vortexValue = vortexCard.value;
    const log = (TEXTS[lang] || TEXTS['en']).logs;
    
    let combatDamage = 0;
    let calculationLog = "";

    if (attackCard.color === vortexCard.color) {
        combatDamage = attackValue + vortexValue;
        calculationLog = `${attackValue} ${log.atkLabel} + ${vortexValue} ${log.vortexLabel}`;
    } else {
        combatDamage = attackValue - vortexValue;
        calculationLog = `${attackValue} ${log.atkLabel} - ${vortexValue} ${log.vortexLabel}`;
    }

    if (combatDamage > 0) {
        const { finalDamage, shieldRemaining, logSnippet } = applyShieldToDamage(combatDamage, defender, log);
        return {
            damage: finalDamage,
            targetId: defender.id,
            logMessage: `${log.vortexHitPrefix}${calculationLog} = ${finalDamage > 0 ? log.damage(finalDamage, defender.id) : log.blocked}${logSnippet}`,
            shieldRemaining
        };
    } else if (combatDamage < 0) {
        const recoil = Math.abs(combatDamage);
        const { finalDamage, shieldRemaining, logSnippet } = applyShieldToDamage(recoil, attacker, log);
        return {
            damage: finalDamage,
            targetId: attacker.id,
            logMessage: `${log.instabilityPrefix}${calculationLog}. ${log.bounce(recoil, attacker.id)}${logSnippet}`,
            shieldRemaining
        };
    } else {
        return {
            damage: 0,
            targetId: null,
            logMessage: `${log.vortexNeutralized} ${calculationLog} = 0.`,
            shieldRemaining: defender.permanentShield ? defender.permanentShield.value : 0
        };
    }
};
