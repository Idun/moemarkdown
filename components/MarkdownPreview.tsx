import React, { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

const MarkdownPreview = forwardRef<HTMLDivElement, MarkdownPreviewProps>(({ content, className, style, onScroll }, ref) => {
  return (
    <div 
      ref={ref}
      className={`prose prose-slate prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline max-w-none p-6 bg-white overflow-y-auto ${className}`}
      style={style}
      onScroll={onScroll}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;