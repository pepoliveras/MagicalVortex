
import React, { useState, useEffect, useRef } from 'react';
import { FsmState } from '../types';
import type { Player, Card, AbilityCard, PendingAction, Character, Language } from '../types';
import CardComponent from './CardComponent';
// FIX: Strictly relative import
import { TEXTS, getTransAbility } from '../translations';

interface GameBoardProps {
  ai: Player;
  player: Player;
  vortexCards: (Card | null)[];
  fsmState: FsmState;
  pendingAction: PendingAction;
  onCardClick: (card: Card, owner: 'PLAYER' | 'AI' | 'VORTEX', index?: number) => void;
  onAbilityClick: (ability: AbilityCard) => void;
  onActiveAbilityClick: (ability: AbilityCard) => void;
  onCharacterClick: (character: Character) => void; // NEW PROP
  selectedCardId: string | null; // For single selection
  activeCardId: string | null; // NEW: For single active card highlight
  selectedAbilityId: string | null;
  validTargetIds: string[]; // IDs of cards that are valid targets (e.g., for Level Up)
  language: Language;
  highlightedAbilityId?: string | null; // NEW prop for momentary highlight
  round: number; // NEW prop
}

// --- SUB-COMPONENTS (Moved outside GameBoard for performance) ---

// Updated StatBadge with Flash logic and Size control
const StatBadge = ({ label, value, color, secondaryValue, icon, isLife = false, className = "" }: { label: string, value: number | string, color: string, secondaryValue?: string, icon?: string, isLife?: boolean, className?: string }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValue = useRef<number | string>(value);

  useEffect(() => {
    // Check if value is numeric and decreased
    if (typeof value === 'number' && typeof prevValue.current === 'number') {
      if (value < prevValue.current) {
        setIsFlashing(true);
        const timer = setTimeout(() => setIsFlashing(false), 1000);
        return () => clearTimeout(timer);
      }
    }
    prevValue.current = value;
  }, [value]);

  // Dynamic Styles for Font Size
  const textClass = isLife
    ? `text-5xl md:text-6xl tracking-tighter` // Maximized font size
    : `text-xl`;

  const flashStyle = isFlashing
    ? "shadow-[0_0_25px_5px_rgba(220,38,38,0.9)] bg-red-900/80 border-red-500 scale-105 transition-all duration-100 ease-in-out z-10"
    : "bg-slate-900 transition-all duration-500";

  return (
    <div className={`flex flex-col items-center justify-center rounded ${color} ${className} ${flashStyle}`}>
      <span className={`${isLife ? 'text-xs font-bold uppercase mb-1 opacity-80' : 'text-[10px] uppercase text-slate-400 leading-none mb-1'}`}>{label}</span>
      <div className="flex items-center gap-1 justify-center w-full">
          {icon && <span className={`${isLife ? 'text-2xl' : 'text-sm'}`}>{icon}</span>}
          <span className={`${textClass} font-bold font-mono leading-none`}>{value}{secondaryValue && <span className="text-sm text-slate-500">/{secondaryValue}</span>}</span>
      </div>
    </div>
  );
};

