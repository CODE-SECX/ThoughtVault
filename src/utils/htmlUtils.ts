/**
 * Utility functions for HTML processing
 */

/**
 * Converts HTML content to plain text by removing HTML tags and formatting
 * @param html - The HTML string to convert
 * @returns Plain text without HTML tags
 */
export const htmlToPlainText = (html: string): string => {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Handle specific HTML elements for better text formatting
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      

      
      let text = '';
      
      // Process child nodes
      for (const child of Array.from(element.childNodes)) {
        text += processNode(child);
      }
      
      // Add appropriate spacing for different elements
      switch (tagName) {
        case 'br':
          return '\n';
        case 'p':
        case 'div':
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return text + '\n\n';
        case 'blockquote':
          return '> ' + text.trim() + '\n\n';
        case 'li':
          return '• ' + text.trim() + '\n';
        case 'ul':
        case 'ol':
          return text + '\n';
        case 'strong':
        case 'b':
          return `*${text}*`;
        case 'em':
        case 'i':
          return `_${text}_`;
        case 'code':
          return `\`${text}\``;
        case 'pre':
          return `\`\`\`\n${text}\n\`\`\`\n`;
        default:
          return text;
      }
    }
    
    return '';
  };
  
  const plainText = processNode(tempDiv);
  
  // Clean up extra whitespace and line breaks
  return plainText
    .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double
    .replace(/^\s+|\s+$/g, '') // Trim whitespace from start and end
    .replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
};

/**
 * Formats HTML content for better readability when copied as HTML
 * @param html - The HTML string to format
 * @returns Formatted HTML string
 */
export const formatHtmlForCopy = (html: string): string => {
  // For now, return as-is, but this could be extended for better formatting
  return html;
};
