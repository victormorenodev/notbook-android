/**
 * Represents inline styling or metadata applied to a text node (e.g. bold, italic).
 */
export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Single node in the Tiptap/ProseMirror content tree (paragraph, heading, list item, etc.).
 */
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

/**
 * Root structure of a note's rich-text document.
 */
export interface PageContent {
  type: 'doc';
  content: TiptapNode[];
}

/**
 * Local sync status flag for offline-first synchronization.
 */
export type SyncStatus =
  | 'synced'
  | 'pending_create'
  | 'pending_update'
  | 'pending_delete';

/**
 * Core domain model representing a Note (Page).
 */
export interface Page {
  id: string;
  title: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status?: SyncStatus;
}

/**
 * Payload required to create a new page.
 */
export interface CreatePageInput {
  id?: string;
  title: string;
  content?: string;
  position?: number;
}

/**
 * Payload for updating an existing page.
 */
export interface UpdatePageInput {
  title?: string;
  content?: string;
  position?: number;
}

/**
 * Single item in a batch reorder operation.
 */
export interface ReorderItem {
  id: string;
  position: number;
}

/**
 * Payload for batch reordering pages.
 */
export interface ReorderPagesInput {
  items: ReorderItem[];
}
