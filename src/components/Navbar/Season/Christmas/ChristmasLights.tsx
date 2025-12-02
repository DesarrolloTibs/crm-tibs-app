import React, { useState, useEffect, useRef } from 'react';
import './ChristmasLights.scss';

const ChristmasLights: React.FC = () => {
    const [numLights, setNumLights] = useState(0);
    const containerRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const calculateLights = (width: number) => {
            if (width > 0) {
                const lightWidth = 60; // Ancho aproximado de cada foco + margen
                const newNumLights = Math.floor(width / lightWidth);
                setNumLights(newNumLights-5);
            }
        };

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                calculateLights(entry.contentRect.width);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <ul className="lightrope" ref={containerRef}>
            {Array.from({ length: numLights }).map((_, index) => (
                <li key={index}></li>
            ))}
        </ul>
    );
};

export default ChristmasLights;
