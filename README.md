# Moe Markdown Editor (萌编辑器)

**Moe Markdown Editor** 是一款基于 React 和 Google Gemini AI 构建的现代化、轻量级 Markdown 编辑器。它采用了现代化的 **左侧侧边栏布局**，结合了专业的写作工具、差异对比功能与强大的 AI 辅助，旨在提供流畅、智能且极具设计感的写作体验。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-8E75B2.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg)

## ✨ 核心功能

### 🎨 沉浸式界面设计
*   **极简侧边栏导航**：全新的左侧导航栏设计，采用素雅的灰阶配色 (`slate-200`)，直观切换视图模式与设置，释放顶部空间。
*   **专业编辑器视图**：
    *   **行号显示 (Gutter)**：编辑器左侧显示行号，支持与文本区精准同步滚动。
    *   **字体大小调节**：工具栏直接调整字号 (14px - 24px)，适应不同视力需求。
    *   **同步滚动**：编辑区与预览区、行号栏三方同步，长文档阅读体验极佳。

### 📝 强大的编辑与排版工具
*   **智能空行清理**：提供两种模式清理文档中的多余空行：
    *   **保留段落**：智能合并连续 3 个以上空行为标准 Markdown 分段（保留 1 个空行）。
    *   **清除所有**：强力模式，将所有松散结构压缩为紧凑布局（慎用）。
*   **一键排版**：专为中文优化，支持段落首行自动缩进（空两格）。
*   **高级查找与替换**：支持全字匹配、区分大小写及正则表达式搜索，支持逐个或全部替换。

### ⚖️ 双文档与差异对比
*   **双屏编辑**：支持左/右两个独立文档同时编辑，方便笔记对照或翻译工作。
*   **差异对比模式 (Diff Mode)**：在双文档视图下，可开启“对比模式”。系统将自动高亮显示当前文档相对于另一份文档的**新增或差异内容**，视觉化呈现版本变动。

### 🤖 深度 AI 辅助 (Powered by Gemini 2.5)
集成 Google Gemini 2.5 Flash 模型，提供深度集成的写作辅助：
*   **智能指令栏 (Ctrl/Cmd + K)**：在光标处唤出悬浮指令栏，快速执行 AI 操作。
*   **上下文理解**：支持选中特定文本进行处理，或对全文进行操作。
*   **自定义提示词 (System Prompts)**：在设置面板中，你可以完全自定义每个 AI 功能（如总结、润色）的系统提示词，打造专属你的 AI 助手。
*   **多样的预设能力**：
    *   **📖 语法纠错**：修正错别字与语病。
    *   **📝 内容总结**：快速提取文章核心摘要。
    *   **✨ 内容扩写**：基于现有内容进行逻辑延伸与丰富。
    *   **🎭 降 AI 味**：优化文本，使其更具“人味”，增加文学性与自然感。
    *   **🌐 中英翻译**：专业级的双语互译。
*   **AI 结果面板**：
    *   **字数统计**：实时显示生成结果的词数与字符数。
    *   **历史记录**：自动保存 AI 生成记录，随时回溯。
    *   **重新生成**：对结果不满意？一键让 AI 重新思考。

## 📂 项目结构与文件说明

本项目采用无构建工具（No-Build）的现代化 ES Module 架构，直接利用浏览器原生能力运行 React。

```text
.
├── index.html              # 入口文件，包含 Import Maps (React, diff, lucide等) 和 Tailwind 配置
├── index.tsx               # React 应用挂载点
├── App.tsx                 # 主应用组件，包含侧边栏布局、双文档状态管理
├── metadata.json           # 项目元数据配置
├── types.ts                # TypeScript 类型定义（枚举、接口）
├── services/
│   └── geminiService.ts    # Google Gemini API 调用封装
├── components/
│   ├── EditorPane.tsx      # 核心编辑器：集成行号、Diff层、快捷键、AI交互逻辑
│   ├── Toolbar.tsx         # 顶部工具栏：排版、空行清理、字体设置入口
│   ├── MarkdownPreview.tsx # 基于 React-Markdown 的渲染组件
│   ├── AIResultPanel.tsx   # AI 结果展示、字数统计、历史记录与操作面板
│   ├── SearchPanel.tsx     # 查找与替换悬浮面板
│   └── SettingsPanel.tsx   # 设置面板：配置 API Key 与 自定义 Prompt
└── prompts.ts              # AI 提示词（Prompt）默认配置与构建逻辑
```

