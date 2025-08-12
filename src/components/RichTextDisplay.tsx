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
      className={`rich-text-display prose prose-slate max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: '1.5'
      }}
    />
  );
};

export default RichTextDisplay;
