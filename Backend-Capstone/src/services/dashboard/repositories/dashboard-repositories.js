import pool from '../../../config/database.js';

class DashboardRepository {
  constructor() {
    this._pool = pool;
  }

  async getTotalSppgMaster() {
    const query = 'SELECT COUNT(*) AS total FROM master_sppg';
    const result = await this._pool.query(query);
    return parseInt(result.rows[0].total) || 0;
  }

  async getTotalSiswaAnalyses() {
    const query = 'SELECT SUM(total_siswa) AS total FROM sppg_analyses';
    const result = await this._pool.query(query);
    return parseInt(result.rows[0].total) || 0;
  }

  async getTotalWilayahPrioritas() {
    const query = `
      SELECT COUNT(*) AS total 
      FROM sppg_analyses 
      WHERE UPPER(status) IN ('SANGAT_KURANG', 'KURANG')
    `;
    const result = await this._pool.query(query);
    return parseInt(result.rows[0].total) || 0;
  }

  async getTopKerawanan() {
    const query = `
      WITH unique_kerawanan AS (
        SELECT DISTINCT ON (LOWER(TRIM(nama_wilayah))) 
          nama_wilayah, 
          kebutuhan_sppg, 
          gap_prediksi, 
          status
        FROM sppg_analyses
        WHERE UPPER(status) = 'SANGAT_KURANG'
        ORDER BY LOWER(TRIM(nama_wilayah)), gap_prediksi ASC
      )
      SELECT nama_wilayah, kebutuhan_sppg, gap_prediksi, status
      FROM unique_kerawanan
      ORDER BY gap_prediksi ASC
      LIMIT 5
    `;
    const result = await this._pool.query(query);
    return result.rows;
  }
}

export default DashboardRepository;
