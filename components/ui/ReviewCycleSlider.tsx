import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

interface ReviewCycleSliderProps {
  value: number; // Always stored in days
  onChange: (days: number) => void;
  disabled?: boolean;
}

const MONTH_PRESETS = [
  { months: 3, days: 90 },
  { months: 6, days: 180 },
  { months: 9, days: 270 },
  { months: 12, days: 365 },
];

export const ReviewCycleSlider: React.FC<ReviewCycleSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [unit, setUnit] = useState<'months' | 'days'>('months');

  // Convert days to months (approximate)
  const daysToMonths = useCallback((days: number) => Math.round(days / 30), []);
  const monthsToDays = useCallback((months: number) => months * 30, []);

  // Current display value based on unit
  const displayValue = useMemo(() => {
    if (unit === 'months') {
      return daysToMonths(value);
    }
    return value;
  }, [value, unit, daysToMonths]);

  // Min/Max based on unit
  const minValue = unit === 'months' ? 1 : 30;
  const maxValue = unit === 'months' ? 24 : 730; // Up to 24 months or ~2 years in days

  // Calculate percentage for slider fill
  const percentage = useMemo(() => {
    return ((displayValue - minValue) / (maxValue - minValue)) * 100;
  }, [displayValue, minValue, maxValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    const newDays = unit === 'months' ? monthsToDays(newValue) : newValue;
    onChange(newDays);
  };

  const handleUnitToggle = () => {
    setUnit(prev => prev === 'months' ? 'days' : 'months');
  };

  // Format display label
  const formatLabel = useMemo(() => {
    if (unit === 'months') {
      const months = daysToMonths(value);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${value} days`;
  }, [value, unit, daysToMonths]);

  // Tick marks for months view
  const monthTicks = [3, 6, 9, 12, 18, 24];

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header with unit toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-indigo-500" />
          <span className="text-sm font-bold text-slate-700">{formatLabel}</span>
        </div>
        <button
          onClick={handleUnitToggle}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-[10px] font-bold uppercase tracking-widest text-slate-500"
        >
          {unit === 'months' ? (
            <>
              <ToggleLeft size={14} className="text-indigo-500" />
              MONTHS
            </>
          ) : (
            <>
              <ToggleRight size={14} className="text-indigo-500" />
              DAYS
            </>
          )}
        </button>
      </div>

      {/* Slider */}
      <div className="relative pt-2 pb-6">
        <div className="relative">
          {/* Track background */}
          <div className="absolute inset-0 h-2 bg-slate-200 rounded-full" />
          
          {/* Active track */}
          <div 
            className="absolute h-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-150"
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
          
          {/* Input range */}
          <input
            type="range"
            min={minValue}
            max={maxValue}
            step={unit === 'months' ? 1 : 7}
            value={displayValue}
            onChange={handleSliderChange}
            disabled={disabled}
            className="relative w-full h-2 appearance-none bg-transparent cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-indigo-500
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-indigo-500
              [&::-moz-range-thumb]:shadow-lg
              [&::-moz-range-thumb]:cursor-grab
            "
          />
        </div>

        {/* Tick marks for months view */}
        {unit === 'months' && (
          <div className="absolute left-0 right-0 top-6 flex justify-between px-1">
            {monthTicks.map((month) => {
              const tickPercent = ((month - minValue) / (maxValue - minValue)) * 100;
              const isActive = daysToMonths(value) >= month;
              const isSelected = daysToMonths(value) === month;
              return (
                <button
                  key={month}
                  onClick={() => !disabled && onChange(monthsToDays(month))}
                  className={`
                    flex flex-col items-center -translate-x-1/2 transition-all
                    ${isSelected ? 'scale-110' : ''}
                  `}
                  style={{ position: 'absolute', left: `${tickPercent}%` }}
                  disabled={disabled}
                >
                  <div className={`w-1 h-2 rounded-full transition-colors ${isActive ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                  <span className={`text-[9px] font-bold mt-1 transition-colors ${isSelected ? 'text-indigo-600' : isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                    {month}m
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Days view - show week markers */}
        {unit === 'days' && (
          <div className="absolute left-0 right-0 top-6 flex justify-between">
            {[30, 90, 180, 365, 730].map((day) => {
              const tickPercent = ((day - minValue) / (maxValue - minValue)) * 100;
              if (tickPercent < 0 || tickPercent > 100) return null;
              const isActive = value >= day;
              const isSelected = Math.abs(value - day) < 7;
              return (
                <button
                  key={day}
                  onClick={() => !disabled && onChange(day)}
                  className="flex flex-col items-center -translate-x-1/2 transition-all"
                  style={{ position: 'absolute', left: `${tickPercent}%` }}
                  disabled={disabled}
                >
                  <div className={`w-1 h-2 rounded-full transition-colors ${isActive ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                  <span className={`text-[9px] font-bold mt-1 transition-colors ${isSelected ? 'text-indigo-600' : isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                    {day >= 365 ? `${Math.round(day/365)}y` : day >= 30 ? `${Math.round(day/30)}m` : `${day}d`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap">
        {MONTH_PRESETS.map(({ months, days }) => (
          <button
            key={months}
            onClick={() => !disabled && onChange(days)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
              ${Math.abs(value - days) < 15
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }
            `}
          >
            {months}mo
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReviewCycleSlider;
