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
  pgm.createTable('master_sppg', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    no_sppg: {
      type: 'integer',
      notNull: false,
    },
    provinsi: {
      type: 'varchar(150)',
      notNull: false,
    },
    kab_kota: {
      type: 'varchar(150)',
      notNull: false,
    },
    kecamatan: {
      type: 'varchar(150)',
      notNull: false,
    },
    kelurahan: {
      type: 'varchar(150)',
      notNull: false,
    },
    alamat: {
      type: 'text',
      notNull: false,
    },
    nama_sppg: {
      type: 'varchar(255)',
      notNull: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('master_sppg');
};
