import React, { useState, useRef, useEffect } from 'react';
import { FileText, Settings, BookOpen, CheckCircle2, Loader2, ScanEye, Square, Columns2 } from 'lucide-react';
import EditorPane from './components/EditorPane';
import SettingsPanel from './components/SettingsPanel';
import { DocumentState, LayoutMode, AppSettings } from './types';

const INITIAL_DOC_1 = `# 欢迎使用 Moe 

这是一个基于 React 和 Tailwind 构建的 **Markdown 编辑器**。

## 主要功能
- **双屏编辑**: 可同时编辑两份文档。
- **实时预览**: 修改即见效果。
- **AI 辅助**: 使用 Gemini 模型进行总结或语法修复。
- **一键排版**: 自动为段落添加首行缩进。

## 试一试！
选中一段文字，点击 *AI 助手* 按钮。
`;

const INITIAL_DOC_2 = `# 笔记 / 翻译

使用这个副屏面板来：
1. 阅读文档时做笔记
2. 翻译左侧的内容
3. 对比不同版本

| 功能 | 状态 |
| :--- | :--- |
| 编辑 | ✅ |
| 预览 | ✅ |
| 分屏 | ✅ |
`;

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: process.env.API_KEY || '',
  prompts: {}
};

const App: React.FC = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.SINGLE);
  const [activeDocId, setActiveDocId] = useState<string>('doc1');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  
  // Diff/Comparison State
  const [showDiff, setShowDiff] = useState(false);

  // Auto-save simulation state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [doc1, setDoc1] = useState<DocumentState>({
    id: 'doc1',
    title: '说明文档.md',
    content: INITIAL_DOC_1,
    lastModified: Date.now(),
    fontSize: 16
  });

  const [doc2, setDoc2] = useState<DocumentState>({
    id: 'doc2',
    title: '草稿本.md',
    content: INITIAL_DOC_2,
    lastModified: Date.now(),
    fontSize: 16
  });

  // Load settings from localStorage
  useEffect(() => {
    const storedSettings = localStorage.getItem('moe-editor-settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    setIsSettingsLoaded(true);
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('moe-editor-settings', JSON.stringify(newSettings));
  };

  // Helper to update content based on which doc is changing
  const updateDoc = (id: string, newContent: string, newFontSize?: number) => {
    const updater = (prev: DocumentState) => ({ 
      ...prev, 
      content: newContent, 
      lastModified: Date.now(),
      fontSize: newFontSize !== undefined ? newFontSize : prev.fontSize
    });

    if (id === 'doc1') {
      setDoc1(updater);
    } else {
      setDoc2(updater);
    }

    // Trigger Auto-save visual
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
    }, 800);
  };

  // Reset diff mode when switching to single layout
  useEffect(() => {
    if (layoutMode === LayoutMode.SINGLE) {
      setShowDiff(false);
    }
  }, [layoutMode]);

  if (!isSettingsLoaded) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 shrink-0 z-30">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-600">
            <FileText size={20} strokeWidth={3} />
          </div>
        </div>

        {/* Layout Mode Toggles */}
        <div className="flex-1 flex flex-col gap-4 w-full px-3">
           <button
             onClick={() => setLayoutMode(LayoutMode.SINGLE)}
             className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
               layoutMode === LayoutMode.SINGLE 
                 ? 'bg-slate-200 text-slate-900' 
                 : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
             }`}
             title="单文档模式"
           >
             <Square size={20} strokeWidth={2.5} />
           </button>
           
           <button
             onClick={() => setLayoutMode(LayoutMode.DUAL)}
             className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
               layoutMode === LayoutMode.DUAL 
                 ? 'bg-slate-200 text-slate-900' 
                 : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
             }`}
             title="双文档模式"
           >
             <Columns2 size={20} strokeWidth={2.5} />
           </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 w-full px-3 mt-auto">
           <button 
            onClick={() => setShowSettings(true)}
            className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="设置"
          >
            <Settings size={20} strokeWidth={2} />
          </button>
          <a 
            href="https://github.com/your-repo" 
            target="_blank" 
            rel="noreferrer"
            className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="文档"
          >
            <BookOpen size={20} strokeWidth={2} />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Simplified Header */}
        <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">
              Moe Studio
            </h1>

            {/* Diff Toggle (Only in Dual Mode) */}
            {layoutMode === LayoutMode.DUAL && (
               <>
                <div className="h-4 w-px bg-slate-200"></div>
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                    showDiff 
                      ? 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-100' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="高亮显示两个文档的不同之处"
                >
                  <ScanEye size={14} strokeWidth={2.5} />
                  {showDiff ? '对比模式：开启' : '对比模式'}
                </button>
               </>
            )}
          </div>

          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={12} className="animate-spin text-blue-500" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>已自动保存</span>
              </>
            )}
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-hidden relative flex p-2 bg-slate-50">
          {layoutMode === LayoutMode.SINGLE ? (
            <div className="flex-1 h-full">
              <div className="h-full w-full shadow-sm rounded-xl overflow-hidden border border-slate-200">
                <EditorPane 
                  document={doc1} 
                  onChange={(content, fontSize) => updateDoc('doc1', content, fontSize)}
                  isActive={true}
                  onActivate={() => {}}
                  settings={settings}
                  // In single mode, we don't show diff, but we pass logic just in case
                  showDiff={false}
                  comparisonContent=""
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 h-full flex gap-2">
              <div className="flex-1 h-full shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white">
                <EditorPane 
                  document={doc1} 
                  onChange={(content, fontSize) => updateDoc('doc1', content, fontSize)}
                  isActive={activeDocId === 'doc1'}
                  onActivate={() => setActiveDocId('doc1')}
                  label="左文档"
                  settings={settings}
                  showDiff={showDiff}
                  comparisonContent={doc2.content}
                />
              </div>
              <div className="flex-1 h-full shadow-sm rounded-xl overflow-hidden border border-slate-200 bg-white">
                <EditorPane 
                  document={doc2} 
                  onChange={(content, fontSize) => updateDoc('doc2', content, fontSize)}
                  isActive={activeDocId === 'doc2'}
                  onActivate={() => setActiveDocId('doc2')}
                  label="右文档"
                  settings={settings}
                  showDiff={showDiff}
                  comparisonContent={doc1.content}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;