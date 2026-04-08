import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { htmlToPlainText } from '../utils/htmlUtils';

interface SmartCopyButtonProps {
  content: string;
  label?: string;
  className?: string;
}

/**
 * Copies HTML content as clean plain text — always strips tags.
 */
const SmartCopyButton: React.FC<SmartCopyButtonProps> = ({
  content,
  label,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const plainText = htmlToPlainText(content);

    try {
      await navigator.clipboard.writeText(plainText);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = plainText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn-icon ${className}`}
      aria-label={label ? `Copy ${label}` : 'Copy as plain text'}
      title="Copy as plain text"
      style={{ color: copied ? 'var(--color-success)' : undefined }}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
};

export default SmartCopyButton;
