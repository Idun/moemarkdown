import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Key, MessageSquareText, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { AIActionType, AppSettings } from '../types';
import { DEFAULT_PROMPTS } from '../prompts';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const PROMPT_LABELS: Record<string, string> = {
  [AIActionType.FIX_GRAMMAR]: '语法纠错',
  [AIActionType.SUMMARIZE]: '内容总结',
  [AIActionType.EXPAND]: '内容扩写',
  [AIActionType.REDUCE_AI_FLAVOR]: '降 AI 味',
  [AIActionType.TRANSLATE]: '中英翻译专家',
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'api' | 'prompts'>('api');

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleResetPrompt = (type: AIActionType) => {
    setLocalSettings(prev => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [type]: DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS]
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Window - Increased width */}
      <div className="relative w-full max-w-5xl h-[700px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
        
        {/* Left Sidebar Navigation - Narrow & Compact */}
        <div className="w-24 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 items-center py-6">
           <div className="mb-8 text-slate-900">
               <SettingsIcon size={24} strokeWidth={2} />
           </div>

          <nav className="flex-1 w-full px-2 space-y-3 flex flex-col items-center">
             <button
               onClick={() => setActiveTab('api')}
               className={`w-full flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all ${
                 activeTab === 'api' 
                   ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                   : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
               }`}
             >
               <Key size={20} strokeWidth={activeTab === 'api' ? 2.5 : 2} />
               <span className="text-xs font-bold">API配置</span>
             </button>
             <button
               onClick={() => setActiveTab('prompts')}
               className={`w-full flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all ${
                 activeTab === 'prompts' 
                   ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                   : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
               }`}
             >
               <Sparkles size={20} strokeWidth={activeTab === 'prompts' ? 2.5 : 2} />
               <span className="text-xs font-bold">AI提示词</span>
             </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          
          {/* Header */}
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'api' ? 'API 连接设置' : '自定义 AI 提示词'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-8">
            
            {activeTab === 'api' && (
              <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Google Gemini API Key</label>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    为了使用 AI 辅助功能，您需要配置 Gemini API Key。密钥将仅存储在您的本地浏览器中，我们不会将其上传至任何服务器。
                  </p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={localSettings.apiKey}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full pl-10 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono shadow-sm"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <a href="https://aistudiocdn.com/google/genai" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">
                      没有 Key？点击这里免费获取 &rarr;
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-blue-50 text-blue-700 p-5 rounded-xl border border-blue-100 text-sm leading-relaxed flex gap-3 shadow-sm">
                   <MessageSquareText className="shrink-0 mt-0.5" size={18} />
                   <div>
                     <strong className="block mb-1 font-bold">关于系统提示词 (System Prompts)</strong>
                     您可以根据自己的写作风格微调各个 AI 功能的指令。AI 会将这些提示词作为上下文处理您的请求。如果不满意，随时可以点击“重置”恢复默认。
                   </div>
                 </div>
                 
                 <div className="grid gap-8">
                   {[
                     AIActionType.FIX_GRAMMAR,
                     AIActionType.SUMMARIZE,
                     AIActionType.EXPAND,
                     AIActionType.REDUCE_AI_FLAVOR,
                     AIActionType.TRANSLATE
                   ].map((type) => {
                     const actionType = type as AIActionType;
                     const currentVal = localSettings.prompts[actionType] || DEFAULT_PROMPTS[actionType as keyof typeof DEFAULT_PROMPTS] || '';
                     
                     return (
                      <div key={type} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                          <span className="font-bold text-sm text-slate-700">
                            {PROMPT_LABELS[type]}
                          </span>
                          <button 
                            onClick={() => handleResetPrompt(actionType)}
                            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-blue-200 transition-colors shadow-sm font-medium"
                            title="恢复默认提示词"
                          >
                            <RotateCcw size={12} />
                            重置
                          </button>
                        </div>
                        <div className="p-5">
                          <textarea
                            value={currentVal}
                            onChange={(e) => setLocalSettings(prev => ({
                              ...prev,
                              prompts: { ...prev.prompts, [actionType]: e.target.value }
                            }))}
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all resize-y leading-relaxed text-slate-700 font-mono shadow-inner"
                            placeholder="输入自定义系统指令..."
                            spellCheck={false}
                          />
                        </div>
                      </div>
                     );
                   })}
                 </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 shrink-0">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Save size={16} strokeWidth={2.5} />
              保存更改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;