// Badge for ACTIVE abilities (already played/permanent)
const AbilityBadge: React.FC<{ ability: AbilityCard, onClick?: () => void, language: Language, isAi?: boolean }> = ({ ability, onClick, language, isAi }) => {
    // Identify if ability is "Actionable" (requires user interaction) vs Passive
    // VORTEX_CONTROL is PASSIVE (triggered by game rule, not button)
    const isActionable = 
        (ability.effectTag.includes('AFFINITY') || 
        ability.effectTag.includes('CONTROL') || 
        ability.effectTag === 'MAGIC_WALL' || 
        ability.effectTag === 'MIND_CONTROL' ||
        ability.effectTag === 'MAGIC_VISION') && 
        ability.effectTag !== 'VORTEX_CONTROL';

    const trans = getTransAbility(ability.effectTag, language);
    // DEFENSIVE: Fallback to 'en'
    const t = TEXTS[language] || TEXTS['en'];
    if (!t) return null;
    const txt = t.ui;
    
    // Affinity Colors for badge border
    const affinityClass = ability.affinity === 'WHITE' ? 'border-yellow-200' : 
                          ability.affinity === 'BLACK' ? 'border-purple-900' : 'border-slate-500';

    return (
        <div 
            onClick={isActionable && !isAi ? onClick : undefined}
            title={`${trans.name}: ${trans.desc}`}
            className={`
                text-xs px-2 py-1.5 rounded-md flex items-center justify-between gap-2 select-none transition-all border ${affinityClass}
                ${isActionable && !isAi
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-500 text-emerald-100 cursor-pointer hover:brightness-110 active:scale-95 shadow-sm' 
                    : 'bg-slate-800 text-slate-400 cursor-help'}
            `} 
            style={{ maxWidth: '100%' }}
        >
            <div className="flex items-center gap-1 overflow-hidden">
                <span className="font-bold whitespace-nowrap">
                    {ability.icon} {trans.name}
                </span>
            </div>
            {isActionable && !isAi && <span className="text-[9px] uppercase tracking-wider bg-emerald-950/50 px-1 rounded text-emerald-300">{txt.activate}</span>}
            {!isActionable && <span className="text-[9px] bg-slate-700 px-1 rounded">L{ability.level}</span>}
        </div>
    );
};

// Card representation for abilities in HAND
const AbilityCardComponent: React.FC<{ 
    ability: AbilityCard, 
    onClick?: () => void, 
    isSelected?: boolean, 
    disabled?: boolean, 
    language: Language, 
    size?: 'sm' | 'md' 
}> = ({ ability, onClick, isSelected, disabled, language, size = 'md' }) => {
    const trans = getTransAbility(ability.effectTag, language);
    
    const affinityBg = ability.affinity === 'WHITE' ? 'bg-slate-200 text-slate-800' : 
                       ability.affinity === 'BLACK' ? 'bg-slate-950 text-slate-200' : 'bg-slate-700 text-slate-300';
    
    const titleSize = size === 'md' ? 'text-xs' : 'text-[10px] leading-3';
    const iconSize = size === 'md' ? 'text-2xl' : 'text-xl';
    const descSize = size === 'md' ? 'text-[10px]' : 'text-[8px]';
    const lvlSize = size === 'md' ? 'text-[9px]' : 'text-[8px]';

    return (
        <div 
            onClick={!disabled ? onClick : undefined}
            title={`${trans.name}\nLevel: ${ability.level}\nEffect: ${trans.desc}\nAffinity: ${ability.affinity}`}
            className={`
                w-full h-full p-1 sm:p-2 rounded-lg border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-transform group shadow-md
                ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 bg-slate-700' : 'border-indigo-400 bg-slate-800 hover:bg-slate-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}
            `}
        >
            <div className={`${titleSize} font-bold text-indigo-300 leading-tight h-8 overflow-hidden flex items-center justify-center`}>{trans.name}</div>
            <div className={`${iconSize} text-yellow-500 group-hover:scale-110 transition-transform`}>{ability.icon}</div>
            <div className={`${descSize} text-slate-400 leading-none overflow-hidden h-8 flex items-center justify-center px-0.5`}>{size === 'md' ? trans.desc : ''}</div>
            <div className={`${lvlSize} px-2 py-0.5 rounded w-full font-mono ${affinityBg}`}>LV {ability.level}</div>
        </div>
    );
};

const CharacterInfo = ({ character, isAi, onClick }: { character: Character | null, isAi: boolean, onClick: (c: Character) => void }) => {
    if (!character) return null;
    return (
        <div 
            onClick={() => onClick(character)}
            className={`absolute top-0 ${isAi ? 'right-4' : 'right-4'} -translate-y-1/2 flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-600 shadow-md z-10 cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-colors group`}
            title="Click for Character Lore"
        >
            <span className="text-2xl">{character.avatar}</span>
            <span className="font-cinzel font-bold text-sm text-slate-200">{character.name}</span>
            <span className="ml-1 text-slate-500 group-hover:text-purple-400 transition-colors text-xs">ℹ️</span>
        </div>
    );
};

/**
 * GAME BOARD
 * Refactored: Sub-components moved out to prevent unnecessary re-mounts.
 */
