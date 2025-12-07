

import React from 'react';
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
}

// --- SUB-COMPONENTS ---

const StatBadge = ({ label, value, color, secondaryValue }: { label: string, value: number | string, color: string, secondaryValue?: string }) => (
  <div className={`flex flex-col items-center p-2 rounded bg-slate-900 border ${color} min-w-[60px]`}>
    <span className="text-xs uppercase text-slate-400">{label}</span>
    <span className="text-2xl font-bold font-mono">{value}{secondaryValue && <span className="text-lg text-slate-500">/{secondaryValue}</span>}</span>
  </div>
);

// Badge for ACTIVE abilities (already played/permanent)
// Refined to look like a small button if actionable
const AbilityBadge: React.FC<{ ability: AbilityCard, onClick?: () => void, language: Language }> = ({ ability, onClick, language }) => {
    // Identify if ability is "Actionable" (requires user interaction) vs Passive
    const isActionable = 
        ability.effectTag.includes('AFFINITY') || 
        ability.effectTag.includes('CONTROL') || 
        ability.effectTag === 'MAGIC_WALL' || 
        ability.effectTag === 'MIND_CONTROL';

    const trans = getTransAbility(ability.effectTag, language);
    const txt = TEXTS[language].ui;

    return (
        <div 
            onClick={isActionable ? onClick : undefined}
            title={`${trans.name}: ${trans.desc}`}
            className={`
                text-xs px-2 py-1.5 rounded-md flex items-center justify-between gap-2 select-none transition-all border
                ${isActionable 
                    ? 'bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-500 text-emerald-100 cursor-pointer hover:brightness-110 active:scale-95 shadow-sm' 
                    : 'bg-slate-800 border-slate-600 text-slate-400 cursor-help'}
            `} 
            style={{ maxWidth: '100%' }}
        >
            <div className="flex items-center gap-1 overflow-hidden">
                <span className="font-bold whitespace-nowrap">
                    {isActionable ? '⚡' : '•'} {trans.name}
                </span>
            </div>
            {isActionable && <span className="text-[9px] uppercase tracking-wider bg-emerald-950/50 px-1 rounded text-emerald-300">{txt.activate}</span>}
            {!isActionable && <span className="text-[9px] bg-slate-700 px-1 rounded">L{ability.level}</span>}
        </div>
    );
};

