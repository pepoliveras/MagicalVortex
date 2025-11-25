
import React from 'react';
import { Player, Card, AbilityCard, FsmState, PendingAction, Character } from '../types';
import CardComponent from './CardComponent';

interface GameBoardProps {
  ai: Player;
  player: Player;
  vortexCards: (Card | null)[];
  fsmState: FsmState;
  pendingAction: PendingAction;
  onCardClick: (card: Card, owner: 'PLAYER' | 'AI' | 'VORTEX', index?: number) => void;
  onAbilityClick: (ability: AbilityCard) => void;
  onActiveAbilityClick: (ability: AbilityCard) => void;
  selectedCardId: string | null;
  selectedAbilityId: string | null;
  validTargetIds: string[]; // IDs of cards that are valid targets (e.g., for Level Up)
}

// --- SUB-COMPONENTS ---

const StatBadge = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className={`flex flex-col items-center p-2 rounded bg-slate-900 border ${color} min-w-[60px]`}>
    <span className="text-xs uppercase text-slate-400">{label}</span>
    <span className="text-2xl font-bold font-mono">{value}</span>
  </div>
);

// Badge for ACTIVE abilities (already played/permanent)
// Refined to look like a small button if actionable
const AbilityBadge: React.FC<{ ability: AbilityCard, onClick?: () => void }> = ({ ability, onClick }) => {
    // Identify if ability is "Actionable" (requires user interaction) vs Passive
    const isActionable = 
        ability.effectTag.includes('AFFINITY') || 
        ability.effectTag.includes('CONTROL') || 
        ability.effectTag === 'MAGIC_WALL' ||
        ability.effectTag === 'MIND_CONTROL';

    return (
        <div 
            onClick={isActionable ? onClick : undefined}
            title={`${ability.name}: ${ability.description}`}
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
                    {isActionable ? '⚡' : '•'} {ability.name}
                </span>
            </div>
            {isActionable && <span className="text-[9px] uppercase tracking-wider bg-emerald-950/50 px-1 rounded text-emerald-300">ACTIVATE</span>}
            {!isActionable && <span className="text-[9px] bg-slate-700 px-1 rounded">L{ability.level}</span>}
        </div>
    );
};

// Card representation for abilities in HAND
const AbilityCardComponent: React.FC<{ ability: AbilityCard, onClick?: () => void, isSelected?: boolean, disabled?: boolean }> = ({ ability, onClick, isSelected, disabled }) => (
    <div 
        onClick={!disabled ? onClick : undefined}
        title={`${ability.name}\nLevel: ${ability.level}\nEffect: ${ability.description}`}
        className={`
            w-20 h-28 p-1 rounded border-2 flex flex-col items-center justify-between text-center cursor-pointer transition-transform group
            ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 bg-slate-700' : 'border-indigo-400 bg-slate-800 hover:bg-slate-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
        `}
    >
        <div className="text-[10px] font-bold text-indigo-300 leading-tight h-8 overflow-hidden flex items-center justify-center">{ability.name}</div>
        <div className="text-xl text-yellow-500 group-hover:scale-110 transition-transform">📜</div>
        <div className="text-[8px] text-slate-400 leading-none overflow-hidden h-10 flex items-center justify-center">{ability.description}</div>
        <div className="text-[9px] bg-slate-900 px-1 rounded text-slate-500 w-full">LV {ability.level}</div>
    </div>
);

