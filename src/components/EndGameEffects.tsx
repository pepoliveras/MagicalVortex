

import React, { useEffect, useState } from 'react';

interface EndGameEffectsProps {
  outcome: 'VICTORY' | 'DEFEAT' | null;
}

const EndGameEffects: React.FC<EndGameEffectsProps> = ({ outcome }) => {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string; duration: string; color?: string }>>([]);

  useEffect(() => {
    if (!outcome) {
      setParticles([]);
      return;
    }

    const count = outcome === 'VICTORY' ? 100 : 60;
    const newParticles = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100 + '%',
        delay: Math.random() * 2 + 's', // Random start time
        duration: (Math.random() * 2 + 2) + 's', // Random speed
        color: outcome === 'VICTORY' 
          ? `hsl(${Math.random() * 360}, 100%, 50%)` // Rainbow for victory
          : `rgba(${150 + Math.random() * 105}, 0, 0, ${0.6 + Math.random() * 0.4})` // Dark red for blood
      });
    }

    setParticles(newParticles);
  }, [outcome]);

  if (!outcome) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>
        {`
          @keyframes fall-confetti {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          @keyframes fall-blood {
            0% { transform: translateY(-10vh) scale(1); opacity: 0.8; }
            50% { transform: translateY(60vh) scale(1.1); opacity: 1; }
            100% { transform: translateY(110vh) scale(1, 1.5); opacity: 0; }
          }
        `}
      </style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: outcome === 'VICTORY' ? '10px' : '4px',
            height: outcome === 'VICTORY' ? '10px' : '12px',
            backgroundColor: p.color,
            borderRadius: outcome === 'VICTORY' ? '0' : '50% 50% 50% 50% / 60% 60% 40% 40%', // Tear shape for blood
            animation: `${outcome === 'VICTORY' ? 'fall-confetti' : 'fall-blood'} ${p.duration} linear ${p.delay} infinite`
          }}
        />
      ))}
    </div>
  );
};

export default EndGameEffects;