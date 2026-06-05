import pool from '../../../config/database.js';

class SppgMasterRepository {
  constructor() {
    this._pool = pool;
  }

  async truncateMasterTable() {
    const query = 'TRUNCATE TABLE master_sppg RESTART IDENTITY';
    await this._pool.query(query);
  }

  // 💡 SEKARANG MENERIMA ARRAY OF OBJECTS (Mendukung Batch Insert 1000 data sekaligus)
  async insertMasterRow(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) { return; }

    const values = [];
    const placeholders = [];
    let counter = 1;

    // Menyusun query multi-row: ($1, $2, $3...), ($8, $9, $10...) secara dinamis
    for (const row of dataArray) {
      placeholders.push(`($${counter}, $${counter + 1}, $${counter + 2}, $${counter + 3}, $${counter + 4}, $${counter + 5}, $${counter + 6})`);

      values.push(
        row.no_sppg,
        row.provinsi,
        row.kab_kota,
        row.kecamatan,
        row.kelurahan,
        row.alamat,
        row.nama_sppg
      );

      counter += 7; // Karena ada 7 kolom yang dimasukkan per baris
    }

    const queryText = `
      INSERT INTO master_sppg (no_sppg, provinsi, kab_kota, kecamatan, kelurahan, alamat, nama_sppg)
      VALUES ${placeholders.join(', ')}
    `;

    // Eksekusi insert 1000 baris sekaligus dalam 1 kali perjalanan ke database!
    await this._pool.query({ text: queryText, values });
  }

  async getAllMasterData(page = 1, limit = 100) {
    const offset = (page - 1) * limit;

    const dataQuery = {
      text: `SELECT id, no_sppg, provinsi, kab_kota, kecamatan, kelurahan, alamat, nama_sppg 
             FROM master_sppg ORDER BY id ASC LIMIT $1 OFFSET $2`,
      values: [limit, offset],
    };

    const countQuery = 'SELECT COUNT(*) FROM master_sppg';

    const [dataResult, countResult] = await Promise.all([
      this._pool.query(dataQuery),
      this._pool.query(countQuery),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }
}

export default SppgMasterRepository;