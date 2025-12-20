
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
  onCharacterClick: (character: Character) => void; 
  selectedCardId: string | null; 
  activeCardId: string | null; 
  selectedAbilityId: string | null;
  validTargetIds: string[]; 
  language: Language;
  highlightedAbilityId?: string | null; 
  round: number; 
}

// --- SUB-COMPONENTS ---

// 1. STAT BOX (Generic Container for a single stat)
const StatBox = ({ 
    label, 
    value, 
    subValue, 
    icon, 
    colorClass, 
    bgClass = "bg-slate-900", 
    size = "sm",
    isLife = false
}: { 
    label: string, 
    value: string | number, 
    subValue?: string, 
    icon?: string, 
    colorClass: string,
    bgClass?: string,
    size?: "sm" | "md" | "lg",
    isLife?: boolean
}) => {
    // Flash effect for value changes
    const [isFlashing, setIsFlashing] = useState(false);
    const prevValue = useRef<number | string>(value);

    useEffect(() => {
        if (typeof value === 'number' && typeof prevValue.current === 'number') {
            if (value < prevValue.current) {
                setIsFlashing(true);
                const timer = setTimeout(() => setIsFlashing(false), 500);
                return () => clearTimeout(timer);
            }
        }
        prevValue.current = value;
    }, [value]);

    const flashClass = isFlashing ? "ring-2 ring-red-500 bg-red-900/50 scale-105" : "";
    const heightClass = isLife ? "h-24 sm:h-28" : "h-12 sm:h-14";
    const textClass = isLife ? "text-5xl font-bold tracking-tighter" : "text-xl font-bold";

    return (
        <div className={`
            ${bgClass} ${heightClass} rounded-lg border ${colorClass} ${flashClass}
            flex flex-col items-center justify-center relative transition-all duration-300 overflow-hidden px-1
        `}>
            <span className="text-[9px] uppercase text-slate-400 font-bold absolute top-1 left-0 right-0 text-center">{label}</span>
            <div className="flex items-center justify-center gap-1 mt-3 w-full">
                {icon && <span className="text-lg">{icon}</span>}
                <span className={`${textClass} leading-none`}>{value}</span>
                {subValue && <span className="text-xs text-slate-500 self-end mb-1">/{subValue}</span>}
            </div>
        </div>
    );
};

// 2. ABILITY BADGE (Pill shape for active abilities)
const AbilityBadge: React.FC<{ ability: AbilityCard, onClick?: () => void, language: Language, isAi?: boolean }> = ({ ability, onClick, language, isAi }) => {
    const isActionable = 
        (ability.effectTag.includes('AFFINITY') || 
        ability.effectTag.includes('CONTROL') || 
        ability.effectTag === 'MAGIC_WALL' || 
        ability.effectTag === 'MIND_CONTROL' ||
        ability.effectTag === 'MAGIC_VISION') && 
        ability.effectTag !== 'VORTEX_CONTROL';

    const trans = getTransAbility(ability.effectTag, language);
    const t = TEXTS[language] || TEXTS['en'];
    const txt = t.ui;
    
    const affinityClass = ability.affinity === 'WHITE' ? 'border-yellow-200' : 
                          ability.affinity === 'BLACK' ? 'border-purple-900' : 'border-slate-500';

    return (
        <div 
            onClick={isActionable && !isAi ? onClick : undefined}
            title={`${trans.name}: ${trans.desc}`}
            className={`
                text-xs px-2 py-1.5 rounded flex items-center justify-between gap-2 select-none transition-all border ${affinityClass} w-full
                ${isActionable && !isAi
                    ? 'bg-gradient-to-r from-emerald-900/80 to-emerald-800/80 border-emerald-500 text-emerald-100 cursor-pointer hover:brightness-110 active:scale-95 shadow-sm' 
                    : 'bg-slate-800 text-slate-400 cursor-help'}
            `} 
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-sm">{ability.icon}</span>
                <span className="font-bold whitespace-nowrap truncate">{trans.name}</span>
            </div>
            {isActionable && !isAi && <span className="text-[8px] uppercase tracking-wider bg-emerald-950/50 px-1 rounded text-emerald-300 hidden sm:block">{txt.activate}</span>}
            {!isActionable && <span className="text-[8px] bg-slate-700/50 px-1 rounded text-slate-500">L{ability.level}</span>}
        </div>
    );
};

