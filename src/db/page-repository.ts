import { getDatabase } from '@/db/client';
import { CreatePageInput, Page, ReorderItem, UpdatePageInput } from '@/types/note';
import { generateEntityId } from '@/utils/id';
import { createEmptyDocJson } from '@/utils/tiptap';

/**
 * Fetches all non-deleted pages ordered by position and last update time.
 *
 * @example
 * const pages = await getLocalPages();
 */
export async function getLocalPages(): Promise<Page[]> {
  const database = await getDatabase();
  const query = `
    SELECT id, title, content, position, created_at, updated_at, deleted_at, sync_status
    FROM pages
    WHERE deleted_at IS NULL
    ORDER BY position ASC, updated_at DESC
  `;
  return database.getAllAsync<Page>(query);
}

/**
 * Fetches a single active page by its UUID.
 *
 * @example
 * const page = await getLocalPageById('uuid-123');
 */
export async function getLocalPageById(id: string): Promise<Page | null> {
  const database = await getDatabase();
  const query = `
    SELECT id, title, content, position, created_at, updated_at, deleted_at, sync_status
    FROM pages
    WHERE id = ? AND deleted_at IS NULL
  `;
  return database.getFirstAsync<Page>(query, [id]);
}

/**
 * Inserts a new page with a client-generated UUID and returns the created record.
 *
 * @example
 * const newPage = await insertLocalPage({ title: 'My Note' });
 */
export async function insertLocalPage(input: CreatePageInput): Promise<Page> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const page: Page = {
    id: input.id ?? generateEntityId(),
    title: input.title.trim(),
    content: input.content ?? createEmptyDocJson(),
    position: input.position ?? 0,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    sync_status: 'pending_create',
  };

  const query = `
    INSERT INTO pages (id, title, content, position, created_at, updated_at, deleted_at, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
  `;
  await database.runAsync(query, [
    page.id,
    page.title,
    page.content,
    page.position,
    page.created_at,
    page.updated_at,
    page.sync_status ?? 'pending_create',
  ]);

  return page;
}

/**
 * Updates an existing page's title, content, or position and refreshes updated_at.
 *
 * @example
 * const updated = await updateLocalPage('uuid-123', { title: 'New Title' });
 */
export async function updateLocalPage(
  id: string,
  input: UpdatePageInput
): Promise<Page | null> {
  const database = await getDatabase();
  const existing = await getLocalPageById(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const updatedTitle = input.title !== undefined ? input.title.trim() : existing.title;
  const updatedContent = input.content !== undefined ? input.content : existing.content;
  const updatedPosition = input.position !== undefined ? input.position : existing.position;
  const syncStatus = existing.sync_status === 'synced' ? 'pending_update' : existing.sync_status;

  const query = `
    UPDATE pages
    SET title = ?, content = ?, position = ?, updated_at = ?, sync_status = ?
    WHERE id = ?
  `;
  await database.runAsync(query, [
    updatedTitle,
    updatedContent,
    updatedPosition,
    now,
    syncStatus ?? 'pending_update',
    id,
  ]);

  return getLocalPageById(id);
}

/**
 * Soft deletes a page by recording the deleted_at timestamp.
 *
 * @example
 * await softDeleteLocalPage('uuid-123');
 */
export async function softDeleteLocalPage(id: string): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const query = `
    UPDATE pages
    SET deleted_at = ?, sync_status = 'pending_delete'
    WHERE id = ?
  `;
  await database.runAsync(query, [now, id]);
}

/**
 * Batch updates note positions inside an atomic transaction.
 *
 * @example
 * await reorderLocalPages([{ id: 'uuid-1', position: 0 }, { id: 'uuid-2', position: 1 }]);
 */
export async function reorderLocalPages(items: ReorderItem[]): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const item of items) {
      await database.runAsync(
        `UPDATE pages SET position = ? WHERE id = ?`,
        [item.position, item.id]
      );
    }
  });
}
