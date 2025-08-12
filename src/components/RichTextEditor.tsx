import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  className = ''
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'blockquote', 'code-block'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          marginBottom: '20px'
        }}
      />
      <style>{`
        .rich-text-editor .ql-editor {
          min-height: 150px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #cbd5e1;
          border-left: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          border-bottom: none;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        
        .rich-text-editor .ql-container {
          border-bottom: 1px solid #cbd5e1;
          border-left: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
        }
        
        .rich-text-editor .ql-editor:focus {
          outline: none;
        }
        
        .rich-text-editor .ql-toolbar:focus-within + .ql-container,
        .rich-text-editor .ql-container:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        
        .rich-text-editor .ql-editor p {
          margin-bottom: 0.5rem;
        }
        
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          margin-bottom: 0.5rem;
        }
        
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #8b5cf6;
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          font-style: italic;
          color: #64748b;
        }
        
        .rich-text-editor .ql-editor code {
          background-color: #f1f5f9;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        
        .rich-text-editor .ql-editor pre {
          background-color: #f1f5f9;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
