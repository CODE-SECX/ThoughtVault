import React, { useState } from 'react';
import { Copy, FileText, Code } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { htmlToPlainText, formatHtmlForCopy } from '../utils/htmlUtils';

interface SmartCopyButtonProps {
  content: string;
  type?: string;
  className?: string;
  showDropdown?: boolean;
}

const SmartCopyButton: React.FC<SmartCopyButtonProps> = ({
  content,
  type = 'content',
  className = '',
  showDropdown = true
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const copyToClipboard = async (text: string, format: 'plain' | 'html') => {
    try {
      const textToCopy = format === 'plain' ? htmlToPlainText(text) : formatHtmlForCopy(text);
      await navigator.clipboard.writeText(textToCopy);
      
      const formatLabel = format === 'plain' ? 'Plain text' : 'HTML';
      toast.success(`${type} copied as ${formatLabel.toLowerCase()}!`);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Single copy button (defaults to plain text)
  if (!showDropdown) {
    return (
      <button
        onClick={() => copyToClipboard(content, 'plain')}
        className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors ${className}`}
        title="Copy as plain text"
      >
        <Copy className="w-4 h-4" />
      </button>
    );
  }

  // Dropdown copy button with options
  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors ${className}`}
        title="Copy options"
      >
        <Copy className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => copyToClipboard(content, 'plain')}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Copy as Plain Text
              </button>
              <button
                onClick={() => copyToClipboard(content, 'html')}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Code className="w-4 h-4 mr-2" />
                Copy as HTML
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartCopyButton;
