import React, { useMemo } from 'react';
import seasonsData from './seasons.json';
import ChristmasLights from './Christmas/ChristmasLights';
import SpringDecorations from './Spring/SpringDecorations';

interface SeasonConfig {
    id: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    component: string;
}

const SeasonalContainer: React.FC = () => {
    const activeComponent = useMemo(() => {
        const now = new Date();
        const month = now.getMonth() + 1; // getMonth() returns 0-11
        const day = now.getDate();

        const isBetween = (m: number, d: number, startM: number, startD: number, endM: number, endD: number) => {
            const current = m * 100 + d;
            const start = startM * 100 + startD;
            const end = endM * 100 + endD;

            if (start <= end) {
                return current >= start && current <= end;
            } else {
                // Handles ranges that cross the year boundary (like Christmas Dec 1 - Jan 7)
                return current >= start || current <= end;
            }
        };

        const activeSeason = (seasonsData as SeasonConfig[]).find(season => 
            isBetween(month, day, season.startMonth, season.startDay, season.endMonth, season.endDay)
        );

        if (!activeSeason) return null;

        switch (activeSeason.component) {
            case 'Christmas':
                return <ChristmasLights />;
            case 'Spring':
                return <SpringDecorations />;
            default:
                return null;
        }
    }, []);

    if (!activeComponent) return null;

    return (
        <div className="seasonal-decoration-container w-full h-full relative pointer-events-none">
            {activeComponent}
        </div>
    );
};

export default SeasonalContainer;
