import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Eye, Edit3, Columns, Loader2, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { DocumentState, EditorMode, AIActionType, AIHistoryItem, AppSettings } from '../types';
import Toolbar from './Toolbar';
import MarkdownPreview from './MarkdownPreview';
import SearchPanel from './SearchPanel';
import AIResultPanel from './AIResultPanel';
import { processTextWithAI } from '../services/geminiService';
import { diffChars } from 'diff';

interface EditorPaneProps {
  document: DocumentState;
  onChange: (content: string, fontSize?: number) => void;
  isActive: boolean;
  onActivate: () => void;
  label?: string;
  settings: AppSettings;
  showDiff: boolean;
  comparisonContent: string;
}

// Helper to apply Chinese paragraph indentation
const applyIndentation = (text: string): string => {
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    
    // Skip Markdown syntax: Headers, Lists, Blockquotes, Code blocks, Tables, Images
    if (/^(#|>|-|\*|\+|\d+\.|`|\||!\[)/.test(trimmed)) {
      return line;
    }
    
    // Check if already indented with full-width spaces or standard spaces
    if (/^(\u3000\u3000|\s{4})/.test(line)) {
      return line;
    }

    // Add two full-width spaces for Chinese indentation
    return `\u3000\u3000${trimmed}`;
  });
  return processedLines.join('\n');
};

interface ToastState {
  show: boolean;
  message: string;
  type: 'loading' | 'success' | 'error';
}

// State to hold AI result context
interface AIContextState {
  result: string;
  originalSelection: { start: number; end: number };
  originalTextLength: number;
  actionType: AIActionType;
  textToProcess: string;
  customPrompt?: string;
}

