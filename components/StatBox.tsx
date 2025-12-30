
import React, { useState, useEffect, useRef } from 'react';

interface StatBoxProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: string;
    colorClass: string;
    bgClass?: string;
    size?: "sm" | "md" | "lg";
    isLife?: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({ 
    label, 
    value, 
    subValue, 
    icon, 
    colorClass, 
    bgClass = "bg-slate-900", 
    isLife = false
}) => {
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

export default StatBox;
