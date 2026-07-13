import React from 'react';

export const ActivityHeatmap: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    // Generate the last 365 days
    const days = [];
    const today = new Date();
    // Round today to the start of the day
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Start date is 365 days ago, adjusted to start on a Sunday so the grid aligns
    const start = new Date(end);
    start.setDate(start.getDate() - 364);
    
    while (start.getDay() !== 0) {
        start.setDate(start.getDate() - 1);
    }

    const current = new Date(start);
    while (current <= end) {
        // use local timezone offset format to prevent ISO 8601 UTC shifting issues
        const dateStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
        const count = data ? (data[dateStr] || 0) : 0;
        days.push({ dateStr, count, date: new Date(current) });
        current.setDate(current.getDate() + 1);
    }

    const getMaxCount = () => {
        if (!data) return 1;
        const vals = Object.values(data);
        return vals.length ? Math.max(...vals) : 1;
    };
    const maxCount = getMaxCount();

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-white/5 border border-white/5';
        const ratio = count / maxCount;
        if (ratio < 0.25) return 'bg-plex/30 border border-plex/20';
        if (ratio < 0.5) return 'bg-plex/50 border border-plex/40';
        if (ratio < 0.75) return 'bg-plex/75 border border-plex/60';
        return 'bg-plex border border-plex/80 shadow-[0_0_8px_rgba(229,160,13,0.5)]';
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group weeks for month labels
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className="w-full flex flex-col gap-2 relative">
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-max flex flex-col gap-1 pr-4">
                    {/* Month labels */}
                    <div className="flex gap-[3px] ml-6 mb-1 text-[10px] text-muted font-semibold tracking-wider relative h-4">
                        {weeks.map((week, i) => {
                            const firstDay = week[0];
                            if (!firstDay) return null;
                            const isFirstWeekOfMonth = firstDay.date.getDate() <= 7;
                            if (isFirstWeekOfMonth) {
                                return (
                                    <div key={i} className="flex-shrink-0 w-[11px] relative">
                                        <span className="absolute">{months[firstDay.date.getMonth()]}</span>
                                    </div>
                                );
                            }
                            return <div key={i} className="w-[11px] flex-shrink-0"></div>;
                        })}
                    </div>
                    
                    {/* Heatmap Grid */}
                    <div className="flex gap-2">
                        {/* Day labels (Sun, Mon, etc.) */}
                        <div className="flex flex-col gap-[3px] text-[9px] text-muted font-semibold mt-1">
                            <span style={{ height: '11px', lineHeight: '11px' }}></span>
                            <span style={{ height: '11px', lineHeight: '11px' }}>Mon</span>
                            <span style={{ height: '11px', lineHeight: '11px' }}></span>
                            <span style={{ height: '11px', lineHeight: '11px' }}>Wed</span>
                            <span style={{ height: '11px', lineHeight: '11px' }}></span>
                            <span style={{ height: '11px', lineHeight: '11px' }}>Fri</span>
                            <span style={{ height: '11px', lineHeight: '11px' }}></span>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
                            {days.map((day, i) => {
                                const intensityClass = getIntensityClass(day.count);
                                return (
                                    <div 
                                        key={i} 
                                        className={`w-[11px] h-[11px] rounded-[2px] transition-colors duration-300 group relative ${intensityClass}`}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/95 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 font-mono shadow-md border border-white/5 flex gap-2">
                                            <span className="font-bold text-plex">{day.count} plays</span>
                                            <span className="text-muted">{day.dateStr}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 text-[10px] text-muted font-medium mt-2">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-white/5 border border-white/5"></div>
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-plex/30 border border-plex/20"></div>
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-plex/50 border border-plex/40"></div>
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-plex/75 border border-plex/60"></div>
                    <div className="w-[11px] h-[11px] rounded-[2px] bg-plex border border-plex/80"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
};
