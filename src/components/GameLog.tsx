
import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  logs: string[];
  currentAction?: string; 
}

const GameLog: React.FC<GameLogProps> = ({ logs, currentAction }) => {
  // Use a ref for the container list itself
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Logic: Only scroll the internal container to the bottom.
    // We use .scrollTop = .scrollHeight which is purely internal and NEVER affects the window/page scroll.
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [logs]); // Only auto-scroll on new log entries (results), ignoring currentAction changes

  return (
    <div className="flex flex-col w-full bg-slate-800 rounded-lg border border-slate-700 shadow-inner overflow-hidden h-full">
      <div className="p-2 border-b border-slate-700 bg-slate-900 flex justify-between items-center shrink-0">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Battle Log</h3>
        <span className="text-[10px] text-slate-500">Live Feed</span>
      </div>
      
      {/* 
          Height Calculation: 
          text-sm line-height is approx 1.25rem (20px). 
          8 lines ~ 10rem (160px) -> Tailwind h-40.
          On desktop (lg), height is auto to fill the parent column.
      */}
      <div 
        ref={listRef}
        className="flex-1 h-40 lg:h-auto overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
      >
        {logs.map((log, i) => {
          const isLast = i === logs.length - 1;
          return (
            <div 
              key={i} 
              className={`
                text-xs sm:text-sm font-mono px-2 py-1 rounded transition-colors duration-500 border-l-2
                ${isLast 
                  ? 'border-slate-500 bg-slate-700/30 text-slate-200' 
                  : 'border-transparent text-slate-400'}
              `}
            >
              <span className="mr-2 text-slate-600 text-[10px]">[{i + 1}]</span>
              {log}
            </div>
          );
        })}

        {/* ACTIVE STATUS MESSAGE (Does not trigger scroll on change) */}
        {currentAction && (
            <div className="mt-2 text-sm font-mono px-2 py-1.5 rounded bg-yellow-900/20 border border-yellow-600/50 text-yellow-200 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.1)] flex items-center gap-2">
                <span className="text-yellow-500">➤</span>
                {currentAction}
            </div>
        )}
      </div>
    </div>
  );
};

export default GameLog;
