import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { BlockType, EditorBlock } from '@/types/block';

// Regex patterns to identify block types from text
const CHECKLIST_REGEX = /^(-\s+)?\[([ xX])\]\s?(.*)/;
const HEADING_REGEX = /^##\s+(.*)/;
const BULLET_REGEX = /^[•\-*]\s+(.*)/;
const NUMBERED_REGEX = /^(\d+)\.\s+(.*)/;

/**
 * Parses a raw multiline string into an array of structured EditorBlocks.
 * This is crucial for migrating existing flat-text notes into the block editor.
 */
export function textToBlocks(text: string): EditorBlock[] {
  const lines = text.split('\n');
  
  return lines.map((line) => {
    // 1. Check for checklist
    const checkMatch = line.match(CHECKLIST_REGEX);
    if (checkMatch) {
      return {
        id: uuidv4(),
        type: 'checklist',
        checked: checkMatch[2] !== ' ',
        content: checkMatch[3] || '',
      };
    }

    // 2. Check for heading
    const headingMatch = line.match(HEADING_REGEX);
    if (headingMatch) {
      return {
        id: uuidv4(),
        type: 'heading',
        content: headingMatch[1] || '',
      };
    }

    // 3. Check for bullet
    const bulletMatch = line.match(BULLET_REGEX);
    if (bulletMatch) {
      return {
        id: uuidv4(),
        type: 'bullet',
        content: bulletMatch[1] || '',
      };
    }

    // 4. Check for numbered list
    const numMatch = line.match(NUMBERED_REGEX);
    if (numMatch) {
      return {
        id: uuidv4(),
        type: 'numbered',
        number: parseInt(numMatch[1], 10),
        content: numMatch[2] || '',
      };
    }

    // 5. Default to plain paragraph
    return {
      id: uuidv4(),
      type: 'paragraph',
      content: line,
    };
  });
}

/**
 * Serializes an array of EditorBlocks back into a flat markdown-like string.
 * This ensures compatibility with the existing database and Tiptap serializer.
 */
export function blocksToText(blocks: EditorBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'checklist':
          return `[${block.checked ? 'x' : ' '}] ${block.content}`;
        case 'heading':
          return `## ${block.content}`;
        case 'bullet':
          return `• ${block.content}`;
        case 'numbered':
          return `${block.number}. ${block.content}`;
        case 'paragraph':
        default:
          return block.content;
      }
    })
    .join('\n');
}
