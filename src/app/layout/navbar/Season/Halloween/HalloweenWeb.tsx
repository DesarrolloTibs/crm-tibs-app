import React from 'react';

const spiders = [
    { right: '10%', hRest: 'h-[8px]', hDrop: 'group-hover:h-[80px]', size: 'scale-100', delay: '0.6s' },
    { right: '28%', hRest: 'h-[10px]', hDrop: 'group-hover:h-[90px]', size: 'scale-90', delay: '0.7s' },
    { right: '48%', hRest: 'h-[4px]', hDrop: 'group-hover:h-[50px]', size: 'scale-75', delay: '0.4s' },
    { right: '68%', hRest: 'h-[6px]', hDrop: 'group-hover:h-[60px]', size: 'scale-105', delay: '0.5s' },
    { right: '85%', hRest: 'h-[12px]', hDrop: 'group-hover:h-[75px]', size: 'scale-110', delay: '0.8s' },
];

const HalloweenWeb: React.FC = () => {
    return (
        <>
            <style>
                {`
                    .spider-thread {
                        position: absolute;
                        top: 0;
                        width: 1px;
                        background: #718096; /* gray-500 */
                    }
                    .spider-body {
                        position: absolute;
                        bottom: -4px;
                        left: -3.5px;
                        width: 8px;
                        height: 8px;
                        background: #1a202c; /* gray-900 */
                        border-radius: 50%;
                    }
                    /* Patas de la araña */
                    .spider-body::before, .spider-body::after {
                        content: '';
                        position: absolute;
                        top: 2px;
                        width: 14px;
                        height: 1px;
                        background: #1a202c;
                    }
                    .spider-body::before { left: -3px; transform: rotate(45deg); }
                    .spider-body::after { left: -3px; transform: rotate(-45deg); }
                `}
            </style>
            
            <div className="absolute inset-0 pointer-events-none">
                {spiders.map((spider, index) => (
                    <div 
                        key={index} 
                        className="absolute top-0 h-[100px] w-20 pointer-events-auto flex justify-center group cursor-default"
                        style={{ right: spider.right }}
                    >
                        <div 
                            className={`spider-thread ${spider.hRest} ${spider.hDrop} transform ${spider.size}`}
                            style={{
                                transition: `height ${spider.delay} cubic-bezier(0.175, 0.885, 0.32, 1.275)`
                            }}
                        >
                            <div className="spider-body"></div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default HalloweenWeb;
