export type BlockType = 'paragraph' | 'checklist' | 'bullet' | 'numbered' | 'heading';

export interface EditorBlock {
  id: string;          // Unique identifier (useful for React keys)
  type: BlockType;     // The type of block
  content: string;     // The text content (without the markdown prefix)
  checked?: boolean;   // For checklist type
  number?: number;     // For numbered list type
}
