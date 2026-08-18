import { PageContent, TiptapNode } from '@/types/note';

/**
 * Generates an empty Tiptap document JSON string.
 */
export function createEmptyDocJson(): string {
  const emptyDoc: PageContent = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
  return JSON.stringify(emptyDoc);
}

/**
 * Extracts formatted text from a single Tiptap node.
 */
function extractNodeText(node: TiptapNode): string {
  if (node.text !== undefined) {
    return node.text;
  }

  if (node.type === 'taskItem') {
    const isChecked = Boolean(node.attrs?.checked);
    const innerText = node.content?.map(extractNodeText).join(' ') ?? '';
    return isChecked ? `[x] ${innerText}` : `[ ] ${innerText}`;
  }

  if (node.type === 'heading') {
    const level = (node.attrs?.level as number) || 2;
    const prefix = level > 1 ? '## ' : '# ';
    const innerText = node.content?.map(extractNodeText).join(' ') ?? '';
    return `${prefix}${innerText}`;
  }

  if (!node.content || node.content.length === 0) {
    return '';
  }

  return node.content.map(extractNodeText).join('\n');
}

/**
 * Parses a Tiptap JSON string and returns formatted multiline editor text.
 */
export function extractPlainText(jsonContent: string): string {
  if (!jsonContent) return '';
  try {
    const parsed = JSON.parse(jsonContent) as PageContent;
    if (!parsed.content || !Array.isArray(parsed.content)) return '';
    return parsed.content.map(extractNodeText).join('\n');
  } catch {
    return jsonContent;
  }
}

/**
 * Converts a single text line into its corresponding Tiptap AST node.
 */
function parseLineToNode(line: string): TiptapNode {
  const trimmed = line.trim();
  if (!trimmed) {
    return { type: 'paragraph' };
  }

  // Checklist item
  if (/^(\-\s+)?\[( |x|X)\]\s+/.test(trimmed)) {
    const isChecked = /^(\-\s+)?\[(x|X)\]\s+/.test(trimmed);
    const textContent = trimmed.replace(/^(\-\s+)?\[( |x|X)\]\s+/, '');
    return {
      type: 'taskItem',
      attrs: { checked: isChecked },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: textContent }] }],
    };
  }

  // Heading
  if (/^#{1,3}\s+/.test(trimmed)) {
    const textContent = trimmed.replace(/^#{1,3}\s+/, '');
    return {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: textContent }],
    };
  }

  // Bullet list item
  if (/^(\•|\-|\*)\s+/.test(trimmed)) {
    const textContent = trimmed.replace(/^(\•|\-|\*)\s+/, '');
    return {
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: textContent }] }],
    };
  }

  // Standard paragraph
  return {
    type: 'paragraph',
    content: [{ type: 'text', text: line }],
  };
}

/**
 * Converts formatted text lines into a standard Tiptap JSON tree.
 */
export function textToTiptapDoc(text: string): string {
  const lines = text.split('\n');
  const nodes = lines.map(parseLineToNode);

  const doc: PageContent = {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [{ type: 'paragraph' }],
  };

  return JSON.stringify(doc);
}
