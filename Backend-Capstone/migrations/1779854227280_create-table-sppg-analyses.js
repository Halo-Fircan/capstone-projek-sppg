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
  pgm.createTable('sppg_analyses', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: '"users"', // Mengikat ke tabel users Anda
      onDelete: 'CASCADE',
    },
    nama_wilayah: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    total_siswa: {
      type: 'INT',
      notNull: true,
    },
    rasio_sd: {
      type: 'NUMERIC(5,2)',
      notNull: false, // Boleh null sesuai skema FastAPI (number | null)
    },
    rasio_smp: {
      type: 'NUMERIC(5,2)',
      notNull: false, // Boleh null sesuai skema FastAPI (number | null)
    },
    rasio_sma_smk: {
      type: 'NUMERIC(5,2)',
      notNull: false, // Boleh null sesuai skema FastAPI (number | null)
    },
    jumlah_sppg_prediksi: {
      type: 'INT',
      notNull: true,
    },
    kebutuhan_sppg: {
      type: 'NUMERIC(6,2)',
      notNull: true,
    },
    gap_prediksi: {
      type: 'NUMERIC(5,2)',
      notNull: true,
    },
    status: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    interpretasi: {
      type: 'TEXT',
      notNull: false, // Set false dulu agar data lama jika ada tidak crash, atau true jika database masih bersih
    },
    rekomendasi_kebijakan: {
      type: 'TEXT',
      notNull: true,
    },
    penjelasan_prediksi: {
      type: 'TEXT',
      notNull: true,
    },
    model_llm: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMP',
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
  pgm.dropTable('sppg_analyses');
};