// 3. STATS PANEL (The Grid Layout)
const StatsPanel: React.FC<{ 
    player: Player, 
    isAi: boolean, 
    maxAbilities: number, 
    txt: any, 
    language: Language,
    onActiveAbilityClick: (a: AbilityCard) => void
}> = ({ player, isAi, maxAbilities, txt, language, onActiveAbilityClick }) => {
    
    // --- CALCULATE MODIFIERS (Variables) ---
    // These are derived from active abilities
    const modWhiteAtk = player.activeAbilities.some(a => a.effectTag === 'PALADIN_OF_LIGHT') ? `+${player.level}` : '+0';
    const modWhiteDef = player.activeAbilities.some(a => a.effectTag === 'LIGHT_DEFENSE') ? `+${player.level}` : '+0';
    const modBlackAtk = player.activeAbilities.some(a => a.effectTag === 'DARK_LORD') ? `+${player.level}` : '+0';
    const modBlackDef = player.activeAbilities.some(a => a.effectTag === 'DARK_DEFENSE') ? `+${player.level}` : '+0';

    // Localized label for Cards since it's not in the main translation object yet
    const cardLabel = language === 'ca' ? 'MÀX CARTES' : language === 'es' ? 'MÁX CARTAS' : 'MAX CARDS';

    return (
        <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            <div className="flex gap-2 w-full">
                {/* LEFT COLUMN: LIFE & CARDS */}
                <div className="flex flex-col gap-2 w-1/3 sm:w-28 shrink-0">
                    {/* BIG LIFE BOX */}
                    <StatBox 
                        label={txt.life} 
                        value={player.life} 
                        colorClass={isAi ? "border-red-500 text-red-400" : "border-green-500 text-green-400"} 
                        isLife={true}
                    />
                    {/* MAX CARDS BOX */}
                    <StatBox 
                        label={cardLabel} 
                        value={player.maxHandSize}
                        icon="🃏"
                        colorClass="border-slate-500 text-slate-300"
                    />
                </div>

                {/* RIGHT COLUMN: LEVEL & MODIFIERS (GRID) */}
                <div className="flex-1 grid grid-cols-2 gap-1.5 h-full">
                    {/* Row 1: LEVEL (Full Width) */}
                    <div className="col-span-2">
                        <StatBox label={txt.level} value={player.level} colorClass="border-purple-500 text-purple-400" />
                    </div>

                    {/* Row 2: WHITE MODIFIERS (Yellow Theme - No BG, Glow on active) */}
                    <StatBox 
                        label="DEF" 
                        value={modWhiteDef} 
                        icon="🛡️"
                        bgClass="bg-slate-900"
                        colorClass={modWhiteDef !== '+0' ? "border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-yellow-900/20 text-yellow-800/30"}
                    />
                    <StatBox 
                        label="ATK" 
                        value={modWhiteAtk} 
                        icon="⚡"
                        bgClass="bg-slate-900"
                        colorClass={modWhiteAtk !== '+0' ? "border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "border-yellow-900/20 text-yellow-800/30"}
                    />

                    {/* Row 3: BLACK MODIFIERS (Purple Theme - No BG, Glow on active) */}
                    <StatBox 
                        label="DEF" 
                        value={modBlackDef} 
                        icon="🛡️"
                        bgClass="bg-slate-900"
                        colorClass={modBlackDef !== '+0' ? "border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.3)]" : "border-purple-900/20 text-purple-800/30"}
                    />
                    <StatBox 
                        label="ATK" 
                        value={modBlackAtk} 
                        icon="⚡"
                        bgClass="bg-slate-900"
                        colorClass={modBlackAtk !== '+0' ? "border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.3)]" : "border-purple-900/20 text-purple-800/30"}
                    />
                </div>
            </div>

            {/* BOTTOM ROW: Abilities & Attacks (Equal Width) */}
            <div className="flex gap-1.5">
                <div className="flex-1">
                    <StatBox 
                        label={txt.abilities}
                        value={player.activeAbilities.length}
                        subValue={maxAbilities.toString()}
                        icon="📜"
                        colorClass="border-indigo-500 text-indigo-400"
                        bgClass="bg-slate-900"
                    />
                </div>
                <div className="flex-1">
                    <StatBox 
                        label={txt.attacks} 
                        value={player.attacksPerformed} 
                        subValue={(player.level + 1).toString()} 
                        icon="⚔️"
                        colorClass="border-red-500 text-red-300"
                        bgClass="bg-slate-900"
                    />
                </div>
            </div>

            {/* ACTIVE ABILITIES LIST (Stacked) */}
            <div className="flex flex-col gap-1 mt-1 w-full">
                {player.permanentShield && (
                    <div className="bg-blue-900/30 border border-blue-500/50 text-blue-200 text-[10px] px-2 py-1 rounded flex justify-between items-center">
                            <span className="font-bold">🛡️ {txt.shield}</span>
                            <span className="font-mono text-lg">{player.permanentShield.value}</span>
                    </div>
                )}
                {player.activeAbilities.length === 0 && <div className="text-[10px] text-slate-600 text-center italic py-1">...</div>}
                {player.activeAbilities.map(a => (
                    <AbilityBadge 
                        key={a.id} 
                        ability={a} 
                        language={language}
                        isAi={isAi}
                        onClick={() => onActiveAbilityClick(a)}
                    />
                ))}
            </div>
        </div>
    );
}

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
 * Refactored: Uses StatsPanel for unified layout.
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
  
  // Dynamic Max Abilities calculation
  const charAffinity = player.character?.affinityColor || 'NEUTRAL';
  const maxAbilities = charAffinity === 'NEUTRAL' ? player.level : player.level + 1;
  
  const aiAffinity = ai.character?.affinityColor || 'NEUTRAL';
  const aiMaxAbilities = aiAffinity === 'NEUTRAL' ? ai.level : ai.level + 1;

  // Responsive logic
  const totalPlayerCards = player.powerHand.length + player.abilityHand.length;
  const playerCardSize = totalPlayerCards > 6 ? 'sm' : 'md';
  
  const totalAiCards = ai.powerHand.length + ai.abilityHand.length;
  const aiCardSize = totalAiCards > 6 ? 'sm' : 'md';

  return (
    <>
      {/* ROUND INDICATOR - Independent from panels */}
      <div className="flex justify-center w-full">
          <div className="bg-slate-950 px-6 py-1.5 rounded-full border border-orange-700/50 shadow-[0_0_10px_rgba(234,88,12,0.2)] flex items-center gap-3">
                <span className="text-orange-400 font-bold font-cinzel text-sm">{txt.round} {round}</span>
                <span className="text-slate-600 text-xs">|</span>
                <span className="text-orange-300 text-xs uppercase tracking-widest font-bold">{round === 1 ? txt.levelBeg : round === 2 ? txt.levelInt : txt.levelAdv}</span>
          </div>
      </div>

      {/* PANEL 1: OPPONENT (AI) */}
      <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-4 relative mt-4">
        <div className="absolute top-0 left-4 -translate-y-1/2 flex gap-2 z-20">
            <div className="bg-slate-900 px-3 py-0.5 rounded text-red-400 font-bold border border-red-900 text-sm">
                {txt.opponent}
            </div>
        </div>

        <CharacterInfo character={ai.character} isAi={true} onClick={onCharacterClick} />
        
        {/* LAYOUT: Flex Column on Mobile, Row on Desktop */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
             {/* AI STATS PANEL */}
             <StatsPanel 
                player={ai} 
                isAi={true} 
                maxAbilities={aiMaxAbilities} 
                txt={txt} 
                language={language}
                onActiveAbilityClick={() => {}} // AI abilities aren't clickable
             />
          
          {/* AI Hand */}
          <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">
            <div className="flex flex-1 w-full justify-center items-center gap-1 sm:gap-2 px-2 py-2">
                {ai.powerHand.map((card) => {
                const isCardInCombat = card.id === pendingAction?.attackingCard?.id || card.id === pendingAction?.defendingCard?.id;
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
        </div>
      </section>

      {/* PANEL 2: THE VORTEX */}
      <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-4 relative flex flex-col items-center justify-center overflow-hidden min-h-[220px]">
        {/* Ambient Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-indigo-900/10 pointer-events-none"></div>
        <div className="absolute w-64 h-64 bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>

        <h2 className="text-center font-cinzel text-purple-300 mb-2 text-sm md:text-lg tracking-[0.2em] z-10 uppercase border-b border-purple-900/50 pb-1">
            {txt.vortexLabel || "THE VORTEX"}
        </h2>
        
        {/* Vortex Cards */}
        <div className="flex w-full justify-center items-center gap-2 sm:gap-4 z-10 px-2 sm:px-8">
          {vortexCards.map((card, idx) => {
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
            
            {/* PLAYER STATS PANEL */}
            <StatsPanel 
                player={player} 
                isAi={false} 
                maxAbilities={maxAbilities} 
                txt={txt} 
                language={language}
                onActiveAbilityClick={onActiveAbilityClick}
             />

            {/* Player Hand */}
            <div className="flex-1 w-full overflow-hidden flex flex-col justify-center">
                <div className={`flex w-full justify-center items-center gap-1 sm:gap-2 px-2 py-2`}>
                    {/* Render Ability Cards in Hand */}
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
                        let isDisabled = true;
                        if (fsmState === FsmState.MAIN_PHASE) isDisabled = false;
                        if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && card.type === 'DEF') isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_DRAW) isDisabled = false; 
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_HEAL) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_WALL) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MIND) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_VISION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP) isDisabled = false; 
                        if (fsmState === FsmState.SELECT_ATTACK_CARD && card.type === 'ATK') isDisabled = false;
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
