
import React from 'react';
import type { Card } from '../types';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isSelected?: boolean;
  isFaceDown?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg'; // Kept for font-scaling logic, not dimensions
  variant?: 'standard' | 'vortex';
}

/**
 * CARD COMPONENT
 * Renders a single playing card (Attack or Defense).
 * NOW FLUID: Fits the dimensions of its parent container.
 */
const CardComponent: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  isSelected = false, 
  isFaceDown = false,
  disabled = false,
  size = 'md',
  variant = 'standard'
}) => {
  
  // Font scaling based on size prop (parent can still dictate 'density' of text)
  const fontBase = size === 'sm' ? 'text-xs' : 'text-sm sm:text-lg';
  const iconSize = size === 'sm' ? 'text-xl' : 'text-2xl sm:text-4xl';
  const tagSize = size === 'sm' ? 'text-[8px]' : 'text-[8px] sm:text-[10px]';

  // Render Face Down (Card Back)
  if (isFaceDown) {
    if (variant === 'vortex') {
        // VORTEX BACK DESIGN (Green Swirl)
        return (
            <div 
                className={`
                  relative w-full h-full rounded-lg border-2 border-green-900 bg-black shadow-md shadow-green-900/40
                  ${!disabled && onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
                  flex items-center justify-center overflow-hidden
                `}
                onClick={!disabled ? onClick : undefined}
            >
                {/* Rotating Conic Gradient */}
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,#14532d_90deg,transparent_180deg,#22c55e_270deg,transparent_360deg)] animate-[spin_4s_linear_infinite] opacity-70"></div>
                
                {/* Inner Overlay for Depth */}
                <div className="absolute inset-1 rounded-lg bg-black/80"></div>

                {/* Center Badge */}
                <div className="relative z-10 w-2/3 aspect-square rounded-full border border-green-700/50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-green-500 font-cinzel text-xl sm:text-3xl font-bold tracking-widest opacity-80">🌀</div>
                </div>
            </div>
        );
    }

    // STANDARD BACK DESIGN (Grey)
    return (
      <div 
        className={`
          relative w-full h-full rounded-lg border-2 border-slate-700 bg-slate-800 shadow-md
          ${!disabled && onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}
          flex items-center justify-center
        `}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="w-1/3 aspect-square rounded-full border-2 border-slate-600 bg-slate-700"></div>
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
        relative w-full h-full flex flex-col items-center justify-between p-1 sm:p-2 rounded-lg border-2 select-none
        transition-all duration-200
      `}
    >
      {/* Top Left Value */}
      <div className={`self-start ${fontBase} font-bold leading-none`}>
        {card.value}
        <span className="block text-[0.6em] opacity-70">{Math.floor(card.value/2)}</span>
      </div>

      {/* Center Icon */}
      <div className={`${iconSize} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}>
        {icon}
      </div>

      {/* Bottom Right Value (Inverted) */}
      <div className={`self-end transform rotate-180 ${fontBase} font-bold leading-none`}>
        {card.value}
      </div>
      
      {/* Type Tag (ATK/DEF) */}
      <div className={`
        absolute bottom-[5%] left-1/2 transform -translate-x-1/2 ${tagSize} font-bold tracking-widest px-1 rounded
        ${isBlack ? 'bg-slate-800 text-slate-300' : 'bg-slate-300 text-slate-800'}
      `}>
        {card.type}
      </div>
    </div>
  );
};

export default CardComponent;
