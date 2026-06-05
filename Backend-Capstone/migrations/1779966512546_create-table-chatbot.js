/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('chat_sessions', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"users"', // Mengikat ke tabel users Anda
      onDelete: 'CASCADE'
    },
    title: {
      type: 'VARCHAR(255)',
      notNull: true,
      default: 'Obrolan Baru'
    },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
  });

  pgm.createTable('chat_messages', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true
    },
    session_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"chat_sessions"', // Mengikat ke tabel sesi di atas
      onDelete: 'CASCADE'
    },
    sender: {
      type: 'VARCHAR(10)',
      notNull: true // Isinya nanti hanya: 'user' atau 'bot'
    },
    message: {
      type: 'TEXT',
      notNull: true
    },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('chat_sessions');
  pgm.dropTable('chat_messages');
};
