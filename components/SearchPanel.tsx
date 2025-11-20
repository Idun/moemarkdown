import React from 'react';
import { 
  ArrowUp, ArrowDown, X, 
  CaseSensitive, WholeWord, Regex, 
  Replace, ReplaceAll, Search, ChevronRight, ChevronDown
} from 'lucide-react';

interface SearchPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  replaceTerm: string;
  onReplaceChange: (term: string) => void;
  matchCount: number;
  currentMatchIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
  caseSensitive: boolean;
  setCaseSensitive: (v: boolean) => void;
  wholeWord: boolean;
  setWholeWord: (v: boolean) => void;
  useRegex: boolean;
  setUseRegex: (v: boolean) => void;
  showReplace: boolean;
  toggleReplace: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  searchTerm, onSearchChange,
  replaceTerm, onReplaceChange,
  matchCount, currentMatchIndex,
  onNext, onPrevious,
  onReplace, onReplaceAll, onClose,
  caseSensitive, setCaseSensitive,
  wholeWord, setWholeWord,
  useRegex, setUseRegex,
  showReplace, toggleReplace
}) => {
  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[520px] bg-white rounded-xl shadow-2xl border border-slate-200 text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans ring-1 ring-black/5">
      
      {/* Absolute Close Button */}
      <button 
        onClick={onClose} 
        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors z-10" 
        title="关闭 (Esc)"
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      <div className="p-4">
        {/* Search Row */}
        <div className="flex items-center gap-3 mb-3 pr-6">
          <button 
            onClick={toggleReplace}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors shrink-0"
            title={showReplace ? "隐藏替换" : "显示替换"}
          >
            {showReplace ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <div className="flex-1 flex items-center border border-slate-300 rounded-md bg-white px-2.5 py-1.5 focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100 transition-all shadow-sm">
            <Search size={15} className="text-slate-400 mr-2 shrink-0" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="查找..."
              className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 min-w-0 text-sm"
              autoFocus
            />
            
            <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
              <button 
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${caseSensitive ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                title="区分大小写 (Alt+C)"
              >
                <CaseSensitive size={14} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setWholeWord(!wholeWord)}
                className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${wholeWord ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                title="全字匹配 (Alt+W)"
              >
                <WholeWord size={14} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setUseRegex(!useRegex)}
                className={`p-1 rounded-md hover:bg-slate-100 transition-colors ${useRegex ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                title="正则表达式 (Alt+R)"
              >
                <Regex size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400 font-mono min-w-[40px] text-center">
              {searchTerm && matchCount > 0 
                ? `${currentMatchIndex + 1}/${matchCount}` 
                : <span className="text-slate-300">-</span>}
            </div>

            <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
              <button onClick={onPrevious} className="p-1 text-slate-500 hover:bg-white hover:text-slate-900 rounded-sm disabled:opacity-30 transition-all shadow-sm" disabled={matchCount === 0} title="上一个 (Shift+Enter)">
                <ArrowUp size={14} />
              </button>
              <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
              <button onClick={onNext} className="p-1 text-slate-500 hover:bg-white hover:text-slate-900 rounded-sm disabled:opacity-30 transition-all shadow-sm" disabled={matchCount === 0} title="下一个 (Enter)">
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Replace Row */}
        {showReplace && (
          <div className="flex items-center gap-3 pl-9 pr-6 animate-in slide-in-from-top-2 duration-200 fade-in-50">
            <div className="flex-1 flex items-center border border-slate-300 rounded-md bg-white px-2.5 py-1.5 focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100 transition-all shadow-sm">
              <Replace size={15} className="text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                value={replaceTerm}
                onChange={(e) => onReplaceChange(e.target.value)}
                placeholder="替换为..."
                className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 min-w-0 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={onReplace}
                disabled={matchCount === 0}
                className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-slate-100 hover:text-slate-900 rounded-md border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                title="替换当前"
              >
                替换
              </button>
              <button 
                onClick={onReplaceAll}
                disabled={matchCount === 0}
                className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium hover:bg-slate-100 hover:text-slate-900 rounded-md border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                title="全部替换"
              >
                全部替换
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;