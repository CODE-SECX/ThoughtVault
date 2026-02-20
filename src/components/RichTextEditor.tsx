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
          marginBottom: '0px'
        }}
      />
      <style>{`
        .rich-text-editor .ql-container {
          font-family: inherit;
          font-size: 15px;
          line-height: 1.75;
          letter-spacing: 0.3px;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 160px;
          padding: 16px;
          background: white;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #cbd5e1;
          font-style: italic;
          font-size: 14px;
        }
        
        .rich-text-editor .ql-toolbar {
          border: 1px solid #e2e8f0;
          border-bottom: none;
          border-radius: 0.5rem 0.5rem 0 0;
          background: #f8fafc;
        }
        
        .rich-text-editor .ql-container {
          border: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
        }
        
        .rich-text-editor .ql-editor:focus {
          outline: none;
        }
        
        .rich-text-editor .ql-toolbar:focus-within + .ql-container,
        .rich-text-editor .ql-container:focus-within {
          border-color: #a78bfa;
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
        }
        
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button.ql-active,
        .rich-text-editor .ql-toolbar select:hover,
        .rich-text-editor .ql-toolbar select.ql-active {
          color: #8b5cf6;
        }
        
        .rich-text-editor .ql-editor p {
          margin-bottom: 12px;
        }
        
        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3,
        .rich-text-editor .ql-editor h4,
        .rich-text-editor .ql-editor h5,
        .rich-text-editor .ql-editor h6 {
          color: #1e293b;
          margin-bottom: 12px;
          margin-top: 16px;
          font-weight: 600;
        }
        
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          margin-bottom: 12px;
          margin-left: 20px;
        }
        
        .rich-text-editor .ql-editor li {
          margin-bottom: 8px;
        }
        
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #a78bfa;
          padding-left: 16px;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 12px;
          font-style: italic;
          color: #64748b;
        }
        
        .rich-text-editor .ql-editor code {
          background-color: #f1f5f9;
          color: #be185d;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.875em;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .rich-text-editor .ql-editor pre {
          background-color: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 12px;
        }
        
        .rich-text-editor .ql-editor pre.ql-syntax {
          background-color: #1e293b;
          color: #e2e8f0;
        }
        
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #64748b;
        }
        
        .rich-text-editor .ql-snow .ql-fill {
          fill: #64748b;
        }
        
        .rich-text-editor .ql-snow .ql-picker-label {
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
