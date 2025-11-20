import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, Check, Loader2, AlignLeft, Type, 
  Undo, Redo, ChevronDown, Send, Search,
  Copy, ClipboardPaste, FoldVertical, AlignVerticalJustifyCenter, ListCollapse
} from 'lucide-react';
import { AIActionType } from '../types';

interface ToolbarProps {
  onFormat: () => void;
  onAIAction: (type: AIActionType, customPrompt?: string) => Promise<void>;
  isProcessingAI: boolean;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  syncScroll: boolean;
  onSyncScrollChange: (sync: boolean) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onRemoveEmptyLines: (mode: 'smart' | 'aggressive') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onFormat, 
  onAIAction, 
  isProcessingAI,
  fontSize,
  onFontSizeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  syncScroll,
  onSyncScrollChange,
  showSearch,
  onToggleSearch,
  onCopy,
  onPaste,
  onRemoveEmptyLines
}) => {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [customInput, setCustomInput] = useState('');
  
  const aiMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAIClick = (type: AIActionType) => {
    onAIAction(type);
    setShowAIMenu(false);
  };

  const handleCustomAction = () => {
    if (!customInput.trim()) return;
    onAIAction(AIActionType.CUSTOM, customInput);
    setShowAIMenu(false);
    setCustomInput('');
  };

  // AI Menu Hover Logic
  const handleAIMenuEnter = () => {
    if (aiMenuTimeoutRef.current) {
      clearTimeout(aiMenuTimeoutRef.current);
      aiMenuTimeoutRef.current = null;
    }
  };

  const handleAIMenuLeave = () => {
    aiMenuTimeoutRef.current = setTimeout(() => {
      setShowAIMenu(false);
    }, 300); 
  };

  // Line Menu Hover Logic
  const handleLineMenuEnter = () => {
    if (lineMenuTimeoutRef.current) {
      clearTimeout(lineMenuTimeoutRef.current);
      lineMenuTimeoutRef.current = null;
    }
  };

  const handleLineMenuLeave = () => {
    lineMenuTimeoutRef.current = setTimeout(() => {
      setShowLineMenu(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (aiMenuTimeoutRef.current) clearTimeout(aiMenuTimeoutRef.current);
      if (lineMenuTimeoutRef.current) clearTimeout(lineMenuTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-white border-b border-slate-200 sticky top-0 z-10">
      
      {/* History Controls - Flat Buttons */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
        <button 
          onClick={onUndo} 
          disabled={!canUndo}
          className={`p-2 rounded-md transition-colors duration-200 ${
            !canUndo 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
          }`} 
          title="撤销 (Ctrl+Z)"
        >
          <Undo size={16} strokeWidth={2.5} />
        </button>
        <button 
          onClick={onRedo} 
          disabled={!canRedo}
          className={`p-2 rounded-md transition-colors duration-200 ${
            !canRedo 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
          }`} 
          title="重做 (Ctrl+Y)"
        >
          <Redo size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Layout & Edit Controls */}
      <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-1">
        <button 
          onClick={onFormat} 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors duration-200"
          title="自动给段落开头空两格"
        >
          <AlignLeft size={16} strokeWidth={2.5} />
          <span>一键排版</span>
        </button>

        <div className="flex items-center gap-1 ml-2 group relative border-r border-slate-200 pr-4 mr-1">
           <Type size={16} className="text-slate-400 group-hover:text-slate-600" strokeWidth={2.5} />
           <select 
             value={fontSize} 
             onChange={(e) => onFontSizeChange(Number(e.target.value))}
             className="appearance-none bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer pl-1 pr-6 py-1 hover:bg-slate-100 rounded-md transition-colors"
             title="字体大小"
           >
             <option value={14}>14px</option>
             <option value={16}>16px</option>
             <option value={18}>18px</option>
             <option value={20}>20px</option>
             <option value={24}>24px</option>
           </select>
           <ChevronDown size={12} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 cursor-pointer hover:text-slate-900 select-none ml-1 border-r border-slate-200 pr-4 mr-1">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => onSyncScrollChange(e.target.checked)}
            className="w-4 h-4 rounded-sm border-slate-300 text-slate-600 focus:ring-0 cursor-pointer accent-slate-600"
          />
          <span>同步滚动</span>
        </label>

        {/* Clear Empty Lines with Dropdown */}
        <div 
          className="relative mr-1"
          onMouseEnter={handleLineMenuEnter}
          onMouseLeave={handleLineMenuLeave}
        >
          <button
            onClick={() => setShowLineMenu(!showLineMenu)}
            className={`p-2 rounded-md transition-colors duration-200 ${showLineMenu ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
            title="空行清理工具"
          >
            <FoldVertical size={16} strokeWidth={2.5} />
          </button>

          {showLineMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 py-1">
              <button 
                onClick={() => { onRemoveEmptyLines('smart'); setShowLineMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
              >
                <AlignVerticalJustifyCenter size={14} />
                <span>保留段落 (3行变2行)</span>
              </button>
              <button 
                onClick={() => { onRemoveEmptyLines('aggressive'); setShowLineMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors"
              >
                <ListCollapse size={14} />
                <span>清除所有 (变紧凑)</span>
              </button>
            </div>
          )}
        </div>

        {/* Copy / Paste Buttons */}
        <button
          onClick={onCopy}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors duration-200"
          title="复制全文"
        >
          <Copy size={16} strokeWidth={2.5} />
        </button>

        <button
          onClick={onPaste}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors duration-200 mr-1"
          title="粘贴全文"
        >
          <ClipboardPaste size={16} strokeWidth={2.5} />
        </button>

        {/* Search Toggle */}
        <button 
          onClick={onToggleSearch}
          className={`p-2 rounded-md transition-colors duration-200 ml-1 ${
            showSearch 
              ? 'bg-slate-200 text-slate-900' 
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="查找与替换 (Ctrl+F)"
        >
          <Search size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* AI Controls - Circular Icon Button with Hover Animation */}
      <div 
        className="relative ml-auto"
        onMouseEnter={handleAIMenuEnter}
        onMouseLeave={handleAIMenuLeave}
      >
        <button 
          onClick={() => setShowAIMenu(!showAIMenu)}
          disabled={isProcessingAI}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border-2 ${
            isProcessingAI 
              ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-wait' 
              : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95'
          }`}
          title="AI 助手"
        >
          {isProcessingAI ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} strokeWidth={2.5} />}
        </button>

        {showAIMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Custom Input Area - Designed */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block pl-1">输入自定义任务</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomAction()}
                  placeholder="例如：写一首关于春天的诗..."
                  className="w-full text-sm bg-white border border-slate-200 rounded-full px-3 py-2 pr-8 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 text-slate-700 placeholder:text-slate-400 transition-all shadow-sm"
                  autoFocus
                />
                <button 
                  onClick={handleCustomAction}
                  className="absolute right-1.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  title="发送"
                >
                  <Send size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="py-1">
              <button onClick={() => handleAIClick(AIActionType.FIX_GRAMMAR)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors">
                <Check size={14} strokeWidth={2} className="text-green-500" /> 语法纠错
              </button>
              <button onClick={() => handleAIClick(AIActionType.SUMMARIZE)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors pl-10">
                内容总结
              </button>
               <button onClick={() => handleAIClick(AIActionType.EXPAND)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors pl-10">
                内容扩写
              </button>
              <button onClick={() => handleAIClick(AIActionType.REDUCE_AI_FLAVOR)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors pl-10">
                降 AI 味
              </button>
              <div className="border-t border-slate-100 my-1 mx-4"></div>
              <button onClick={() => handleAIClick(AIActionType.TRANSLATE)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors pl-10">
                中英翻译专家
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;