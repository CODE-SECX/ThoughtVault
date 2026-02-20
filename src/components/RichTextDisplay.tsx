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
  return (
    <div 
      className={`rich-text-display prose prose-slate max-w-none text-slate-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontFamily: 'inherit',
        fontSize: '15px',
        lineHeight: '1.75',
        letterSpacing: '0.3px'
      }}
    />
  );
};

export default RichTextDisplay;
