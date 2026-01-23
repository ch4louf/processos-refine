import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Filter, Check, X } from 'lucide-react';

interface ColumnHeaderFilterProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  filterOptions?: { label: string; value: string }[];
  filterValue?: string | null;
  onFilter?: (value: string | null) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const ColumnHeaderFilter: React.FC<ColumnHeaderFilterProps> = ({
  label,
  sortKey,
  currentSort,
  onSort,
  filterOptions,
  filterValue,
  onFilter,
  className = '',
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isSorted = currentSort.key === sortKey;
  const isFiltered = filterValue !== null && filterValue !== undefined;
  const hasFilters = filterOptions && filterOptions.length > 0;
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSort(sortKey);
  };

  const handleFilter = (value: string | null) => {
    if (onFilter) {
      onFilter(value);
    }
    setIsOpen(false);
  };

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div 
        className={`flex items-center gap-1.5 cursor-pointer select-none group ${alignClasses[align]}`}
        onClick={() => hasFilters ? setIsOpen(!isOpen) : handleSort({ stopPropagation: () => {} } as React.MouseEvent)}
      >
        <span className={`transition-colors ${isSorted || isFiltered ? 'text-indigo-600' : 'group-hover:text-indigo-600'}`}>
          {label}
        </span>
        
        <div className="flex items-center gap-0.5">
          {/* Sort indicator - always visible */}
          <button
            onClick={handleSort}
            className={`p-0.5 rounded transition-all ${
              isSorted 
                ? 'text-indigo-600' 
                : 'text-slate-400 hover:text-indigo-500'
            }`}
            title={`Sort by ${label}`}
          >
            {isSorted ? (
              currentSort.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
            ) : (
              <ArrowDown size={11} className="opacity-50" />
            )}
          </button>
          
          {/* Filter indicator - always visible if filter options exist */}
          {hasFilters && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              className={`p-0.5 rounded transition-all ${
                isFiltered 
                  ? 'text-indigo-600 bg-indigo-100' 
                  : 'text-slate-400 hover:text-indigo-500'
              }`}
              title={`Filter by ${label}`}
            >
              <Filter size={10} className={isFiltered ? '' : 'opacity-50'} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && hasFilters && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Clear filter option */}
          <button
            onClick={() => handleFilter(null)}
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
              !isFiltered ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {!isFiltered && <Check size={12} />}
            <span className={!isFiltered ? '' : 'ml-5'}>All</span>
          </button>
          
          <div className="h-px bg-slate-100 my-1" />
          
          {/* Filter options */}
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleFilter(option.value)}
              className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                filterValue === option.value 
                  ? 'bg-indigo-50 text-indigo-700 font-bold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filterValue === option.value && <Check size={12} />}
              <span className={filterValue === option.value ? '' : 'ml-5'}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnHeaderFilter;
