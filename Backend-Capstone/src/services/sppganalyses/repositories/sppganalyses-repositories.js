import pool from '../../../config/database.js';
import { nanoid } from 'nanoid';
import InvariantError from '../../../exceptions/invariant-error.js';

class SppgAnalysesRepository {
  constructor() {
    this._pool = pool;
  }

  async addSppgAnalysis(userId, inputData, aiOutput) {
    const id = nanoid(16);

    const query = {
      text: `INSERT INTO sppg_analyses (
        id, user_id, nama_wilayah, total_siswa, rasio_sd, rasio_smp, rasio_sma_smk,
        jumlah_sppg_prediksi, kebutuhan_sppg, gap_prediksi, status,
        interpretasi, rekomendasi_kebijakan, penjelasan_prediksi, model_llm,
        input_type -- ◄ Kolom penanda dinding pembatas
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      values: [
        id,
        userId,
        inputData.nama_wilayah,
        aiOutput.total_siswa || 0,
        aiOutput.rasio_sd || 0,
        aiOutput.rasio_smp || 0,
        aiOutput.rasio_sma_smk || 0,
        aiOutput.jumlah_sppg_prediksi || 0,
        aiOutput.kebutuhan_sppg || 0,
        aiOutput.gap_prediksi || 0,
        aiOutput.status || 'SEIMBANG',
        aiOutput.interpretasi || '',
        aiOutput.rekomendasi_kebijakan || '',
        aiOutput.penjelasan_prediksi || '',
        aiOutput.model_llm || 'LLM Model',
        'MANUAL'
      ],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan analisis SPPG');
    }

    return result.rows[0].id;
  }

  async getMasterWilayahStats(namaWilayah) {
    const query = {
      text: `
        SELECT 
          nama_wilayah, kode_wilayah, kb_sederajat, sd_sederajat, smp_sederajat, 
          sma_sederajat, smk_sederajat, slb, sps, tk_sederajat, tpa, total_siswa
        FROM master_wilayah_stats 
        WHERE LOWER(TRIM(nama_wilayah)) ILIKE LOWER(TRIM($1))
        LIMIT 1;
      `,
      values: [`%${namaWilayah}%`],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async getSppgAnalyses(namaWilayah = null) {
    if (namaWilayah) {
      const query = {
        text: `SELECT sa.*, u.name as user_name 
               FROM sppg_analyses sa
               LEFT JOIN users u ON sa.user_id = u.id
               WHERE LOWER(TRIM(sa.nama_wilayah)) ILIKE LOWER(TRIM($1))
                 AND sa.input_type = 'MANUAL' -- ◄ MENGUNCI ISOLASI DATA FORM MANUAL
               ORDER BY sa.created_at DESC`,
        values: [`%${namaWilayah}%`],
      };
      const result = await this._pool.query(query);
      return result.rows;
    }

    const query = {
      text: `SELECT sa.*, u.name as user_name 
             FROM sppg_analyses sa
             LEFT JOIN users u ON sa.user_id = u.id
             WHERE sa.input_type = 'MANUAL' -- ◄ MENGUNCI ISOLASI DATA FORM MANUAL
             ORDER BY sa.created_at DESC`,
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

export default SppgAnalysesRepository;