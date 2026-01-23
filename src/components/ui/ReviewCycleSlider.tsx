import React, { useState, useCallback, useEffect } from 'react';

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

  // Find closest tick for months mode
  const getClosestTick = useCallback((months: number) => {
    let closest = MONTH_TICKS[0];
    let minDiff = Math.abs(months - closest);
    for (const tick of MONTH_TICKS) {
      const diff = Math.abs(months - tick);
      if (diff < minDiff) {
        minDiff = diff;
        closest = tick;
      }
    }
    return closest;
  }, []);

  // Get tick index for slider (0-3 for ticks 3,6,9,12)
  const getTickIndex = useCallback((months: number) => {
    const idx = MONTH_TICKS.indexOf(months);
    return idx >= 0 ? idx : 0;
  }, []);

  // Sync inputs with value
  useEffect(() => {
    setMonthsInput(String(daysToMonths(value)));
    setDaysInput(String(value));
  }, [value, daysToMonths]);

  // Get current slider position (0-3 for months mode)
  const sliderPosition = activeMode === 'months' 
    ? getTickIndex(getClosestTick(daysToMonths(value))) 
    : value;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(e.target.value);
    if (activeMode === 'months') {
      // Slider value is tick index (0-3), convert to actual month value
      const monthValue = MONTH_TICKS[sliderValue];
      onChange(monthsToDays(monthValue));
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

  // Slider config based on mode
  const sliderMin = activeMode === 'months' ? 0 : 1;
  const sliderMax = activeMode === 'months' ? MONTH_TICKS.length - 1 : 365;

  return (
    <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-4">
        
        {/* Months Input Box */}
        <button
          onClick={selectMonthsMode}
          className="flex flex-col items-center transition-all duration-200"
        >
          <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 transition-colors ${
            activeMode === 'months' ? 'text-indigo-600' : 'text-slate-400'
          }`}>
            Months
          </span>
          <div className={`
            relative w-16 h-11 rounded-xl border-2 transition-all duration-200 overflow-hidden
            ${activeMode === 'months' 
              ? 'border-indigo-500 bg-gradient-to-b from-indigo-50 to-white shadow-lg shadow-indigo-100' 
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
                w-full h-full text-center font-bold text-xl bg-transparent outline-none
                ${activeMode === 'months' ? 'text-indigo-700' : 'text-slate-500'}
              `}
            />
          </div>
        </button>

        {/* Premium Slider Track */}
        <div className="flex-1 relative px-2">
          <div className="relative h-12 flex items-center">
            {/* Track Background with gradient */}
            <div className="absolute inset-x-0 h-2 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-full shadow-inner" />
            
            {/* Active Track Fill */}
            <div 
              className="absolute h-2 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-150 ease-out shadow-sm"
              style={{ 
                width: activeMode === 'months' 
                  ? `${(sliderPosition / 3) * 100}%` 
                  : `${((value - 1) / 364) * 100}%` 
              }}
            />

            {/* Range Input */}
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={1}
              value={sliderPosition}
              onChange={handleSliderChange}
              disabled={disabled}
              className="absolute inset-x-0 w-full h-12 appearance-none bg-transparent cursor-pointer z-10
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-[3px]
                [&::-webkit-slider-thumb]:border-indigo-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-indigo-200
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:active:scale-100
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:duration-150
                [&::-moz-range-thumb]:w-6
                [&::-moz-range-thumb]:h-6
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-[3px]
                [&::-moz-range-thumb]:border-indigo-500
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-grab
              "
            />
          </div>
        </div>

        {/* Days Input Box */}
        <button
          onClick={selectDaysMode}
          className="flex flex-col items-center transition-all duration-200"
        >
          <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 transition-colors ${
            activeMode === 'days' ? 'text-indigo-600' : 'text-slate-400'
          }`}>
            Days
          </span>
          <div className={`
            relative w-16 h-11 rounded-xl border-2 transition-all duration-200 overflow-hidden
            ${activeMode === 'days' 
              ? 'border-indigo-500 bg-gradient-to-b from-indigo-50 to-white shadow-lg shadow-indigo-100' 
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
                w-full h-full text-center font-bold text-xl bg-transparent outline-none
                ${activeMode === 'days' ? 'text-indigo-700' : 'text-slate-500'}
              `}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ReviewCycleSlider;
