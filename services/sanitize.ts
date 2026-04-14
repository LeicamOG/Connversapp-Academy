import DOMPurify from 'dompurify';

/**
 * Sanitizes user-supplied HTML before it is rendered via dangerouslySetInnerHTML.
 *
 * Allows a conservative set of tags/attributes suitable for rich-text course
 * descriptions and lesson content. Strips <script>, inline event handlers,
 * and javascript: URLs.
 */
const ALLOWED_TAGS = [
    'p', 'br', 'hr', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup', 'mark',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = [
    'href', 'target', 'rel',
    'src', 'alt', 'title', 'width', 'height',
    'class', 'style',
    'colspan', 'rowspan',
];

export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        // Force all <a> links to open safely
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Convenience helper that returns a prop object ready to spread into a JSX
 * element:
 *   <div {...safeHtml(content)} />
 */
export function safeHtml(dirty: string | null | undefined) {
    return { dangerouslySetInnerHTML: { __html: sanitizeHtml(dirty) } };
}
