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
  pgm.createTable('master_wilayah_stats', {
    nama_wilayah: {
      type: 'VARCHAR(150)',
      primaryKey: true, // Nama wilayah (Kabupaten/Kota) dijadikan Primary Key unik
    },
    kode_wilayah: {
      type: 'VARCHAR(10)',
      notNull: true,
    },
    tk_sederajat: { type: 'INT', notNull: true, default: 0 },
    kb_sederajat: { type: 'INT', notNull: true, default: 0 },
    tpa: { type: 'INT', notNull: true, default: 0 },
    sps: { type: 'INT', notNull: true, default: 0 },
    sd_sederajat: { type: 'INT', notNull: true, default: 0 },
    smp_sederajat: { type: 'INT', notNull: true, default: 0 },
    sma_sederajat: { type: 'INT', notNull: true, default: 0 },
    smk_sederajat: { type: 'INT', notNull: true, default: 0 },
    slb: { type: 'INT', notNull: true, default: 0 },
    total_siswa: { type: 'INT', notNull: true, default: 0 }, // Menampung kolom 'total' dari CSV Anda
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('master_wilayah_stats');
};
