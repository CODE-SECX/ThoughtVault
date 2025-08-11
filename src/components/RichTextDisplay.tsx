import React from 'react';
import 'react-quill/dist/quill.snow.css';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  content,
  className = ''
}) => {
  // Handle cases where content might be escaped HTML
  const processContent = (htmlContent: string) => {
    if (!htmlContent) return '';
    
    // If the content contains escaped HTML entities, decode them
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const decodedContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Check if the decoded content looks like HTML (contains tags)
    const hasHtmlTags = /<[^>]*>/g.test(decodedContent);
    
    // If it has HTML tags after decoding, use the decoded version
    // Otherwise, use the original content
    return hasHtmlTags ? decodedContent : htmlContent;
  };

  const processedContent = processContent(content);

  return (
    <>
      <div 
        className={`rich-text-display ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
        style={{
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.5',
          color: 'inherit'
        }}
      />
      <style>{`
        .rich-text-display {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .rich-text-display p {
          margin-bottom: 0.75rem;
          margin-top: 0;
        }
        
        .rich-text-display p:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-display h1, 
        .rich-text-display h2, 
        .rich-text-display h3, 
        .rich-text-display h4, 
        .rich-text-display h5, 
        .rich-text-display h6 {
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: inherit;
        }
        
        .rich-text-display h1:first-child,
        .rich-text-display h2:first-child,
        .rich-text-display h3:first-child,
        .rich-text-display h4:first-child,
        .rich-text-display h5:first-child,
        .rich-text-display h6:first-child {
          margin-top: 0;
        }
        
        .rich-text-display h1 { font-size: 1.5rem; }
        .rich-text-display h2 { font-size: 1.375rem; }
        .rich-text-display h3 { font-size: 1.25rem; }
        .rich-text-display h4 { font-size: 1.125rem; }
        .rich-text-display h5 { font-size: 1rem; }
        .rich-text-display h6 { font-size: 0.875rem; }
        
        .rich-text-display strong {
          font-weight: 600;
          color: inherit;
        }
        
        .rich-text-display em {
          font-style: italic;
        }
        
        .rich-text-display u {
          text-decoration: underline;
        }
        
        .rich-text-display s {
          text-decoration: line-through;
        }
        
        .rich-text-display ul, 
        .rich-text-display ol {
          margin-bottom: 0.75rem;
          margin-top: 0;
          padding-left: 1.5rem;
        }
        
        .rich-text-display ul:last-child,
        .rich-text-display ol:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-display li {
          margin-bottom: 0.25rem;
        }
        
        .rich-text-display li:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-display blockquote {
          border-left: 4px solid #8b5cf6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #64748b;
          background-color: rgba(139, 92, 246, 0.05);
          padding: 0.75rem 1rem;
          border-radius: 0.25rem;
        }
        
        .rich-text-display blockquote:first-child {
          margin-top: 0;
        }
        
        .rich-text-display blockquote:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-display code {
          background-color: #f1f5f9;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          color: #1e293b;
        }
        
        .rich-text-display pre {
          background-color: #f1f5f9;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
          border: 1px solid #e2e8f0;
        }
        
        .rich-text-display pre:first-child {
          margin-top: 0;
        }
        
        .rich-text-display pre:last-child {
          margin-bottom: 0;
        }
        
        .rich-text-display pre code {
          background: none;
          padding: 0;
          font-size: inherit;
          color: inherit;
        }
        
        .rich-text-display a {
          color: #8b5cf6;
          text-decoration: underline;
          text-decoration-color: rgba(139, 92, 246, 0.4);
          transition: all 0.2s ease;
        }
        
        .rich-text-display a:hover {
          color: #7c3aed;
          text-decoration-color: #7c3aed;
        }
        
        /* Handle text alignment */
        .rich-text-display .ql-align-center {
          text-align: center;
        }
        
        .rich-text-display .ql-align-right {
          text-align: right;
        }
        
        .rich-text-display .ql-align-justify {
          text-align: justify;
        }
        
        /* Handle indentation */
        .rich-text-display .ql-indent-1 { margin-left: 3rem; }
        .rich-text-display .ql-indent-2 { margin-left: 6rem; }
        .rich-text-display .ql-indent-3 { margin-left: 9rem; }
        .rich-text-display .ql-indent-4 { margin-left: 12rem; }
        .rich-text-display .ql-indent-5 { margin-left: 15rem; }
        .rich-text-display .ql-indent-6 { margin-left: 18rem; }
        .rich-text-display .ql-indent-7 { margin-left: 21rem; }
        .rich-text-display .ql-indent-8 { margin-left: 24rem; }
      `}</style>
    </>
  );
};

export default RichTextDisplay;
