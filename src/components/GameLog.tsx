

import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  logs: string[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700 shadow-inner overflow-hidden">
      <div className="p-2 border-b border-slate-700 bg-slate-900">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Battle Log</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {logs.map((log, i) => {
          const isLast = i === logs.length - 1;
          return (
            <div 
              key={i} 
              className={`
                text-sm font-mono px-2 py-1 rounded transition-colors duration-500
                ${isLast 
                  ? 'bg-yellow-900/30 border border-yellow-500/50 text-yellow-100 shadow-sm animate-pulse' 
                  : 'text-slate-300 border-b border-slate-700/50 last:border-0'}
              `}
            >
              <span className={`mr-2 ${isLast ? 'text-yellow-400' : 'text-slate-500'}`}>[{i + 1}]</span>
              {log}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default GameLog;