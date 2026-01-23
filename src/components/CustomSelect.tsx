
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: any;
  subLabel?: string;
  color?: string; // Tailwind class for background color preview (e.g. 'bg-red-500')
}

interface CustomSelectProps {
  value: string | undefined | null;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  variant?: 'standard' | 'ghost';
  icon?: any;
  className?: string;
  searchable?: boolean;
  chevronVisibility?: 'always' | 'on-hover' | 'never';
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  disabled = false, 
  variant = 'standard',
  icon: Icon,
  className = '',
  searchable = false,
  chevronVisibility = 'always'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const baseTriggerStyles = "relative w-full flex items-center justify-between transition-all outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 group";
  
  const variantStyles = {
    standard: "bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm",
    ghost: "bg-transparent text-[10px] font-bold text-slate-500 px-2 py-1 -ml-2 rounded-md hover:text-indigo-600 hover:bg-indigo-50"
  };

  const getChevronOpacity = () => {
    if (chevronVisibility === 'never') return 'hidden';
    if (chevronVisibility === 'on-hover') return 'opacity-0 group-hover:opacity-100';
    return 'opacity-100';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* TRIGGER */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${baseTriggerStyles} ${variantStyles[variant]}`}
      >
        <div className="flex items-center gap-2 truncate pr-6">
            {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
            {selectedOption ? (
                <span className="truncate flex items-center gap-2">
                    {selectedOption.color && <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedOption.color}`} />}
                    {selectedOption.icon && <selectedOption.icon size={12} className="inline mr-2 -mt-0.5" />}
                    {selectedOption.label}
                </span>
            ) : (
                <span className="text-slate-400 truncate">{placeholder}</span>
            )}
        </div>
        
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${getChevronOpacity()}`}>
             <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute z-[999] top-full left-0 mt-2 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
            {searchable && (
                <div className="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="relative">
                        <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                        <input 
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-slate-700"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
            
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                    <div 
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                            value === option.value 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {option.color ? (
                                <div className={`w-3 h-3 rounded-full shrink-0 ${option.color} ring-1 ring-slate-200 shadow-sm`} />
                            ) : option.icon && (
                                <div className={`p-1 rounded-md ${value === option.value ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-500'}`}>
                                    <option.icon size={14} />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">{option.label}</span>
                                {option.subLabel && <span className="text-[9px] font-medium opacity-60">{option.subLabel}</span>}
                            </div>
                        </div>
                        {value === option.value && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                    </div>
                )) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic">No matches found</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
