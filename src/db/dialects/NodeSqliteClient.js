import { DatabaseSync } from 'node:sqlite';
import { BetterSqlite3Client } from 'knex/lib/dialects/better-sqlite3';

export class NodeSqliteClient extends BetterSqlite3Client {
  constructor(config) {
    super(config);
    this.driverName = 'node:sqlite';
  }

  acquireRawConnection() {
    const { filename } = this.connectionSettings;
    const db = new DatabaseSync(filename, {
      enableForeignKeyConstraints: true,
    });
    // Enable WAL mode for better concurrency
    db.exec('PRAGMA journal_mode = WAL;');
    return db;
  }

  destroyRawConnection(connection) {
    connection.close();
  }

  _query(connection, obj) {
    const { sql, bindings } = obj;
    const formattedBindings = this._formatBindings(bindings);
    const stmt = connection.prepare(sql);

    // Detect if it's a SELECT query (reader) by checking SQL
    const isSelect = /^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql);

    if (isSelect) {
      const rows = stmt.all(...formattedBindings);
      obj.response = rows;
    } else {
      const result = stmt.run(...formattedBindings);
      obj.response = {
        insertId: result.lastInsertRowid,
        changes: result.changes,
      };
    }
  }

  _formatBindings(bindings) {
    if (!Array.isArray(bindings)) return bindings;
    return bindings.map((b) => {
      if (typeof b === 'boolean') return b ? 1 : 0;
      if (b instanceof Date) return b.toISOString();
      return b;
    });
  }

  ping(connection) {
    try {
      connection.exec('SELECT 1;');
      return true;
    } catch {
      return false;
    }
  }
}