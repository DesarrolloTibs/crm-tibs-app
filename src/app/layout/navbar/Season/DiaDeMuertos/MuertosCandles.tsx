import React from 'react';

const MuertosCandles: React.FC = () => {
    return (
        <>
            <style>
                {`
                    @keyframes flicker {
                        0%   { transform: scale(1); opacity: 0.9; }
                        25%  { transform: scale(1.1); opacity: 1; }
                        50%  { transform: scale(0.9); opacity: 0.8; }
                        75%  { transform: scale(1.05); opacity: 0.95; }
                        100% { transform: scale(1); opacity: 0.9; }
                    }
                    .flame {
                        animation: flicker 0.15s infinite alternate;
                        border-radius: 50% 50% 20% 20%;
                        box-shadow: 0 0 10px 2px rgba(253, 230, 138, 0.6);
                    }
                `}
            </style>
            <div className="absolute bottom-0 left-0 w-full h-8 pointer-events-none flex justify-around items-end px-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="relative w-3 h-5 bg-orange-100 border border-orange-200 rounded-t-sm flex justify-center shadow-sm">
                        <div 
                            className="flame absolute -top-2 w-[6px] h-[10px] bg-yellow-400"
                            style={{ 
                                animationDelay: `${Math.random() * 0.5}s`
                            }}
                        ></div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default MuertosCandles;
