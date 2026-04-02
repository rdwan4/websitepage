const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'EM',
  'S',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'H2',
  'H3',
  'SPAN',
]);

const ALLOWED_COLORS = [
  '#f8fafc',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
];

const ALLOWED_FONT_FAMILIES = [
  'var(--app-font-sans)',
  'var(--app-font-serif)',
  '"Noto Naskh Arabic", "Amiri", serif',
  '"Amiri", "Noto Naskh Arabic", serif',
  '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
];

const isAllowedFontSize = (value: string) => /^([89]|[1-8]\d|9[0-6])px$/.test(value);

const escapePlainTextToHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const isLikelyRichTextHtml = (value?: string | null) =>
  Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));

export const stripHtmlToPlainText = (value?: string | null) =>
  (value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const sanitizeInlineStyle = (styleValue: string) => {
  const entries = styleValue
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  const safeRules: string[] = [];

  entries.forEach((entry) => {
    const [rawName, ...rawValueParts] = entry.split(':');
    const name = rawName?.trim().toLowerCase();
    const value = rawValueParts.join(':').trim();

    if (!name || !value) return;

    if (name === 'color') {
      const normalizedColor = value.toLowerCase();
      if (ALLOWED_COLORS.includes(normalizedColor)) {
        safeRules.push(`color: ${normalizedColor}`);
      }
    }

    if (name === 'font-family') {
      if (ALLOWED_FONT_FAMILIES.includes(value)) {
        safeRules.push(`font-family: ${value}`);
      }
    }

    if (name === 'font-size') {
      if (isAllowedFontSize(value)) {
        safeRules.push(`font-size: ${value}`);
      }
    }
  });

  return safeRules.join('; ');
};

export const sanitizePostHtml = (value?: string | null) => {
  if (!value) return '';
  if (typeof window === 'undefined') return value;

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(value, 'text/html');

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return;

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    const element = node as HTMLElement;

    if (!ALLOWED_TAGS.has(element.tagName)) {
      const fragment = doc.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
      Array.from(fragment.childNodes).forEach(sanitizeNode);
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name !== 'style') {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.hasAttribute('style')) {
      const safeStyle = sanitizeInlineStyle(element.getAttribute('style') || '');
      if (safeStyle) {
        element.setAttribute('style', safeStyle);
      } else {
        element.removeAttribute('style');
      }
    }

    Array.from(element.childNodes).forEach(sanitizeNode);
  };

  Array.from(doc.body.childNodes).forEach(sanitizeNode);
  return doc.body.innerHTML;
};

const decodeHtmlEntities = (value: string) => {
  if (typeof window === 'undefined') return value;

  const textarea = window.document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

export const normalizeEditorHtml = (value?: string | null) => {
  const rawValue = (value || '').trim();
  if (!rawValue) return '';

  const decodedValue = decodeHtmlEntities(rawValue);
  const candidate = decodedValue.includes('<') || decodedValue.includes('>') ? decodedValue : rawValue;

  if (isLikelyRichTextHtml(candidate)) {
    return sanitizePostHtml(candidate);
  }

  return candidate
    .split(/\n{2,}/)
    .map((block) => `<p>${escapePlainTextToHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
};

export const splitCombinedPostValue = (value?: string | null) => {
  const source = value || '';
  const parts = source.split(/\n\s*-----\s*\n/);

  if (parts.length <= 1) {
    return { primary: source, secondary: '' };
  }

  return {
    primary: parts[0].trim(),
    secondary: parts.slice(1).join('\n\n-----\n\n').trim(),
  };
};

export const splitCombinedTextValue = (value?: string | null) => {
  const source = (value || '').trim();
  const separator = ' / ';
  const separatorIndex = source.indexOf(separator);

  if (separatorIndex === -1) {
    return { primary: source, secondary: '' };
  }

  return {
    primary: source.slice(0, separatorIndex).trim(),
    secondary: source.slice(separatorIndex + separator.length).trim(),
  };
};
