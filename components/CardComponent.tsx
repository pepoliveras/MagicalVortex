
import React from 'react';
import { Card } from '../types';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isSelected?: boolean;
  isFaceDown?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CARD COMPONENT
 * Renders a single playing card (Attack or Defense).
 * Handles:
 * - Face Down state (card back)
 * - Color styling (Black/White)
 * - Selection glow effects
 * - Disabled state
 */
const CardComponent: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  isSelected = false, 
  isFaceDown = false,
  disabled = false,
  size = 'md'
}) => {
  
  // Render Face Down (Card Back)
  if (isFaceDown) {
    return (
      <div 
        className={`
          relative rounded-lg border-2 border-slate-700 bg-slate-800 shadow-md
          ${size === 'md' ? 'w-24 h-36' : 'w-16 h-24'}
          ${!disabled && onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}
          flex items-center justify-center
        `}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="w-8 h-8 rounded-full border-2 border-slate-600 bg-slate-700"></div>
      </div>
    );
  }

  // Determine Styles based on Card Color
  const isBlack = card.color === 'BLACK';
  const bgColor = isBlack ? 'bg-slate-900' : 'bg-slate-100';
  const textColor = isBlack ? 'text-white' : 'text-slate-900';
  
  // GLOW EFFECT: Yellow Box Shadow for selected cards
  const selectionClass = isSelected 
    ? 'border-yellow-400 shadow-[0_0_15px_3px_rgba(250,204,21,0.6)] ring-1 ring-yellow-200 z-10' 
    : 'border-slate-400 shadow-xl';

  const icon = card.type === 'ATK' ? '⚡' : '🛡️';

  // Opacity for disabled interaction
  const opacityClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer card-float';

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        ${bgColor} ${textColor} ${selectionClass} ${opacityClass}
        relative flex flex-col items-center justify-between p-2 rounded-lg border-2 select-none
        ${size === 'md' ? 'w-24 h-36' : 'w-16 h-24'}
        transition-all duration-200
      `}
    >
      {/* Top Left Value */}
      <div className="self-start text-lg font-bold leading-none">
        {card.value}
        <span className="block text-[10px] opacity-70">{Math.floor(card.value/2)}</span>
      </div>

      {/* Center Icon */}
      <div className="text-4xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {icon}
      </div>

      {/* Bottom Right Value (Inverted) */}
      <div className="self-end transform rotate-180 text-lg font-bold leading-none">
        {card.value}
      </div>
      
      {/* Type Tag (ATK/DEF) */}
      <div className={`
        absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-bold tracking-widest px-1 rounded
        ${isBlack ? 'bg-slate-800 text-slate-300' : 'bg-slate-300 text-slate-800'}
      `}>
        {card.type}
      </div>
    </div>
  );
};

export default CardComponent;
