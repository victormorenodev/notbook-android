import { PageContent, TiptapNode } from '@/types/note';

/**
 * Generates a serialized JSON string representing an empty Tiptap document.
 *
 * @example
 * const defaultContent = createEmptyDocJson();
 * // => '{"type":"doc","content":[{"type":"paragraph"}]}'
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
  if (node.text) {
    return node.text;
  }
  if (!node.content || node.content.length === 0) {
    return '';
  }
  return node.content.map(extractNodeText).join(' ');
}

/**
 * Parses a Tiptap JSON string and returns a flat, human-readable text preview.
 *
 * @example
 * const preview = extractPlainText('{"type":"doc","content":[...]}');
 * // => "Remember to buy milk"
 */
export function extractPlainText(jsonContent: string): string {
  if (!jsonContent.trim()) {
    return '';
  }
  try {
    const parsed = JSON.parse(jsonContent) as PageContent;
    if (!parsed.content || !Array.isArray(parsed.content)) {
      return '';
    }
    return parsed.content.map(extractNodeText).join('\n').trim();
  } catch {
    return '';
  }
}
