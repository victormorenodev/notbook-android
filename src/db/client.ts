import * as SQLite from 'expo-sqlite';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initializes tables, pragmas, and indexes on the SQLite database.
 */
async function setupSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending_create'
    );

    CREATE INDEX IF NOT EXISTS idx_pages_deleted_at ON pages(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_pages_position ON pages(position);
    CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at);
  `);
}

/**
 * Returns the shared SQLite database instance, initializing it if needed.
 *
 * @example
 * const db = await getDatabase();
 * const rows = await db.getAllAsync('SELECT * FROM pages');
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  const database = await SQLite.openDatabaseAsync('notbook.db');
  await setupSchema(database);
  databaseInstance = database;
  return databaseInstance;
}