### 关键技术实现
1.  **EditorPane.tsx**：
    *   实现了三层结构：底层 **Diff Layer** (用于显示差异高亮) -> 中层 **Textarea** (透明背景，用于输入) -> 左侧 **Gutter** (行号)。
    *   利用 `diff` 库的 `diffChars` 算法实时计算并渲染差异。
2.  **App.tsx**：
    *   采用 Flex 布局实现侧边栏 (`<aside>`) 与主内容区的自适应。
    *   管理 `doc1` 和 `doc2` 的状态提升，以便在双文档间共享数据进行 Diff 计算。

## 🚀 部署指南

### 前置要求
你需要一个 Google Gemini API Key。请访问 [Google AI Studio](https://aistudiocdn.com/google/genai) 获取。

### 1. 本地运行 (Local Development)

由于本项目使用 ES Modules 和 CDN 依赖，不需要复杂的 `npm install` 构建过程，但需要一个静态文件服务器来避免跨域（CORS）问题。

**步骤：**

1.  **克隆或下载代码**到本地文件夹。
2.  **配置 API Key**：
    *   打开 `services/geminiService.ts`。
    *   找到 `const apiKey = process.env.API_KEY;`。
    *   **注意**：在纯本地静态服务器环境下，`process.env` 不存在。你需要手动将其替换为你的真实 Key：
        ```typescript
        const apiKey = "YOUR_ACTUAL_GEMINI_API_KEY";
        ```
    *   *或者直接在网页端的“设置”面板中输入 Key，Key 会保存在浏览器的 LocalStorage 中。*
3.  **启动服务**：
    *   如果你安装了 Node.js，可以在项目根目录运行：
        ```bash
        npx serve .
        ```
    *   或者使用 VS Code 的 "Live Server" 插件右键 `index.html` 打开。
4.  **访问**：打开浏览器访问 `http://localhost:3000`（或对应端口）。

### 2. 在线部署 (Online Deployment)

推荐使用 Vercel 或 Netlify 进行静态托管。

**以 Vercel 为例：**

1.  将代码推送到 GitHub 仓库。
2.  在 Vercel 中导入该仓库。
3.  **重要**：由于本项目是纯静态站点，通常构建命令为空。
4.  **环境变量**：在 Vercel 项目设置中，添加环境变量 `API_KEY`，填入你的 Google Gemini API Key。

## ⌨️ 快捷键指南

| 快捷键 | 功能 | 说明 |
| :--- | :--- | :--- |
| **Ctrl/Cmd + K** | AI 指令栏 | 唤出悬浮输入框，使用预设或自定义 AI 指令 |
| **Ctrl/Cmd + F** | 查找 | 打开搜索面板 |
| **Ctrl/Cmd + H** | 替换 | 打开查找与替换面板 |
| **Ctrl/Cmd + Z** | 撤销 | 撤销上一步编辑 |
| **Ctrl/Cmd + Y** | 重做 | 恢复撤销的操作 |
| **Esc** | 关闭 | 关闭 AI 面板、搜索框或指令栏 |

## 🛠️ 技术栈

*   **Framework**: React 19
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS (CDN Runtime)
*   **AI SDK**: @google/genai
*   **Icons**: Lucide React
*   **Markdown**: React Markdown, Remark GFM
*   **Utilities**: diff (用于文本对比)

---

Made with ❤️ by Moe Markdown Studio