import React, { useState, useMemo, useCallback, useEffect } from 'react';

interface ReviewCycleSliderProps {
  value: number; // Always stored in days
  onChange: (days: number) => void;
  disabled?: boolean;
}

const MONTH_TICKS = [3, 6, 9, 12];

export const ReviewCycleSlider: React.FC<ReviewCycleSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [activeMode, setActiveMode] = useState<'months' | 'days'>('months');
  const [monthsInput, setMonthsInput] = useState('');
  const [daysInput, setDaysInput] = useState('');

  // Convert between days and months
  const daysToMonths = useCallback((days: number) => Math.round(days / 30), []);
  const monthsToDays = useCallback((months: number) => months * 30, []);

  // Sync inputs with value
  useEffect(() => {
    setMonthsInput(String(daysToMonths(value)));
    setDaysInput(String(value));
  }, [value, daysToMonths]);

  // Calculate slider position percentage
  const percentage = useMemo(() => {
    if (activeMode === 'months') {
      const months = daysToMonths(value);
      return ((months - 1) / 11) * 100; // 1-12 range
    }
    return ((value - 1) / 364) * 100; // 1-365 range
  }, [value, activeMode, daysToMonths]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(e.target.value);
    if (activeMode === 'months') {
      onChange(monthsToDays(sliderValue));
    } else {
      onChange(sliderValue);
    }
  };

  const handleMonthsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonthsInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      onChange(monthsToDays(num));
    }
  };

  const handleDaysInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDaysInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1 && num <= 365) {
      onChange(num);
    }
  };

  const handleMonthsBlur = () => {
    const num = parseInt(monthsInput);
    if (isNaN(num) || num < 1) {
      setMonthsInput('1');
      onChange(30);
    } else if (num > 12) {
      setMonthsInput('12');
      onChange(360);
    }
  };

  const handleDaysBlur = () => {
    const num = parseInt(daysInput);
    if (isNaN(num) || num < 1) {
      setDaysInput('1');
      onChange(1);
    } else if (num > 365) {
      setDaysInput('365');
      onChange(365);
    }
  };

  const selectMonthsMode = () => setActiveMode('months');
  const selectDaysMode = () => setActiveMode('days');

  // Current slider values based on mode
  const sliderMin = activeMode === 'months' ? 1 : 1;
  const sliderMax = activeMode === 'months' ? 12 : 365;
  const sliderValue = activeMode === 'months' ? daysToMonths(value) : value;
  const sliderStep = activeMode === 'months' ? 1 : 1;

  return (
    <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3">
        
        {/* Months Input Box */}
        <button
          onClick={selectMonthsMode}
          className={`
            flex flex-col items-center transition-all duration-150
            ${activeMode === 'months' ? '' : 'opacity-60'}
          `}
        >
          <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 transition-colors ${
            activeMode === 'months' ? 'text-indigo-600' : 'text-slate-400'
          }`}>
            Months
          </span>
          <div className={`
            relative w-14 h-10 rounded-lg border-2 transition-all duration-150 overflow-hidden
            ${activeMode === 'months' 
              ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
              : 'border-slate-200 bg-white hover:border-slate-300'
            }
          `}>
            <input
              type="text"
              inputMode="numeric"
              value={monthsInput}
              onChange={handleMonthsInputChange}
              onFocus={selectMonthsMode}
              onBlur={handleMonthsBlur}
              disabled={disabled}
              maxLength={2}
              className={`
                w-full h-full text-center font-bold text-lg bg-transparent outline-none
                ${activeMode === 'months' ? 'text-indigo-700' : 'text-slate-600'}
              `}
            />
          </div>
        </button>

        {/* Slider Track */}
        <div className="flex-1 relative">
          <div className="relative h-10 flex items-center">
            {/* Track Background */}
            <div className="absolute inset-x-0 h-1.5 bg-slate-200 rounded-full" />
            
            {/* Active Track Fill */}
            <div 
              className="absolute h-1.5 bg-indigo-500 rounded-full transition-all duration-100"
              style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
            />
            
            {/* Tick Marks - only show in months mode */}
            {activeMode === 'months' && (
              <div className="absolute inset-x-0 flex items-center pointer-events-none">
                {MONTH_TICKS.map((month) => {
                  const tickPercent = ((month - 1) / 11) * 100;
                  const isActive = daysToMonths(value) >= month;
                  const isCurrent = daysToMonths(value) === month;
                  return (
                    <div
                      key={month}
                      className="absolute flex flex-col items-center -translate-x-1/2"
                      style={{ left: `${tickPercent}%` }}
                    >
                      <div className={`w-0.5 h-3 rounded-full transition-colors ${
                        isActive ? 'bg-indigo-400' : 'bg-slate-300'
                      }`} />
                      <span className={`text-[9px] font-semibold mt-1 transition-colors ${
                        isCurrent ? 'text-indigo-600' : isActive ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Range Input */}
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={sliderValue}
              onChange={handleSliderChange}
              disabled={disabled}
              className="absolute inset-x-0 w-full h-10 appearance-none bg-transparent cursor-pointer z-10
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-indigo-500
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:active:scale-105
                [&::-webkit-slider-thumb]:transition-transform
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-indigo-500
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:cursor-grab
              "
            />
          </div>
        </div>

        {/* Days Input Box */}
        <button
          onClick={selectDaysMode}
          className={`
            flex flex-col items-center transition-all duration-150
            ${activeMode === 'days' ? '' : 'opacity-60'}
          `}
        >
          <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 transition-colors ${
            activeMode === 'days' ? 'text-indigo-600' : 'text-slate-400'
          }`}>
            Days
          </span>
          <div className={`
            relative w-14 h-10 rounded-lg border-2 transition-all duration-150 overflow-hidden
            ${activeMode === 'days' 
              ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
              : 'border-slate-200 bg-white hover:border-slate-300'
            }
          `}>
            <input
              type="text"
              inputMode="numeric"
              value={daysInput}
              onChange={handleDaysInputChange}
              onFocus={selectDaysMode}
              onBlur={handleDaysBlur}
              disabled={disabled}
              maxLength={3}
              className={`
                w-full h-full text-center font-bold text-lg bg-transparent outline-none
                ${activeMode === 'days' ? 'text-indigo-700' : 'text-slate-600'}
              `}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ReviewCycleSlider;
