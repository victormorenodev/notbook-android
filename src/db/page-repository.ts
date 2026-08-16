import { getDatabase } from '@/db/client';
import { CreatePageInput, Page, ReorderItem, UpdatePageInput } from '@/types/note';
import { generateEntityId } from '@/utils/id';
import { createEmptyDocJson } from '@/utils/tiptap';

/**
 * Fetches all non-deleted pages ordered strictly by position ASC, then created_at ASC.
 */
export async function getLocalPages(): Promise<Page[]> {
  const database = await getDatabase();
  const query = `
    SELECT id, title, content, position, created_at, updated_at, deleted_at, sync_status
    FROM pages
    WHERE deleted_at IS NULL
    ORDER BY position ASC, created_at ASC
  `;
  return database.getAllAsync<Page>(query);
}

/**
 * Fetches a single active page by its UUID.
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
 * Inserts a new page after a specified position, shifting all subsequent pages.
 */
export async function insertLocalPage(
  input: CreatePageInput,
  afterPosition?: number
): Promise<Page> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const id = input.id ?? generateEntityId();

  let targetPosition = 0;

  await database.withTransactionAsync(async () => {
    if (afterPosition !== undefined && afterPosition >= 0) {
      targetPosition = afterPosition + 1;
      await database.runAsync(
        `UPDATE pages SET position = position + 1 WHERE position >= ? AND deleted_at IS NULL`,
        [targetPosition]
      );
    } else {
      const maxRow = await database.getFirstAsync<{ max_pos: number | null }>(
        `SELECT MAX(position) as max_pos FROM pages WHERE deleted_at IS NULL`
      );
      targetPosition = maxRow?.max_pos !== null && maxRow?.max_pos !== undefined ? maxRow.max_pos + 1 : 0;
    }

    const query = `
      INSERT INTO pages (id, title, content, position, created_at, updated_at, deleted_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending_create')
    `;
    await database.runAsync(query, [
      id,
      input.title.trim(),
      input.content ?? createEmptyDocJson(),
      targetPosition,
      now,
      now,
    ]);
  });

  return {
    id,
    title: input.title.trim(),
    content: input.content ?? createEmptyDocJson(),
    position: targetPosition,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    sync_status: 'pending_create',
  };
}

/**
 * Updates an existing page's title, content, or position and refreshes updated_at.
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
 * Soft deletes a page and collapses positions of subsequent pages.
 */
export async function softDeleteLocalPage(id: string): Promise<void> {
  const database = await getDatabase();
  const page = await getLocalPageById(id);
  if (!page) return;

  const now = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE pages SET deleted_at = ?, sync_status = 'pending_delete' WHERE id = ?`,
      [now, id]
    );
    await database.runAsync(
      `UPDATE pages SET position = position - 1 WHERE position > ? AND deleted_at IS NULL`,
      [page.position]
    );
  });
}

/**
 * Batch updates note positions inside an atomic transaction.
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
