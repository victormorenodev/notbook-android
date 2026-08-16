import { PageContent, TiptapNode } from '@/types/note';

/**
 * Generates a serialized JSON string representing an empty Tiptap document.
 */
export function createEmptyDocJson(): string {
  const emptyDoc: PageContent = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
  return JSON.stringify(emptyDoc);
}

/**
 * Extracts plain text from a recursive Tiptap node tree.
 */
function extractNodeText(node: TiptapNode): string {
  if (node.text !== undefined) {
    return node.text;
  }
  if (!node.content || node.content.length === 0) {
    return '';
  }
  return node.content.map(extractNodeText).join(' ');
}

/**
 * Parses a Tiptap JSON string and returns a multiline text string.
 * Preserves empty paragraphs and line breaks without stripping trailing newlines.
 */
export function extractPlainText(jsonContent: string): string {
  if (!jsonContent) {
    return '';
  }
  try {
    const parsed = JSON.parse(jsonContent) as PageContent;
    if (!parsed.content || !Array.isArray(parsed.content)) {
      return '';
    }
    return parsed.content.map(extractNodeText).join('\n');
  } catch {
    return jsonContent;
  }
}

/**
 * Converts a plain multiline text string into a structured Tiptap JSON document string.
 */
export function textToTiptapDoc(text: string): string {
  const lines = text.split('\n');
  const nodes: TiptapNode[] = lines.map((line) => {
    if (line.length === 0) {
      return { type: 'paragraph' };
    }
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    };
  });

  const doc: PageContent = {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [{ type: 'paragraph' }],
  };

  return JSON.stringify(doc);
}
