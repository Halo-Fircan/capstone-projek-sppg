import pool from '../../../config/database.js';

class SppgPredictCsvRepository {
  async insertBatchPredictions(batchData) {
    if (!batchData || batchData.length === 0) { return []; }

    const client = await pool.connect();
    const insertedRows = [];

    try {
      await client.query('BEGIN');

      const queryText = `
        INSERT INTO sppg_analyses 
        (
          id,
          user_id, 
          nama_wilayah, 
          total_siswa, 
          rasio_sd,
          rasio_smp,
          rasio_sma_smk,
          jumlah_sppg_prediksi, 
          kebutuhan_sppg, 
          gap_prediksi, 
          status, 
          interpretasi,
          rekomendasi_kebijakan,
          penjelasan_prediksi,
          model_llm,
          input_type -- ◄ Kolom pemisah tipe input data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
        RETURNING id, nama_wilayah, status;
      `;

      for (const data of batchData) {
        const values = [
          data.id,
          data.user_id,
          data.nama_wilayah,
          data.total_siswa,
          data.rasio_sd,
          data.rasio_smp,
          data.rasio_sma_smk,
          data.jumlah_sppg_prediksi,
          data.kebutuhan_sppg,
          data.gap_prediksi,
          data.status,
          data.interpretasi || '',
          data.rekomendasi_kebijakan,
          data.penjelasan_prediksi,
          data.model_llm,
          'CSV'
        ];

        const res = await client.query(queryText, values);

        if (res.rows.length > 0) {
          insertedRows.push(res.rows[0]);
        }
      }

      await client.query('COMMIT');
      return insertedRows;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAllPredictions() {
    const query = `
      SELECT 
        id, 
        nama_wilayah, 
        total_siswa, 
        jumlah_sppg_prediksi, 
        kebutuhan_sppg, 
        gap_prediksi, 
        status, 
        interpretasi,
        rasio_sd,
        rasio_smp,
        rasio_sma_smk,
        rekomendasi_kebijakan,
        penjelasan_prediksi,
        model_llm,
        input_type, -- ◄ Ikut sertakan agar object mapper di Controller tidak bernilai undefined
        created_at
      FROM sppg_analyses 
      WHERE input_type = 'CSV' -- ◄ Dinding penyaring
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

export default SppgPredictCsvRepository;