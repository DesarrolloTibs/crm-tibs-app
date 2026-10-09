import React from 'react';

const IndependenceDay: React.FC = () => {
    return (
        <>
            <style>
                {`
                    @keyframes fall {
                        0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
                    }
                    .confetti {
                        position: absolute;
                        width: 8px;
                        height: 8px;
                        animation: fall linear infinite;
                    }
                `}
            </style>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => {
                    const colors = ['#006847', '#ffffff', '#ce1126']; // Verde, Blanco, Rojo
                    const color = colors[i % 3];
                    const left = `${Math.random() * 100}%`;
                    const animationDuration = `${Math.random() * 2 + 2}s`;
                    const animationDelay = `${Math.random() * 5}s`;
                    return (
                        <div 
                            key={i} 
                            className="confetti shadow-sm" 
                            style={{ 
                                backgroundColor: color, 
                                left, 
                                top: '-10px',
                                animationDuration, 
                                animationDelay 
                            }} 
                        />
                    );
                })}
            </div>
        </>
    );
};

export default IndependenceDay;
