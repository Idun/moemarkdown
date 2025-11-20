import React, { useState, useEffect } from 'react';
import { X, Copy, Check, CheckCheck, RotateCw, Clock, History, Loader2 } from 'lucide-react';
import { AIHistoryItem } from '../types';

interface AIResultPanelProps {
  content: string;
  onClose: () => void;
  onInsert: (finalContent: string) => void;
  onRegenerate: () => void;
  isLoading: boolean;
  history: AIHistoryItem[];
  title?: string;
  actionLabel?: string;
  fontSize: number;
}

const AIResultPanel: React.FC<AIResultPanelProps> = ({ 
  content: initialContent, 
  onClose, 
  onInsert,
  onRegenerate,
  isLoading,
  history,
  title = "AI 助手结果",
  actionLabel = "插入",
  fontSize
}) => {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Update local content when initialContent prop changes (e.g. after regeneration)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleCopy = async () => {
    if (isLoading) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Stats calculation
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                showHistory 
                  ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-100 ring-offset-1' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="查看历史记录"
            >
              <Clock size={14} strokeWidth={2.5} />
              历史
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copied ? "已复制" : "复制"}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Content - Editable */}
          <div className="flex-1 relative bg-slate-50 p-0 flex flex-col">
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                <Loader2 size={40} className="animate-spin text-blue-500" />
                <span className="text-sm font-medium text-slate-500">AI 正在重新思考...</span>
              </div>
            )}
            
            <div className="flex-1 relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                style={{ 
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.6'
                }}
                className="w-full h-full bg-white border-none p-6 pb-12 resize-none focus:outline-none text-slate-800 font-mono disabled:opacity-50"
                placeholder="AI 生成的内容将显示在这里，您可以直接编辑..."
                spellCheck={false}
              />
              
              {/* Stats Footer inside textarea container */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-2 bg-white/95 border-t border-slate-100 text-xs font-medium text-slate-400 flex justify-end gap-4 pointer-events-none backdrop-blur-sm">
                <span>{wordCount} 词</span>
                <span>{charCount} 字符</span>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right-10 duration-200 shadow-inner shrink-0">
              <div className="p-4 border-b border-slate-200 bg-slate-100/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <History size={14} />
                  已插入的历史记录
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    暂无历史记录
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setContent(item.content)}
                      disabled={isLoading}
                      className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {item.actionType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed group-hover:text-slate-900">
                        {item.content}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="text-sm text-slate-500 font-medium hidden md:block">
               您可以先编辑上方内容，确认无误后再插入文档。
             </div>
          </div>
          
          <div className="flex gap-3">
             <button 
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="使用相同的设置重新生成"
            >
              <RotateCw size={16} strokeWidth={2.5} className={isLoading ? "animate-spin" : ""} />
              重新生成
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-1"></div>

            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              onClick={() => onInsert(content)}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
            >
              <Check size={18} strokeWidth={2.5} />
              {actionLabel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIResultPanel;