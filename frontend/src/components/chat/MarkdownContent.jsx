import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { markedHighlight } from 'marked-highlight';

const MarkdownContent = ({ content }) => {
  const [html, setHtml] = useState('');
  
  useEffect(() => {
    // Configure marked with syntax highlighting
    marked.use(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        }
      })
    );
    
    // Set renderer options
    marked.setOptions({
      gfm: true,
      breaks: true,
      sanitize: false
    });
    
    // Initialize DOMPurify with allowed tags and attributes
    DOMPurify.addHook('afterSanitizeAttributes', function(node) {
      // Add target="_blank" to all links
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    // Parse Markdown to HTML
    const rawHtml = marked(content);
    
    // Sanitize HTML
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['code', 'pre', 'span'], // Allow code blocks
      ADD_ATTR: ['class'] // Allow classes for syntax highlighting
    });
    
    setHtml(cleanHtml);
  }, [content]);
  
  return (
    <div 
      className="markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownContent;