import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';

interface ColumnHeaderProps {
  label: string;
  onSort: () => void;
  onFilter: (e: React.MouseEvent) => void;
  isSorted: boolean;
  sortDir: 'asc' | 'desc';
  isFiltered: boolean;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ 
  label, onSort, onFilter, isSorted, sortDir, isFiltered 
}) => {
  const isActive = isSorted || isFiltered;
  return (
    <th className={`px-6 py-4 text-left transition-all relative border-r border-white/5 last:border-r-0 ${
      isActive ? 'bg-indigo-600 text-white shadow-inner' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
    }`}>
      <div className="flex items-center justify-between gap-2 min-w-[120px]">
        <span className="text-[11px] font-black uppercase tracking-wider truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onSort(); }} 
            className={`p-1 rounded transition-colors ${isActive ? 'hover:bg-indigo-500' : 'hover:bg-slate-200'}`}
          >
            {isSorted ? (
              sortDir === 'asc' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />
            ) : (
              <ArrowUpDown size={12} className="opacity-40" />
            )}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onFilter(e); }} 
            className={`p-1 rounded transition-colors ${isFiltered ? 'bg-indigo-400 text-white' : (isActive ? 'hover:bg-indigo-500' : 'hover:bg-slate-200')}`}
          >
            <ListFilter size={12} strokeWidth={isFiltered ? 3 : 2} className={!isFiltered && !isActive ? 'opacity-40' : ''} />
          </button>
        </div>
      </div>
    </th>
  );
};

export default ColumnHeader;
