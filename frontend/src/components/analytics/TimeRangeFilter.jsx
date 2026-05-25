import React from 'react';

const TimeRangeFilter = ({ selectedRange, onChange }) => {
    const ranges = [
        { label: 'Today', value: 1 },
        { label: 'Last Week', value: 7 },
        { label: 'Last Month', value: 30 },
        { label: 'Last Year', value: 365 },
        { label: 'All Time', value: 36500 } // Approx 100 years
    ];

    return (
        <div className="time-range-filter">
            {ranges.map((range) => (
                <button
                    key={range.value}
                    onClick={() => onChange(range.value)}
                    className={`time-filter-btn ${selectedRange === range.value ? 'active' : ''}`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
};

export default TimeRangeFilter;
