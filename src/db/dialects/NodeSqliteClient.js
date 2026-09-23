import { DatabaseSync } from 'node:sqlite';
import Sqlite3Client from 'knex/lib/dialects/sqlite3/index.js';

export class NodeSqliteClient extends Sqlite3Client {
  _driver() {
    return DatabaseSync;
  }

  async acquireRawConnection() {
    const { filename } = this.connectionSettings;
    const db = new DatabaseSync(filename, {
      enableForeignKeyConstraints: true,
    });
    // Enable WAL mode for better concurrency
    db.exec('PRAGMA journal_mode = WAL;');
    return db;
  }

  async destroyRawConnection(connection) {
    connection.close();
  }

  async _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    const { sql, bindings } = obj;
    const formattedBindings = this._formatBindings(bindings);
    const stmt = connection.prepare(sql);

    const isReader = obj.returning || /^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql);

    if (isReader) {
      const rows = stmt.all(...formattedBindings);
      obj.response = rows;
    } else {
      const result = stmt.run(...formattedBindings);
      obj.response = result;
      obj.context = {
        lastID: result.lastInsertRowid,
        changes: result.changes,
      };
    }

    return obj;
  }

  _formatBindings(bindings) {
    if (!Array.isArray(bindings)) return [];
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

Object.assign(NodeSqliteClient.prototype, {
  dialect: 'sqlite3',
  driverName: 'node:sqlite',
});