import React from 'react';
import { 
  ArrowUpDown, RotateCcw, Search, Plus, ChevronDown, History, 
  Play, Pencil, ArrowRight, X, Lock, Globe
} from 'lucide-react';
import { ProcessDefinition, StepType } from '../types';
import { useUser } from '../contexts/UserContext';
import { useData } from '../contexts/DataContext';
import { useLibraryFilters } from '../hooks/useLibraryFilters';
import { LibraryContext } from '../hooks/useAppNavigation';
import ColumnHeader from '../components/ui/ColumnHeader';

interface LibraryPageProps {
  libraryContext: LibraryContext;
  onOpenProcess: (p: ProcessDefinition, readOnly: boolean) => void;
  onEditProcess: (p: ProcessDefinition) => void;
  onRunProcess: (p: ProcessDefinition) => void;
}

const LibraryPage: React.FC<LibraryPageProps> = ({ 
  libraryContext, 
  onOpenProcess, 
  onEditProcess,
  onRunProcess 
}) => {
  const { currentUser } = useUser();
  const { processes, saveProcesses } = useData();
  
  const {
    searchTerm,
    sortConfig,
    columnFilters,
    activeFilterMenu,
    activeVersionSelector,
    filteredData,
    setSearchTerm,
    handleSort,
    setColumnFilters,
    setActiveFilterMenu,
    setActiveVersionSelector,
  } = useLibraryFilters(libraryContext);

  const handleCreateNewProcess = () => {
    const newId = `p-${Date.now()}`;
    const newP: ProcessDefinition = { 
      id: `${newId}-v1-draft`, 
      rootId: newId, 
      versionNumber: 1, 
      status: 'DRAFT', 
      title: '', 
      description: '', 
      category: currentUser.team, 
      isPublic: false,
      createdAt: new Date().toISOString(), 
      createdBy: `${currentUser.firstName} ${currentUser.lastName}`, 
      lastReviewedAt: new Date().toISOString(), 
      lastReviewedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      review_frequency_days: 180, 
      review_due_lead_days: 30, 
      sequential_execution: false,
      editor_team_id: currentUser.team,
      publisher_team_id: undefined,
      run_validator_team_id: undefined,
      executor_team_id: currentUser.team,
      steps: [{ id: `s-${Date.now()}`, orderIndex: 0, text: '', inputType: StepType.CHECKBOX, required: true }] 
    };
    saveProcesses([newP, ...processes]); 
    onOpenProcess(newP, false);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-10 h-24 flex items-center shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <button 
            onClick={() => handleSort('title')} 
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap"
          >
            <ArrowUpDown size={14} /> Sort
          </button>
          {Object.keys(columnFilters).length > 0 && (
            <button 
              onClick={() => setColumnFilters({})} 
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
            >
              <RotateCcw size={14} /> Reset Filters
            </button>
          )}
        </div>
        
        <div className="flex justify-center flex-1">
          <div className="relative w-full max-w-[400px]">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search templates..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" 
            />
          </div>
        </div>
        
        <div className="flex justify-end flex-1">
          {libraryContext === 'DESIGN' && (currentUser.permissions.canDesign || currentUser.permissions.canManageTeam) && (
            <button 
              onClick={handleCreateNewProcess} 
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
            >
              <Plus size={18} /> New Process
            </button>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="flex-1 overflow-auto p-10 custom-scrollbar">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-[1000px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <ColumnHeader 
                  label="Process Name" 
                  onSort={() => handleSort('title')} 
                  onFilter={(e) => setActiveFilterMenu({ key: 'title', x: e.clientX, y: e.clientY })} 
                  isSorted={sortConfig?.key === 'title'} 
                  sortDir={sortConfig?.dir || 'asc'} 
                  isFiltered={!!columnFilters.title} 
                />
                <ColumnHeader 
                  label="Category" 
                  onSort={() => handleSort('category')} 
                  onFilter={(e) => setActiveFilterMenu({ key: 'category', x: e.clientX, y: e.clientY })} 
                  isSorted={sortConfig?.key === 'category'} 
                  sortDir={sortConfig?.dir || 'asc'} 
                  isFiltered={!!columnFilters.category} 
                />
                <ColumnHeader 
                  label="Version" 
                  onSort={() => handleSort('versionNumber')} 
                  onFilter={(e) => setActiveFilterMenu({ key: 'versionNumber', x: e.clientX, y: e.clientY })} 
                  isSorted={sortConfig?.key === 'versionNumber'} 
                  sortDir={sortConfig?.dir || 'asc'} 
                  isFiltered={!!columnFilters.versionNumber} 
                />
                <th className="px-6 py-4 bg-slate-50 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Resolution Hub
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? filteredData.map(p => {
                const family = processes.filter(v => v.rootId === p.rootId).sort((a,b) => b.versionNumber - a.versionNumber);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group h-16">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          {p.title || 'Untitled Template'}
                          {p.isPublic ? (
                            <span title="Public" className="flex items-center">
                              <Globe size={10} className="text-emerald-500" />
                            </span>
                          ) : (
                            <span title="Private to Team" className="flex items-center">
                              <Lock size={10} className="text-slate-300" />
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter truncate max-w-[200px]">
                          ID: {p.rootId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVersionSelector(activeVersionSelector === p.id ? null : p.id);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black transition-all ${
                            p.status === 'DRAFT' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                            p.status === 'IN_REVIEW' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                            p.status === 'PUBLISHED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          v{p.versionNumber} &middot; {p.status}
                          <ChevronDown size={14} className={`transition-transform ${activeVersionSelector === p.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {activeVersionSelector === p.id && (
                          <div 
                            className="absolute top-full left-6 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-1 animate-in fade-in zoom-in-95 origin-top"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">History Explorer</span>
                              <X size={12} className="cursor-pointer text-slate-300 hover:text-slate-600" onClick={() => setActiveVersionSelector(null)} />
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                              {family.map(v => (
                                <button 
                                  key={v.id} 
                                  onClick={() => {
                                    onOpenProcess(v, true);
                                    setActiveVersionSelector(null);
                                  }}
                                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group/v transition-colors ${v.id === p.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50'}`}
                                >
                                  <div className="flex flex-col">
                                    <div className="text-[10px] font-black uppercase tracking-tight">
                                      v{v.versionNumber} &middot; <span className={v.status === 'DRAFT' ? 'text-amber-500' : v.status === 'IN_REVIEW' ? 'text-amber-600' : v.status === 'PUBLISHED' ? 'text-emerald-500' : 'text-slate-400'}>{v.status}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-medium">
                                      Created {new Date(v.createdAt).toLocaleDateString()} by {v.createdBy.split(' ')[0]}
                                    </div>
                                  </div>
                                  <History size={12} className="text-slate-300 group-hover/v:text-indigo-400 transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {libraryContext === 'RUN' ? (
                          <button 
                            onClick={() => onRunProcess(p)} 
                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                          >
                            <Play size={14} fill="currentColor" /> Run
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => onEditProcess(p)} 
                              className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => onOpenProcess(p, true)} 
                              className="p-2.5 bg-slate-50 text-slate-300 rounded-xl hover:text-indigo-600 transition-all"
                            >
                              <ArrowRight size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 italic">
                    No processes found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Menu */}
      {activeFilterMenu && (
        <div 
          className="fixed z-[100] bg-white border border-slate-200 shadow-2xl rounded-xl p-4 w-64 animate-in zoom-in-95 duration-200" 
          style={{ left: activeFilterMenu.x, top: activeFilterMenu.y + 10 }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase text-slate-400">Filter {activeFilterMenu.key}</span>
            <button onClick={() => setActiveFilterMenu(null)}><X size={14} /></button>
          </div>
          <input 
            autoFocus 
            className="w-full border border-slate-200 rounded-lg p-2 text-xs" 
            placeholder="Type to filter..." 
            value={columnFilters[activeFilterMenu.key] || ''} 
            onChange={(e) => setColumnFilters({...columnFilters, [activeFilterMenu.key]: e.target.value})}
          />
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
