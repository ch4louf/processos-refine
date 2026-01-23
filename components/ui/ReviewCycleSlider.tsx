import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ReviewCycleSliderProps {
  value: number; // Always stored in days
  onChange: (days: number) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '3mo', months: 3, days: 90 },
  { label: '6mo', months: 6, days: 180 },
  { label: '9mo', months: 9, days: 270 },
  { label: '1yr', months: 12, days: 365 },
];

export const ReviewCycleSlider: React.FC<ReviewCycleSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [unit, setUnit] = useState<'months' | 'days'>('months');
  const [isDragging, setIsDragging] = useState(false);

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
  const maxValue = unit === 'months' ? 24 : 730;

  // Calculate percentage for slider fill
  const percentage = useMemo(() => {
    return ((displayValue - minValue) / (maxValue - minValue)) * 100;
  }, [displayValue, minValue, maxValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    const newDays = unit === 'months' ? monthsToDays(newValue) : newValue;
    onChange(newDays);
  };

  // Format display label
  const formatLabel = useMemo(() => {
    if (unit === 'months') {
      const months = daysToMonths(value);
      return months === 1 ? '1 month' : `${months} months`;
    }
    return `${value} days`;
  }, [value, unit, daysToMonths]);

  // Find active preset
  const activePreset = PRESETS.find(p => Math.abs(value - p.days) < 15);

  return (
    <div className={`space-y-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      
      {/* Value Display Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-xl">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Calendar size={18} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Review Every</div>
              <div className="text-2xl font-bold text-white tracking-tight">{formatLabel}</div>
            </div>
          </div>
          
          {/* Unit Toggle */}
          <div className="flex bg-slate-700/50 rounded-lg p-0.5">
            <button
              onClick={() => setUnit('months')}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                unit === 'months' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Months
            </button>
            <button
              onClick={() => setUnit('days')}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                unit === 'days' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Days
            </button>
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative px-1">
        <div className="relative h-12 flex items-center">
          {/* Background Track */}
          <div className="absolute inset-x-0 h-2 bg-slate-100 rounded-full overflow-hidden">
            {/* Active Fill with gradient */}
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
            />
          </div>
          
          {/* Tick marks */}
          {unit === 'months' && (
            <div className="absolute inset-x-0 h-2 flex items-center pointer-events-none">
              {[3, 6, 9, 12, 18, 24].map((month) => {
                const tickPercent = ((month - minValue) / (maxValue - minValue)) * 100;
                const isActive = daysToMonths(value) >= month;
                return (
                  <div
                    key={month}
                    className={`absolute w-0.5 h-3 rounded-full transition-colors duration-200 -translate-x-1/2 ${
                      isActive ? 'bg-white/60' : 'bg-slate-300'
                    }`}
                    style={{ left: `${tickPercent}%` }}
                  />
                );
              })}
            </div>
          )}

          {/* Range Input */}
          <input
            type="range"
            min={minValue}
            max={maxValue}
            step={unit === 'months' ? 1 : 7}
            value={displayValue}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            disabled={disabled}
            className="absolute inset-x-0 w-full h-12 appearance-none bg-transparent cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.15),0_0_0_4px_rgba(99,102,241,0.15)]
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-indigo-500
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-webkit-slider-thumb]:active:scale-110
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-150
              [&::-moz-range-thumb]:w-6
              [&::-moz-range-thumb]:h-6
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.15)]
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-indigo-500
              [&::-moz-range-thumb]:cursor-grab
            "
          />
        </div>

        {/* Scale Labels */}
        {unit === 'months' && (
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[10px] font-medium text-slate-400">1mo</span>
            <span className="text-[10px] font-medium text-slate-400">12mo</span>
            <span className="text-[10px] font-medium text-slate-400">24mo</span>
          </div>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map(({ label, days }) => {
          const isActive = Math.abs(value - days) < 15;
          return (
            <button
              key={label}
              onClick={() => !disabled && onChange(days)}
              disabled={disabled}
              className={`
                relative py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 hover:scale-[1.02]'
                }
              `}
            >
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 opacity-100" />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <Clock size={12} />
        <span>Process will expire and block new runs after this period</span>
      </div>
    </div>
  );
};

export default ReviewCycleSlider;
