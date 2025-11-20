import React from 'react';

export enum EditorMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT' // Edit on left, Preview on right (within a single pane context)
}

export enum LayoutMode {
  SINGLE = 'SINGLE', // Focus on one document
  DUAL = 'DUAL'      // Two documents side-by-side
}

export interface DocumentState {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  fontSize: number; // New property for font size preference
}

export enum AIActionType {
  SUMMARIZE = 'SUMMARIZE',
  FIX_GRAMMAR = 'FIX_GRAMMAR',
  EXPAND = 'EXPAND',
  REDUCE_AI_FLAVOR = 'REDUCE_AI_FLAVOR',
  TRANSLATE = 'TRANSLATE',
  CUSTOM = 'CUSTOM'
}

export interface MarkdownToolbarAction {
  label: string;
  icon: React.ReactNode;
  syntaxWrapper?: { prefix: string; suffix: string };
  blockPrefix?: string;
}

export interface AIHistoryItem {
  id: string;
  timestamp: number;
  actionType: AIActionType;
  content: string;
}

export interface PromptsConfig {
  [AIActionType.SUMMARIZE]?: string;
  [AIActionType.FIX_GRAMMAR]?: string;
  [AIActionType.EXPAND]?: string;
  [AIActionType.REDUCE_AI_FLAVOR]?: string;
  [AIActionType.TRANSLATE]?: string;
}

export interface AppSettings {
  apiKey: string;
  prompts: PromptsConfig;
}