const CharacterInfo = ({ character, isAi }: { character: Character | null, isAi: boolean }) => {
    if (!character) return null;
    return (
        <div className={`absolute top-0 ${isAi ? 'right-4' : 'right-4'} -translate-y-1/2 flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-600 shadow-md z-10`}>
            <span className="text-2xl">{character.avatar}</span>
            <span className="font-cinzel font-bold text-sm text-slate-200">{character.name}</span>
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
  selectedCardId,
  selectedAbilityId,
  validTargetIds
}) => {
  // Check Magic Vision: Reveals AI cards if active
  const playerHasVision = player.activeAbilities.some(a => a.effectTag === 'MAGIC_VISION');

  return (
    <div className="flex flex-col h-full gap-2 relative">
      
      {/* --- AI AREA (Top) --- */}
      <div className="flex-none p-3 bg-slate-800/50 rounded-xl border border-slate-700 relative mt-4">
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 px-3 py-0.5 rounded text-red-400 font-bold border border-red-900 text-sm">
          OPPONENT (AI)
        </div>
        <CharacterInfo character={ai.character} isAi={true} />
        
        <div className="flex justify-between items-start mt-2">
          <div className="flex gap-2">
            <StatBadge label="Life" value={ai.life} color="border-red-500 text-red-400" />
            <StatBadge label="Level" value={ai.level} color="border-purple-500 text-purple-400" />
            
            {/* AI Active Abilities & Shield */}
            <div className="flex flex-col gap-1 w-32">
                {/* Simplified list for AI to save space */}
                {ai.activeAbilities.map(a => (
                    <div key={a.id} className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 truncate" title={a.name}>
                        {a.name}
                    </div>
                ))}
                {ai.permanentShield && (
                    <div className="bg-blue-900/50 border border-blue-500 text-blue-300 text-xs px-2 py-1 rounded text-center">
                        🛡️ {ai.permanentShield.value}
                    </div>
                )}
            </div>
          </div>
          
          {/* AI Hand */}
          <div className="flex gap-1 items-start">
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
              />
             ) : (
               <div key={`vortex-empty-${idx}`} className="w-24 h-36 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center opacity-30">
                 Empty
               </div>
             )
          })}
        </div>
      </div>

      {/* --- PLAYER AREA (Bottom) --- */}
      <div className="flex-none p-4 bg-slate-800/80 rounded-xl border border-slate-600 relative mt-4">
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-slate-900 px-3 py-0.5 rounded text-green-400 font-bold border border-green-900 text-sm">
          PLAYER (YOU)
        </div>
        <CharacterInfo character={player.character} isAi={false} />

        <div className="flex gap-4 mt-2">
            
            {/* Player Stats & Active Abilities - Organized to act as a control panel */}
            <div className="flex flex-col gap-2 w-1/4 min-w-[160px]">
                 <div className="flex gap-2">
                    <StatBadge label="Life" value={player.life} color="border-green-500 text-green-400" />
                    <StatBadge label="Level" value={player.level} color="border-yellow-500 text-yellow-400" />
                 </div>
                 
                 {/* Active Abilities Grid */}
                 <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[140px] pr-1">
                    {player.activeAbilities.length === 0 && <span className="text-xs text-slate-500 text-center italic mt-2">No active effects</span>}
                    
                    {player.permanentShield && (
                        <div className="bg-blue-900/50 border border-blue-500 text-blue-300 text-xs px-2 py-1.5 rounded w-full flex justify-between items-center shadow-sm">
                             <span className="font-bold">🛡️ SHIELD</span>
                             <span className="font-mono text-lg">{player.permanentShield.value}</span>
                        </div>
                    )}

                    {player.activeAbilities.map(a => (
                        <AbilityBadge 
                            key={a.id} 
                            ability={a} 
                            onClick={() => onActiveAbilityClick(a)}
                        />
                    ))}
                 </div>
            </div>

            {/* Player Hand (Power Cards) */}
            <div className="flex-1 flex flex-col gap-3">
                <div className="flex gap-2 justify-center items-end h-36">
                    {player.powerHand.map((card) => {
                        // Determine if card is interactable based on FSM state
                        let isDisabled = true;
                        if (fsmState === FsmState.MAIN_PHASE) isDisabled = false;
                        if (fsmState === FsmState.AWAITING_PLAYER_DEFENSE && card.type === 'DEF') isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_ABILITY) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_HEAL) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_WALL) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MIND) isDisabled = false;
                        if (fsmState === FsmState.SELECT_DISCARD_FOR_MODIFICATION) isDisabled = false;
                        if (fsmState === FsmState.SELECT_TARGET_FOR_MODIFICATION) isDisabled = false;

                        const isActionCard = card.id === pendingAction?.attackingCard?.id || card.id === pendingAction?.defendingCard?.id;

                        return (
                            <CardComponent 
                                key={card.id} 
                                card={card}
                                onClick={() => !isDisabled && onCardClick(card, 'PLAYER')}
                                isSelected={selectedCardId === card.id || validTargetIds.includes(card.id) || isActionCard}
                                disabled={isDisabled}
                            />
                        );
                    })}
                </div>

                {/* Player Ability Hand */}
                {player.abilityHand.length > 0 && (
                    <div className="flex gap-2 justify-center border-t border-slate-700 pt-2 relative">
                         <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold uppercase tracking-widest -rotate-90 hidden sm:block">Abilities</div>
                         {player.abilityHand.map((ability) => (
                             <AbilityCardComponent 
                                key={ability.id}
                                ability={ability}
                                onClick={() => onAbilityClick(ability)}
                                isSelected={selectedAbilityId === ability.id}
                                disabled={fsmState !== FsmState.MAIN_PHASE || player.level < ability.level}
                             />
                         ))}
                    </div>
                )}
            </div>
        </div>
      </div>

    </div>
  );
};

export default GameBoard;