// Card representation for abilities in HAND
// UPDATED: Sized to match standard cards (w-24 h-36) for better hand integration
const AbilityCardComponent: React.FC<{ ability: AbilityCard, onClick?: () => void, isSelected?: boolean, disabled?: boolean, language: Language }> = ({ ability, onClick, isSelected, disabled, language }) => {
    const trans = getTransAbility(ability.effectTag, language);
    
    return (
        <div 
            onClick={!disabled ? onClick : undefined}
            title={`${trans.name}\nLevel: ${ability.level}\nEffect: ${trans.desc}`}
            className={`
                w-24 h-36 p-2 rounded-lg border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-transform group shadow-md
                ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 bg-slate-700' : 'border-indigo-400 bg-slate-800 hover:bg-slate-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2'}
            `}
        >
            <div className="text-xs font-bold text-indigo-300 leading-tight h-10 overflow-hidden flex items-center justify-center">{trans.name}</div>
            <div className="text-2xl text-yellow-500 group-hover:scale-110 transition-transform">📜</div>
            <div className="text-[10px] text-slate-400 leading-none overflow-hidden h-12 flex items-center justify-center px-1">{trans.desc}</div>
            <div className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-500 w-full font-mono">LV {ability.level}</div>
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
  highlightedAbilityId
}) => {
  // Check Magic Vision: Reveals AI cards if active
  const playerHasVision = player.activeAbilities.some(a => a.effectTag === 'MAGIC_VISION');
  const txt = TEXTS[language].ui;

  return (
    <div className="flex flex-col h-full gap-2 relative">
      
      {/* --- AI AREA (Top) --- */}
      <div className="flex-none p-3 bg-slate-800/50 rounded-xl border border-slate-700 relative mt-8">
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 px-3 py-0.5 rounded text-red-400 font-bold border border-red-900 text-sm">
          {txt.opponent}
        </div>
        <CharacterInfo character={ai.character} isAi={true} onClick={onCharacterClick} />
        
        <div className="flex justify-between items-start mt-2">
          <div className="flex gap-2">
            <StatBadge label={txt.life} value={ai.life} color="border-red-500 text-red-400" />
            <StatBadge label={txt.level} value={ai.level} color="border-purple-500 text-purple-400" />
            
            {/* AI Active Abilities & Shield */}
            <div className="flex flex-col gap-1 w-32">
                {/* Simplified list for AI to save space */}
                {ai.activeAbilities.map(a => (
                    <div key={a.id} className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 truncate" title={getTransAbility(a.effectTag, language).name}>
                        {getTransAbility(a.effectTag, language).name}
                    </div>
                ))}
                {ai.permanentShield && (
                    <div className="bg-blue-900/50 border border-blue-500 text-blue-300 text-xs px-2 py-1 rounded text-center">
                        🛡️ {ai.permanentShield.value}
                    </div>
                )}
            </div>
          </div>
          
          {/* AI Hand - Added mr-48 to push away from Character Box */}
          <div className="flex gap-1 items-start mr-48">
            {ai.powerHand.map((card) => {
              // Reveal AI cards if Magic Vision is on OR if they are involved in the current combat
              const isRevealed = playerHasVision || card.id === pendingAction?.attackingCard?.id || card.id === pendingAction?.defendingCard?.id;
              
              return (
                <CardComponent 
                  key={card.id} 
                  card={card} 
                  isFaceDown={!isRevealed} 
                  isSelected={isRevealed}
                  size="sm"
                />
              );
            })}
             {ai.abilityHand.length > 0 && (
                <div className="w-12 h-20 bg-indigo-900/30 border border-indigo-700 rounded ml-2 flex flex-col items-center justify-center">
                    <span className="text-xl">📜</span>
                    <span className="text-xs text-indigo-400">{ai.abilityHand.length}</span>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* --- VORTEX AREA (Center) --- */}
      <div className="flex-1 flex flex-col justify-center items-center py-2 relative min-h-[140px]">
        {/* Ambient Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-indigo-900/20 rounded-xl pointer-events-none"></div>
        <div className="absolute w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>

        <h2 className="text-center font-cinzel text-purple-300 mb-2 text-lg tracking-[0.2em] z-10">THE VORTEX</h2>
        
        <div className="flex gap-4 z-10">
          {vortexCards.map((card, idx) => {
             // Only reveal if currently involved in Vortex Attack/Defense
             const isRevealed = pendingAction.vortexCardIndex === idx;
             return card ? (
              <CardComponent 
                key={`vortex-${idx}`} 
                card={card}
                isFaceDown={!isRevealed}
                onClick={() => onCardClick(card, 'VORTEX', idx)}
                isSelected={selectedCardId === card.id || isRevealed}
                disabled={fsmState !== FsmState.MAIN_PHASE && fsmState !== FsmState.AWAITING_PLAYER_DEFENSE} // Fix for Vortex Defense
                size="md"
                variant="vortex" // Apply Green Swirl Design
              />
             ) : (
               <div key={`vortex-empty-${idx}`} className="w-24 h-36 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center opacity-30">
                 {txt.empty}
               </div>
             )
          })}
        </div>
      </div>

      {/* --- PLAYER AREA (Bottom) --- */}
      <div className="flex-none p-4 bg-slate-800/80 rounded-xl border border-slate-600 relative mt-4">
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 px-3 py-0.5 rounded text-green-400 font-bold border border-green-900 text-sm">
          {txt.player}
        </div>
        <CharacterInfo character={player.character} isAi={false} onClick={onCharacterClick} />

        <div className="flex gap-4 mt-2">
            
            {/* Player Stats & Active Abilities - Organized to act as a control panel */}
            <div className="flex flex-col gap-2 w-32 md:w-48 lg:w-32 min-w-[160px]">
                 <div className="flex gap-2">
                    <StatBadge label={txt.life} value={player.life} color="border-green-500 text-green-400" />
                    <StatBadge label={txt.level} value={player.level} color="border-yellow-500 text-yellow-400" />
                    <StatBadge 
                        label={txt.attacks} 
                        value={player.attacksPerformed} 
                        secondaryValue={(player.level + 1).toString()}
                        color="border-red-500 text-red-400" 
                    />
                 </div>
                 
                 {/* Abilities Limit Badge */}
                 <div className="flex justify-center">
                    <StatBadge 
                        label={txt.abilities}
                        value={player.activeAbilities.length}
                        secondaryValue={(player.level + 1).toString()}
                        color="border-indigo-500 text-indigo-400 w-full"
                    />
                 </div>
                 
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

            {/* Player Hand (Power Cards) */}
            <div className="flex-1 flex flex-col gap-3">
                <div className="flex gap-2 justify-center items-end h-36">
                    {/* Render Ability Cards in Hand (Merged) - NOW FIRST (LEFT) */}
                    {player.abilityHand.map((ability) => (
                         <AbilityCardComponent 
                            key={ability.id}
                            ability={ability}
                            onClick={() => onAbilityClick(ability)}
                            isSelected={selectedAbilityId === ability.id || highlightedAbilityId === ability.id}
                            disabled={fsmState !== FsmState.MAIN_PHASE || player.level < ability.level}
                            language={language}
                         />
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
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_CARDS_FOR_LEVEL_UP) isDisabled = false; // Enable for Level Up
                        // NEW: In Attack Selection mode, only ATK cards are enabled
                        if (fsmState === FsmState.SELECT_ATTACK_CARD && card.type === 'ATK') isDisabled = false;
                        
                        // NEW: Generic Discard Mode
                        if (fsmState === FsmState.SELECT_DISCARD_GENERIC) isDisabled = false;

                        const isActionCard = card.id === pendingAction?.attackingCard?.id || card.id === pendingAction?.defendingCard?.id;
                        
                        // Selection Logic Update:
                        // 1. Is it the single Active Card?
                        // 2. Is it in the Level Up selection array?
                        // 3. Is it an action card?
                        const isActive = activeCardId === card.id;
                        const isLevelUpSelected = validTargetIds.includes(card.id);

                        return (
                            <CardComponent 
                                key={card.id} 
                                card={card}
                                onClick={() => !isDisabled && onCardClick(card, 'PLAYER')}
                                isSelected={isActive || isLevelUpSelected || isActionCard}
                                disabled={isDisabled}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default GameBoard;