const EditorPane: React.FC<EditorPaneProps> = ({ 
  document, 
  onChange, 
  isActive, 
  onActivate, 
  label, 
  settings,
  showDiff,
  comparisonContent
}) => {
  const [mode, setMode] = useState<EditorMode>(EditorMode.SPLIT);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [syncScroll, setSyncScroll] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  
  // AI Result Panel State
  const [aiContext, setAiContext] = useState<AIContextState | null>(null);
  const [aiHistory, setAiHistory] = useState<AIHistoryItem[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Inline AI Command Palette (Ctrl+K)
  const [showInlineAI, setShowInlineAI] = useState(false);
  const [inlineAIInput, setInlineAIInput] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const diffLayerRef = useRef<HTMLDivElement>(null); // Ref for diff layer
  const previewRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  
  // Scroll synchronization refs
  const scrollingRef = useRef<'editor' | 'preview' | null>(null);
  const scrollTimeoutRef = useRef<any>(null);

  // History State for Undo/Redo
  const [history, setHistory] = useState<string[]>([document.content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  useEffect(() => {
    if (document.content !== history[historyIndex]) {
       setHistory([document.content]);
       setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);

  // Focus inline input when shown
  useEffect(() => {
    if (showInlineAI && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [showInlineAI]);

  // Compute line numbers
  const lineCount = useMemo(() => {
    return document.content.split('\n').length;
  }, [document.content]);

  // Compute Diff Elements
  const diffElements = useMemo(() => {
    if (!showDiff || !comparisonContent) return null;
    
    // Compare "Comparison Doc" (Old) -> "Current Doc" (New)
    // We want to highlight what is present in Current Doc that differs from Comparison Doc.
    // Added = True means it exists in Current but not in Comparison.
    // Removed = True means it exists in Comparison but not in Current (we can't show text that isn't there, so we ignore removed for the editor view)
    const changes = diffChars(comparisonContent, document.content);
    
    return changes.map((part, index) => {
      // If it was removed from the other doc, it means it's NOT in this doc, so we skip rendering it
      if (part.removed) return null;

      return (
        <span 
          key={index} 
          className={part.added ? "bg-yellow-200/60 rounded-sm" : ""}
        >
          {part.value}
        </span>
      );
    });
  }, [showDiff, comparisonContent, document.content]);

  // Calculate matches using useMemo
  const matches = useMemo(() => {
    if (!searchTerm) return [];
    try {
      let flags = 'g';
      if (!caseSensitive) flags += 'i';
      
      let regexSource = searchTerm;
      if (!useRegex) {
        // Escape special characters
        regexSource = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      if (wholeWord && !useRegex) {
        regexSource = `\\b${regexSource}\\b`;
      }

      const regex = new RegExp(regexSource, flags);
      const results = [];
      let match;
      while ((match = regex.exec(document.content)) !== null) {
        results.push({ start: match.index, end: match.index + match[0].length });
      }
      return results;
    } catch (e) {
      return []; // Invalid regex or empty
    }
  }, [document.content, searchTerm, caseSensitive, wholeWord, useRegex]);

  // Reset match index when matches change
  useEffect(() => {
    if (matches.length > 0) {
      if (currentMatchIndex === -1 || currentMatchIndex >= matches.length) {
        setCurrentMatchIndex(0);
      }
    } else {
      setCurrentMatchIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.length]);

  const navigateToMatch = (index: number) => {
    if (!matches[index] || !textareaRef.current) return;
    const match = matches[index];
    
    setCurrentMatchIndex(index);
    
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(match.start, match.end);
    
    // Approximate scroll to center logic
    const textBefore = document.content.substring(0, match.start);
    const linesBefore = textBefore.split('\n').length;
    const lineHeight = 24; // Estimate
    const scrollPos = Math.max(0, (linesBefore - 10) * lineHeight); 
    textareaRef.current.scrollTop = scrollPos;
  };

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const next = (currentMatchIndex + 1) % matches.length;
    navigateToMatch(next);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prev = (currentMatchIndex - 1 + matches.length) % matches.length;
    navigateToMatch(prev);
  };

  const handleReplace = () => {
    if (matches.length === 0 || currentMatchIndex === -1) return;
    const match = matches[currentMatchIndex];
    const before = document.content.substring(0, match.start);
    const after = document.content.substring(match.end);
    const newContent = before + replaceTerm + after;
    
    handleContentChange(newContent);
  };

  const handleReplaceAll = () => {
    if (!searchTerm) return;
    try {
      let flags = 'g';
      if (!caseSensitive) flags += 'i';
      let regexSource = searchTerm;
      if (!useRegex) regexSource = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord && !useRegex) regexSource = `\\b${regexSource}\\b`;
      
      const regex = new RegExp(regexSource, flags);
      const newContent = document.content.replace(regex, replaceTerm);
      handleContentChange(newContent);
    } catch (e) { console.error(e); }
  };

  const handleScroll = (source: HTMLElement, target: HTMLElement | null, caller: 'editor' | 'preview') => {
    // Sync Gutter if scrolling editor
    if (caller === 'editor' && gutterRef.current) {
      gutterRef.current.scrollTop = source.scrollTop;
    }

    // Sync Diff Layer if scrolling editor
    if (caller === 'editor' && diffLayerRef.current) {
      diffLayerRef.current.scrollTop = source.scrollTop;
    }

    if (!syncScroll || !target || mode !== EditorMode.SPLIT) return;

    if (scrollingRef.current && scrollingRef.current !== caller) return;

    scrollingRef.current = caller;

    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
    
    if (!isNaN(percentage)) {
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      scrollingRef.current = null;
    }, 50);
  };

  const handleContentChange = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newContent);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // Function to restore selection to textarea
  const restoreSelection = () => {
    if (textareaRef.current && selectionRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(selectionRef.current.start, selectionRef.current.end);
    } else {
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      handleRedo();
    }
    
    // Search Shortcuts (Toggle Logic)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      if (showSearch) {
        setShowSearch(false);
        textareaRef.current?.focus();
      } else {
        setShowSearch(true);
        setShowInlineAI(false); // Close AI if open
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      if (!showSearch || !showReplace) {
        setShowSearch(true);
        setShowReplace(true);
        setShowInlineAI(false); // Close AI if open
      } else {
        setShowSearch(false);
        textareaRef.current?.focus();
      }
    }

    // Inline AI Shortcut (Ctrl+K)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (showInlineAI) {
        setShowInlineAI(false);
        restoreSelection();
      } else {
        // Capture selection before opening Inline AI
        if (textareaRef.current) {
          selectionRef.current = {
            start: textareaRef.current.selectionStart,
            end: textareaRef.current.selectionEnd
          };
        }
        setShowInlineAI(true);
        setShowSearch(false); // Close Search if open
      }
    }
    
    // Close Overlays on Escape
    if (e.key === 'Escape') {
      if (showSearch) {
        e.preventDefault();
        e.stopPropagation();
        setShowSearch(false);
        textareaRef.current?.focus();
      }
      if (showInlineAI) {
        e.preventDefault();
        e.stopPropagation();
        setShowInlineAI(false);
        restoreSelection();
      }
    }
  };

  const handleFormat = () => {
    const newContent = applyIndentation(document.content);
    handleContentChange(newContent);
  };

  const handleRemoveEmptyLines = (mode: 'smart' | 'aggressive') => {
    let content = document.content;
    // 1. Remove spaces on lines that are otherwise empty (trim end of lines)
    content = content.split('\n').map(line => line.trimEnd()).join('\n');
    
    let newContent = content;

    if (mode === 'smart') {
       // 2. Smart: Collapse 3 or more newlines into 2 (Standard Markdown paragraph break)
       newContent = content.replace(/\n{3,}/g, '\n\n');
    } else {
       // 3. Aggressive: Collapse 2 or more newlines into 2 (Standard Markdown Paragraph)
       newContent = content.replace(/\n{2,}/g, '\n\n');
    }

    if (newContent !== document.content) {
      handleContentChange(newContent);
      showToastMsg(mode === 'smart' ? "已规范段落间距" : "已标准化所有段落间距", "success");
    } else {
      showToastMsg("文档已很整洁", "success");
    }
  };

  const handleFontSizeChange = (size: number) => {
    onChange(document.content, size);
  };

  const showToastMsg = (msg: string, type: 'loading' | 'success' | 'error') => {
    setToast({ show: true, message: msg, type });
    if (type !== 'loading') {
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Copy Handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.content);
      showToastMsg("已复制全文", "success");
    } catch (err) {
      showToastMsg("复制失败", "error");
    }
  };

  // Paste Handler
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleContentChange(text);
        showToastMsg("已粘贴全文", "success");
      }
    } catch (err) {
      showToastMsg("粘贴失败，请检查浏览器权限", "error");
    }
  };

  // 1. Trigger AI Processing
  const handleAIAction = async (type: AIActionType, customPrompt?: string) => {
    const text = textareaRef.current?.value || document.content;
    if (!text.trim()) return;

    // Determine selection range
    let start = 0;
    let end = 0;

    // If Inline AI is open (or was just open), use the selection captured when it was opened
    if (showInlineAI && selectionRef.current) {
      start = selectionRef.current.start;
      end = selectionRef.current.end;
    } else if (textareaRef.current) {
      start = textareaRef.current.selectionStart;
      end = textareaRef.current.selectionEnd;
    }

    const hasSelection = end > start;
    const textToProcess = hasSelection ? text.substring(start, end) : text;

    // Close inline input if open
    setShowInlineAI(false);
    setInlineAIInput('');

    setIsAIProcessing(true);
    showToastMsg("AI 正在思考中...", "loading");
    
    try {
      const result = await processTextWithAI(
        textToProcess, 
        type, 
        settings.apiKey,
        settings.prompts,
        customPrompt
      );
      
      setAiContext({
        result,
        originalSelection: { start, end },
        originalTextLength: text.length,
        actionType: type,
        textToProcess,
        customPrompt
      });

      showToastMsg("处理完成", "success");
    } catch (e: any) {
      console.error(e);
      showToastMsg(e.message || "AI 处理失败", "error");
    } finally {
      setIsAIProcessing(false);
    }
  };

  // New: Handle Regeneration
  const handleRegenerate = async () => {
    if (!aiContext) return;
    setIsRegenerating(true);
    try {
      const result = await processTextWithAI(
        aiContext.textToProcess, 
        aiContext.actionType,
        settings.apiKey,
        settings.prompts, 
        aiContext.customPrompt
      );
      setAiContext(prev => prev ? ({ ...prev, result }) : null);
    } catch (e) {
      showToastMsg("重新生成失败", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  // 2. Apply AI Result from Panel
  const handleApplyAIResult = (finalContent: string) => {
    if (!aiContext) return;

    // Add to History
    const historyItem: AIHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      actionType: aiContext.actionType,
      content: finalContent
    };
    setAiHistory(prev => [historyItem, ...prev]);

    const { start, end } = aiContext.originalSelection;
    const hasSelection = end > start;
    const currentText = document.content;
    
    let newContent = "";
    
    if (hasSelection) {
      newContent = currentText.substring(0, start) + finalContent + currentText.substring(end);
    } else {
      if (aiContext.actionType === AIActionType.FIX_GRAMMAR) {
         newContent = finalContent;
      } else {
         newContent = currentText + '\n\n' + finalContent;
      }
    }

    handleContentChange(newContent);
    setAiContext(null);
  };

  // Handle Inline AI Submit
  const handleInlineAISubmit = () => {
    if (!inlineAIInput.trim()) return;
    handleAIAction(AIActionType.CUSTOM, inlineAIInput);
  };

  // Determine dynamic label for the panel button
  const getAIActionLabel = () => {
    if (!aiContext) return "插入";
    const hasSelection = aiContext.originalSelection.end > aiContext.originalSelection.start;
    
    if (hasSelection) return "替换选中内容";
    if (aiContext.actionType === AIActionType.FIX_GRAMMAR) return "替换全文";
    return "插入到文末";
  };

  return (
    <div 
      className={`flex flex-col h-full bg-white overflow-hidden border-2 transition-colors duration-100 relative ${
        isActive ? 'border-blue-600 z-10' : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
    >
      {/* AI Result Modal Panel */}
      {aiContext && (
        <AIResultPanel 
          content={aiContext.result}
          onClose={() => setAiContext(null)}
          onInsert={handleApplyAIResult}
          onRegenerate={handleRegenerate}
          isLoading={isRegenerating}
          history={aiHistory}
          actionLabel={getAIActionLabel()}
          fontSize={document.fontSize}
        />
      )}

      {/* AI Status Toast */}
      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 pointer-events-none">
          <div className="flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-xl shadow-slate-200/50">
            {toast.type === 'loading' && <Loader2 size={16} className="animate-spin text-blue-400" />}
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className={`flex items-center justify-between px-4 py-2 border-b border-slate-200 select-none transition-colors duration-100 ${isActive ? 'bg-slate-50/50' : 'bg-white'}`}>
        <div className="font-bold text-slate-800 flex items-center gap-3 text-sm">
          {label && <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider">{label}</span>}
          <span className="truncate max-w-[200px]">{document.title}</span>
        </div>
        <div className="flex items-center gap-1">
           <button 
            onClick={() => setMode(EditorMode.EDIT)}
            className={`p-1.5 rounded-md transition-colors duration-200 ${mode === EditorMode.EDIT ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
            title="仅编辑"
          >
            <Edit3 size={16} strokeWidth={2} />
          </button>
          <button 
            onClick={() => setMode(EditorMode.SPLIT)}
            className={`p-1.5 rounded-md transition-colors duration-200 ${mode === EditorMode.SPLIT ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
            title="分屏视图"
          >
            <Columns size={16} strokeWidth={2} />
          </button>
          <button 
            onClick={() => setMode(EditorMode.PREVIEW)}
            className={`p-1.5 rounded-md transition-colors duration-200 ${mode === EditorMode.PREVIEW ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
            title="仅预览"
          >
            <Eye size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {mode !== EditorMode.PREVIEW && (
        <Toolbar 
          onFormat={handleFormat} 
          onAIAction={handleAIAction}
          isProcessingAI={isAIProcessing}
          fontSize={document.fontSize}
          onFontSizeChange={handleFontSizeChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          syncScroll={syncScroll}
          onSyncScrollChange={setSyncScroll}
          showSearch={showSearch}
          onToggleSearch={() => {
            if (showSearch) {
              setShowSearch(false);
              textareaRef.current?.focus();
            } else {
              setShowSearch(true);
              setShowInlineAI(false);
            }
          }}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onRemoveEmptyLines={handleRemoveEmptyLines}
        />
      )}

      {/* Inline AI Command Palette (Ctrl+K) */}
      {showInlineAI && mode !== EditorMode.PREVIEW && (
         <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-[500px] bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-200 font-sans ring-1 ring-black/5 overflow-hidden">
            <div className="p-3 flex items-center gap-3 border-b border-slate-100 bg-slate-50/50">
               <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={16} strokeWidth={2.5} />
               </div>
               <input 
                  ref={inlineInputRef}
                  type="text" 
                  value={inlineAIInput}
                  onChange={(e) => setInlineAIInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInlineAISubmit();
                    if (e.key === 'Escape') {
                       setShowInlineAI(false);
                       restoreSelection();
                    }
                  }}
                  placeholder="告诉 AI 你想做什么..."
                  className="flex-1 bg-transparent border-none outline-none text-base text-slate-800 placeholder:text-slate-400 h-full"
               />
               <button onClick={() => { setShowInlineAI(false); restoreSelection(); }} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
               </button>
            </div>
            <div className="p-2 bg-white">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">快捷指令</div>
               <div className="space-y-1">
                  <button onClick={() => handleAIAction(AIActionType.FIX_GRAMMAR)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between group transition-colors">
                     <span>📖 语法纠错</span>
                     <span className="text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Enter</span>
                  </button>
                  <button onClick={() => handleAIAction(AIActionType.SUMMARIZE)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between group transition-colors">
                     <span>📝 内容总结</span>
                     <span className="text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Enter</span>
                  </button>
                  <button onClick={() => handleAIAction(AIActionType.EXPAND)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between group transition-colors">
                     <span>✨ 内容扩写</span>
                     <span className="text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Enter</span>
                  </button>
                  <button onClick={() => handleAIAction(AIActionType.REDUCE_AI_FLAVOR)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between group transition-colors">
                     <span>🎭 降 AI 味</span>
                     <span className="text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Enter</span>
                  </button>
                  <button onClick={() => handleAIAction(AIActionType.TRANSLATE)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between group transition-colors">
                     <span>🌐 中英翻译</span>
                     <span className="text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Enter</span>
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Search Panel Integration */}
      {showSearch && mode !== EditorMode.PREVIEW && (
        <SearchPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          replaceTerm={replaceTerm}
          onReplaceChange={setReplaceTerm}
          matchCount={matches.length}
          currentMatchIndex={currentMatchIndex}
          onNext={handleNextMatch}
          onPrevious={handlePrevMatch}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={() => {
            setShowSearch(false);
            textareaRef.current?.focus();
          }}
          caseSensitive={caseSensitive}
          setCaseSensitive={setCaseSensitive}
          wholeWord={wholeWord}
          setWholeWord={setWholeWord}
          useRegex={useRegex}
          setUseRegex={setUseRegex}
          showReplace={showReplace}
          toggleReplace={() => setShowReplace(!showReplace)}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden flex bg-white">
        {(mode === EditorMode.EDIT || mode === EditorMode.SPLIT) && (
          <div className={`h-full relative flex ${mode === EditorMode.SPLIT ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
            {/* Paragraph Sequence Gutter */}
            <div 
              ref={gutterRef}
              className="w-12 flex-shrink-0 bg-slate-50 border-r border-slate-200 text-right font-mono text-slate-300 select-none overflow-hidden pt-6 pb-6 pr-3"
              style={{ 
                fontSize: `${document.fontSize}px`,
                lineHeight: '1.625' // Matches leading-relaxed
              }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editor Container */}
            <div className="flex-1 h-full relative">
              {/* Diff Background Layer */}
              {showDiff && (
                <div 
                  ref={diffLayerRef}
                  className="absolute inset-0 p-6 pl-4 font-mono leading-relaxed whitespace-pre-wrap break-words pointer-events-none text-transparent overflow-hidden z-0"
                  style={{ 
                    fontSize: `${document.fontSize}px`,
                  }}
                >
                  {diffElements}
                </div>
              )}

              <textarea
                ref={textareaRef}
                className={`w-full h-full p-6 pl-4 resize-none focus:outline-none font-mono text-slate-800 leading-relaxed selection:bg-slate-200 selection:text-slate-900 relative z-10 ${showDiff ? 'bg-transparent' : 'bg-white'}`}
                style={{ fontSize: `${document.fontSize}px` }}
                value={document.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="在此输入 Markdown 内容..."
                spellCheck={false}
                onScroll={(e) => handleScroll(e.target as HTMLElement, previewRef.current, 'editor')}
              />
            </div>
          </div>
        )}
        
        {(mode === EditorMode.PREVIEW || mode === EditorMode.SPLIT) && (
          <div className={`h-full bg-white ${mode === EditorMode.SPLIT ? 'w-1/2' : 'w-full'}`}>
            <MarkdownPreview 
              ref={previewRef}
              content={document.content} 
              className="h-full w-full"
              style={{ fontSize: `${document.fontSize}px` }}
              onScroll={(e) => handleScroll(e.target as HTMLElement, textareaRef.current, 'preview')}
            />
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="px-4 py-1.5 bg-white border-t border-slate-200 text-xs font-medium text-slate-400 flex justify-between uppercase tracking-wider">
        <span>{document.content.length} 字符</span>
        <span>{Math.ceil(document.content.split(/\s+/).length)} 词数</span>
      </div>
    </div>
  );
};

export default EditorPane;