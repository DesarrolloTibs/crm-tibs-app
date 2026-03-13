import React, { useState, useEffect, useRef } from 'react';
import './SpringDecorations.scss';

const SpringDecorations: React.FC = () => {
    const [numFlowers, setNumFlowers] = useState(0);
    const [numGrass, setNumGrass] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const calculateItems = (width: number) => {
            if (width > 0) {
                const itemWidth = 140; 
                const newNumFlowers = Math.floor(width / itemWidth);
                setNumFlowers(Math.max(2, newNumFlowers));

                const grassWidth = 15;
                setNumGrass(Math.floor(width / grassWidth));
            }
        };

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                calculateItems(entry.contentRect.width);
            }
        });

        if (containerRef.current) {
            calculateItems(containerRef.current.offsetWidth);
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className="spring-background" ref={containerRef}>
            <div className="butterfly-container">
                <div className="butterfly b1"></div>
                <div className="butterfly b2"></div>
                <div className="butterfly b3"></div>
                <div className="butterfly b4"></div>
                <div className="butterfly b5"></div>
                <div className="butterfly b6"></div>
            </div>
            <div className="flowers-container">
                {Array.from({ length: numFlowers }).map((_, index) => (
                    <div key={index} className={`flower f${(index % 3) + 1}`}>
                        <div className="petals">
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="petal"></div>
                            <div className="center"></div>
                        </div>
                        <div className="stem"></div>
                    </div>
                ))}
            </div>
            <div className="grass-container">
                {Array.from({ length: numGrass }).map((_, index) => (
                    <div key={index} className="blade"></div>
                ))}
            </div>
        </div>
    );
};

export default SpringDecorations;