const GameBoard: React.FC<GameBoardProps> = ({ 
  ai, 
  player, 
  vortexCards, 
  fsmState,
  pendingAction,
  onCardClick, 
  onAbilityClick,
  onActiveAbilityClick,
  onCharacterClick,
  selectedCardId,
  activeCardId,
  selectedAbilityId,
  validTargetIds,
  language,
  highlightedAbilityId,
  round
}) => {
  // Check Magic Vision: Reveals AI cards if set to true for the turn
  const playerHasVision = player.isHandRevealed;
  // DEFENSIVE: Fallback to 'en'
  const t = TEXTS[language] || TEXTS['en'];
  if (!t) return null;
  const txt = t.ui;
  
  // Dynamic Max Abilities calculation based on Character Affinity
  const charAffinity = player.character?.affinityColor || 'NEUTRAL';
  const maxAbilities = charAffinity === 'NEUTRAL' ? player.level : player.level + 1;
  const aiAffinity = ai.character?.affinityColor || 'NEUTRAL';
  const aiMaxAbilities = aiAffinity === 'NEUTRAL' ? ai.level : ai.level + 1;

  // Responsive logic: Used for font scaling inside cards
  const totalPlayerCards = player.powerHand.length + player.abilityHand.length;
  const playerCardSize = totalPlayerCards > 6 ? 'sm' : 'md';
  
  const totalAiCards = ai.powerHand.length + ai.abilityHand.length;
  const aiCardSize = totalAiCards > 6 ? 'sm' : 'md';

  return (
    <>
      {/* PANEL 1: OPPONENT (AI) */}
      <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-4 relative mt-4">
        <div className="absolute top-0 left-4 -translate-y-1/2 flex gap-2 z-20">
            <div className="bg-slate-900 px-3 py-0.5 rounded text-red-400 font-bold border border-red-900 text-sm">
                {txt.opponent}
            </div>
            <div className="bg-slate-900 px-2 py-0.5 rounded text-orange-400 font-bold border border-orange-900 text-xs flex items-center gap-1">
                <span>{txt.round} {round}</span>
                <span className="text-slate-500">|</span>
                <span className="uppercase text-[10px]">{round === 1 ? txt.levelBeg : round === 2 ? txt.levelInt : txt.levelAdv}</span>
            </div>
        </div>

        <CharacterInfo character={ai.character} isAi={true} onClick={onCharacterClick} />
        
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex gap-2 self-start md:self-center">
             {/* AI Stats Control Panel */}
             <div className="flex flex-col gap-2 w-full md:w-40 lg:w-48 xl:w-56 shrink-0">
                {/* Row 1: Life | Level+Attacks */}
                <div className="flex gap-2 h-28 md:h-32">
                    <StatBadge 
                        label={txt.life} 
                        value={ai.life} 
                        color="border-red-500 text-red-400" 
                        isLife={true} 
                        className="flex-1 h-full border-2"
                    />
                    <div className="flex flex-col gap-2 flex-1 h-full">
                        <StatBadge 
                            label={txt.level} 
                            value={ai.level} 
                            color="border-purple-500 text-purple-400" 
                            className="flex-1 border"
                        />
                        <StatBadge 
                            label={txt.attacks} 
                            value={ai.attacksPerformed} 
                            secondaryValue={(ai.level + 1).toString()}
                            color="border-red-500 text-red-400" 
                            icon="⚔️"
                            className="flex-1 border"
                        />
                    </div>
                </div>
                
                 {/* AI Abilities Limit Badge */}
                 <StatBadge 
                    label={txt.abilities}
                    value={ai.activeAbilities.length}
                    secondaryValue={aiMaxAbilities.toString()}
                    color="border-indigo-500 text-indigo-400"
                    icon="📜"
                    className="w-full border py-2"
                 />

                 {/* AI Active Abilities List */}
                 <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[100px] pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {ai.permanentShield && (
                        <div className="bg-blue-900/50 border border-blue-500 text-blue-300 text-xs px-2 py-1 rounded w-full flex justify-between items-center shadow-sm">
                             <span className="font-bold">🛡️ {txt.shield}</span>
                             <span className="font-mono text-lg">{ai.permanentShield.value}</span>
                        </div>
                    )}
                    {ai.activeAbilities.map(a => (
                        <AbilityBadge 
                            key={a.id} 
                            ability={a} 
                            language={language}
                            isAi={true}
                        />
                    ))}
                 </div>
             </div>
          </div>
          
          {/* AI Hand - Centered & Fluid */}
          <div className="flex flex-1 w-full justify-center items-center gap-1 sm:gap-2 px-2 py-2">
            {ai.powerHand.map((card) => {
              // Reveal AI cards if Magic Vision is on OR if they are involved in the current combat
              const isCardInCombat = card.id === pendingAction?.attackingCard?.id || card.id === pendingAction?.defendingCard?.id;
              // If Magic Vision is active, card is face up but NOT selected unless it is in combat
              const isRevealed = playerHasVision || isCardInCombat;
              const isSelected = isCardInCombat;
              
              return (
                <div key={card.id} className="relative flex-1 max-w-[100px] aspect-[5/7] transition-all">
                    <CardComponent 
                      card={card} 
                      isFaceDown={!isRevealed} 
                      isSelected={isSelected}
                      size={aiCardSize}
                    />
                </div>
              );
            })}
             {ai.abilityHand.length > 0 && (
                <div className={`
                    relative flex-1 max-w-[100px] aspect-[5/7]
                    bg-indigo-900/30 border border-indigo-700 rounded ml-2 flex flex-col items-center justify-center
                `}>
                    <span className="text-xl">📜</span>
                    <span className="text-xs text-indigo-400">{ai.abilityHand.length}</span>
                </div>
             )}
          </div>
        </div>
      </section>

      {/* PANEL 2: THE VORTEX - NO SCROLL */}
      <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-4 relative flex flex-col items-center justify-center overflow-hidden min-h-[220px]">
        {/* Ambient Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-indigo-900/10 pointer-events-none"></div>
        <div className="absolute w-64 h-64 bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>

        <h2 className="text-center font-cinzel text-purple-300 mb-2 text-sm md:text-lg tracking-[0.2em] z-10 uppercase border-b border-purple-900/50 pb-1">
            {txt.vortexLabel || "THE VORTEX"}
        </h2>
        
        {/* Vortex Cards - Centered, Elastic, No Scroll */}
        <div className="flex w-full justify-center items-center gap-2 sm:gap-4 z-10 px-2 sm:px-8">
          {vortexCards.map((card, idx) => {
             // Only reveal if currently involved in Vortex Attack OR Vortex Defense
             const isRevealed = pendingAction.vortexCardIndex === idx || pendingAction.vortexDefenseIndex === idx;
             
             return (
               <div key={`vortex-wrapper-${idx}`} className="relative flex-1 max-w-[110px] aspect-[5/7]">
                 {card ? (
                  <CardComponent 
                    key={`vortex-${idx}`} 
                    card={card}
                    isFaceDown={!isRevealed}
                    onClick={() => onCardClick(card, 'VORTEX', idx)}
                    isSelected={selectedCardId === card.id || isRevealed}
                    disabled={fsmState !== FsmState.MAIN_PHASE && fsmState !== FsmState.AWAITING_PLAYER_DEFENSE} 
                    size="md"
                    variant="vortex"
                  />
                 ) : (
                   <div className="w-full h-full border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center opacity-30 text-xs">
                     {txt.empty}
                   </div>
                 )}
               </div>
             );
          })}
        </div>
      </section>

      {/* PANEL 3: PLAYER */}
      <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-4 relative mt-4">
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 px-3 py-0.5 rounded text-green-400 font-bold border border-green-900 text-sm z-20">
          {txt.player}
        </div>
        <CharacterInfo character={player.character} isAi={false} onClick={onCharacterClick} />

        <div className="flex flex-col md:flex-row gap-4 mt-4">
            
            {/* Player Stats & Active Abilities */}
            <div className="flex flex-col gap-2 w-full md:w-40 lg:w-48 xl:w-56 shrink-0">
                 {/* Row 1: Life | Level+Attacks */}
                 <div className="flex gap-2 h-28 md:h-32">
                    <StatBadge 
                        label={txt.life} 
                        value={player.life} 
                        color="border-green-500 text-green-400" 
                        isLife={true} 
                        className="flex-1 h-full border-2"
                    />
                    <div className="flex flex-col gap-2 flex-1 h-full">
                        <StatBadge 
                            label={txt.level} 
                            value={player.level} 
                            color="border-yellow-500 text-yellow-400" 
                            className="flex-1 border"
                        />
                        <StatBadge 
                            label={txt.attacks} 
                            value={player.attacksPerformed} 
                            secondaryValue={(player.level + 1).toString()}
                            color="border-red-500 text-red-400" 
                            icon="⚔️"
                            className="flex-1 border"
                        />
                    </div>
                 </div>
                 
                 {/* Abilities Limit Badge */}
                 <StatBadge 
                    label={txt.abilities}
                    value={player.activeAbilities.length}
                    secondaryValue={maxAbilities.toString()}
                    color="border-indigo-500 text-indigo-400"
                    icon="📜"
                    className="w-full border py-2"
                 />
                 
                 {/* Active Abilities Grid */}
                 <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {player.activeAbilities.length === 0 && <span className="text-xs text-slate-500 text-center italic mt-2">No active effects</span>}
                    
                    {player.permanentShield && (
                        <div className="bg-blue-900/50 border border-blue-500 text-blue-300 text-xs px-2 py-1.5 rounded w-full flex justify-between items-center shadow-sm">
                             <span className="font-bold">🛡️ {txt.shield}</span>
                             <span className="font-mono text-lg">{player.permanentShield.value}</span>
                        </div>
                    )}

                    {player.activeAbilities.map(a => (
                        <AbilityBadge 
                            key={a.id} 
                            ability={a} 
                            language={language}
                            onClick={() => onActiveAbilityClick(a)}
                        />
                    ))}
                 </div>
            </div>

            {/* Player Hand (Power Cards) - Fluid, Centered, Elastic */}
            <div className="flex-1 w-full overflow-hidden">
                <div className={`flex w-full justify-center items-center gap-1 sm:gap-2 px-2 py-2`}>
                    {/* Render Ability Cards in Hand (Merged) - NOW FIRST (LEFT) */}
                    {player.abilityHand.map((ability) => (
                         <div key={ability.id} className="relative flex-1 max-w-[100px] aspect-[5/7]">
                             <AbilityCardComponent 
                                ability={ability}
                                onClick={() => onAbilityClick(ability)}
                                isSelected={selectedAbilityId === ability.id || highlightedAbilityId === ability.id}
                                disabled={fsmState !== FsmState.MAIN_PHASE || player.level < ability.level}
                                language={language}
                                size={playerCardSize}
                             />
                         </div>
                     ))}

                    {/* Render Power Cards */}
                    {player.powerHand.map((card) => {
                        // Determine if card is interactable based on FSM state
                        let isDisabled = true;
                        if (fsmState === FsmState.MAIN_PHASE) isDisabled = false;
                        if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && card.type === 'DEF') isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_DRAW) isDisabled = false; // Enable for draw
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_HEAL) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_WALL) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MIND) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_VISION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP) isDisabled = false; // Enable for Level Up
                        // NEW: In Attack Selection mode, only ATK cards are enabled
                        if (fsmState === FsmState.SELECT_ATTACK_CARD && card.type === 'ATK') isDisabled = false;
                        
                        // NEW: Generic Discard Mode
                        if (fsmState === FsmState.SELECT_DISCARD_GENERIC) isDisabled = false;

                        const isActionCard = card.id === pendingAction?.attackingCard?.id || card.id === pendingAction?.defendingCard?.id;
                        
                        const isActive = activeCardId === card.id;
                        const isLevelUpSelected = validTargetIds.includes(card.id);

                        return (
                            <div key={card.id} className="relative flex-1 max-w-[100px] aspect-[5/7]">
                                <CardComponent 
                                    card={card}
                                    onClick={() => !isDisabled && onCardClick(card, 'PLAYER')}
                                    isSelected={isActive || isLevelUpSelected || isActionCard}
                                    disabled={isDisabled}
                                    size={playerCardSize}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </section>
    </>
  );
};

export default GameBoard;
