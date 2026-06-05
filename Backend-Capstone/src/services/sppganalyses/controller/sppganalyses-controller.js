import fastApiClient from '../../../config/fastapi.js';
import SppgAnalysesRepository from '../repositories/sppganalyses-repositories.js';
import responseHelper from '../../../utils/response.js';

class SppgAnalysesController {
  constructor() {
    this._sppgAnalysesRepository = new SppgAnalysesRepository();
    this.postAnalyzeHandler = this.postAnalyzeHandler.bind(this);
    this.getAnalysesHandler = this.getAnalysesHandler.bind(this);
  }

  async postAnalyzeHandler(req, res, next) {
    try {
      const { nama_wilayah } = req.body;

      if (!nama_wilayah) {
        return responseHelper(res, 400, 'Gagal melakukan analisis. Mohon sertakan nama_wilayah.', null);
      }

      const cleanInput = nama_wilayah.trim().toUpperCase();
      const vagueInputs = [
        'TIMUR', 'BARAT', 'UTARA', 'SELATAN', 'PUSAT', 'TENGGARA',
        'BARAT DAYA', 'BARAT LAUT', 'TIMUR LAUT', 'KOTA', 'KABUPATEN', 'KAB'
      ];

      if (vagueInputs.includes(cleanInput) || cleanInput.length < 3) {
        return responseHelper(
          res,
          400,
          'Gagal melakukan analisis. Input nama wilayah terlalu umum atau tidak spesifik (contoh: "timur" atau "barat" saja tidak diperbolehkan). Mohon sebutkan nama wilayah, kabupaten, atau kota secara lengkap (misal: "Jakarta Timur" atau "Sanggau").',
          null
        );
      }

      let userId = req.user?.id || null;

      if (!userId) {
        try {
          const userResult = await this._sppgAnalysesRepository._pool.query(
            "SELECT id FROM users LIMIT 1"
          );
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
          }
        } catch (dbErr) {
          console.error("Gagal mendapatkan fallback userId dari PostgreSQL:", dbErr.message);
        }
      }

      const stats = await this._sppgAnalysesRepository.getMasterWilayahStats(nama_wilayah);
      const namaWilayahResmi = stats ? stats.nama_wilayah : nama_wilayah.trim().toUpperCase();

      const existingAnalyses = await this._sppgAnalysesRepository.getSppgAnalyses(namaWilayahResmi);

      if (existingAnalyses && existingAnalyses.length > 0) {
        const cachedRow = existingAnalyses[0];

        const cachedOutput = {
          total_siswa: Number(cachedRow.total_siswa || cachedRow.result?.total_siswa || 0),
          rasio_sd: parseFloat(cachedRow.rasio_sd || cachedRow.result?.rasio_sd || 0),
          rasio_smp: parseFloat(cachedRow.rasio_smp || cachedRow.result?.rasio_smp || 0),
          rasio_sma_smk: parseFloat(cachedRow.rasio_sma_smk || cachedRow.result?.rasio_sma_smk || 0),
          jumlah_sppg_prediksi: Number(cachedRow.jumlah_sppg_prediksi || cachedRow.result?.jumlah_sppg_prediksi || 0),
          kebutuhan_sppg: parseFloat(cachedRow.kebutuhan_sppg || cachedRow.result?.kebutuhan_sppg || 0),
          gap_prediksi: parseFloat(cachedRow.gap_prediksi || cachedRow.result?.gap_prediksi || 0),
          status: cachedRow.status || cachedRow.result?.status || 'UNKNOWN',
          interpretasi: cachedRow.interpretasi || cachedRow.result?.interpretasi || 'Tidak ada interpretasi.',
          rekomendasi_kebijakan: cachedRow.rekomendasi_kebijakan || cachedRow.rekomendasi || cachedRow.result?.rekomendasi_kebijakan || 'Tidak ada rekomendasi.',
          penjelasan_prediksi: cachedRow.penjelasan_prediksi || cachedRow.result?.penjelasan_prediksi || 'Tidak ada penjelasan.',
          model_llm: cachedRow.model_llm || cachedRow.result?.model_llm || 'openai/gpt-oss-120b:free'
        };

        if (!cachedOutput.model_llm.includes('(Cached)')) {
          cachedOutput.model_llm = `${cachedOutput.model_llm} (Cached)`;
        }

        return responseHelper(res, 200, `Analisis wilayah '${namaWilayahResmi}' ditemukan di database (Cache Hit).`, {
          analysisId: cachedRow.id,
          result: cachedOutput,
        });
      }

      const dataSekolah = stats ? {
        kb_sederajat: Number(stats.kb_sederajat) || 0,
        kode_provinsi: stats.kode_provinsi || '32',
        sd_sederajat: Number(stats.sd_sederajat) || 0,
        slb: Number(stats.slb) || 0,
        sma_sederajat: Number(stats.sma_sederajat) || 0,
        smk_sederajat: Number(stats.smk_sederajat) || 0,
        smp_sederajat: Number(stats.smp_sederajat) || 0,
        sps: Number(stats.sps) || 0,
        tk_sederajat: Number(stats.tk_sederajat) || 0,
        total_siswa: Number(stats.total_siswa) || 0,
        tpa: Number(stats.tpa) || 0
      } : {
        kb_sederajat: 3000,
        kode_provinsi: '32',
        sd_sederajat: 45000,
        slb: 200,
        sma_sederajat: 12000,
        smk_sederajat: 8000,
        smp_sederajat: 18000,
        sps: 100,
        tk_sederajat: 5000,
        total_siswa: 83000,
        tpa: 50
      };

      const responseAi = await fastApiClient.post(`/predict-and-analyze?nama_wilayah=${encodeURIComponent(namaWilayahResmi)}`, dataSekolah);

      const { prediksi, analisis_ai } = responseAi.data;

      const totalSekolah =
        dataSekolah.sd_sederajat + dataSekolah.smp_sederajat +
        dataSekolah.sma_sederajat + dataSekolah.smk_sederajat +
        dataSekolah.kb_sederajat + dataSekolah.tk_sederajat +
        dataSekolah.slb + dataSekolah.sps + dataSekolah.tpa;

      const pembagi = totalSekolah || 1;

      const rasioSd = parseFloat((dataSekolah.sd_sederajat / pembagi * 100).toFixed(2));
      const rasioSmp = parseFloat((dataSekolah.smp_sederajat / pembagi * 100).toFixed(2));
      const rasioSmaSmk = parseFloat(((dataSekolah.sma_sederajat + dataSekolah.smk_sederajat) / pembagi * 100).toFixed(2));

      const completeOutput = {
        total_siswa: dataSekolah.total_siswa,
        rasio_sd: rasioSd,
        rasio_smp: rasioSmp,
        rasio_sma_smk: rasioSmaSmk,
        jumlah_sppg_prediksi: Math.round(prediksi.jumlah_sppg_prediksi || 0),
        kebutuhan_sppg: parseFloat(prediksi.kebutuhan_sppg || 0),
        gap_prediksi: parseFloat(prediksi.gap_prediksi || 0),
        status: prediksi.status || 'UNKNOWN',
        interpretasi: prediksi.interpretasi || 'Tidak ada interpretasi.',
        rekomendasi_kebijakan: analisis_ai.rekomendasi_kebijakan || 'Tidak ada rekomendasi.',
        penjelasan_prediksi: analisis_ai.penjelasan_prediksi || 'Tidak ada penjelasan.',
        model_llm: analisis_ai.model_llm || 'openai/gpt-oss-120b:free'
      };

      const analysisId = await this._sppgAnalysesRepository.addSppgAnalysis(
        userId,
        { nama_wilayah: namaWilayahResmi },
        completeOutput
      );

      return responseHelper(res, 201, `Analisis wilayah '${namaWilayahResmi}' baru berhasil diproses via FastAPI dan disimpan ke database.`, {
        analysisId,
        result: completeOutput,
      });

    } catch (error) {
      if (error.response) {
        return responseHelper(
          res,
          error.response.status,
          `Terjadi kesalahan pada server FastAPI: ${JSON.stringify(error.response.data?.detail || error.message)}`,
          null
        );
      }
      return next(error);
    }
  }

  async getAnalysesHandler(req, res, next) {
    try {
      const { nama_wilayah } = req.query;
      const searchKey = (nama_wilayah && nama_wilayah.trim() !== '') ? nama_wilayah.trim() : null;

      const analyses = await this._sppgAnalysesRepository.getSppgAnalyses(searchKey);

      const formattedAnalyses = analyses.map((row) => ({
        id: row.id,
        nama_wilayah: row.nama_wilayah,
        dbuat_oleh: row.user_name || 'Anonim',
        tanggal_analisis: row.created_at,
        input_type: row.input_type,
        result: {
          total_siswa: row.total_siswa,
          rasio_sd: row.rasio_sd,
          rasio_smp: row.rasio_smp,
          rasio_sma_smk: row.rasio_sma_smk,
          jumlah_sppg_prediksi: row.jumlah_sppg_prediksi,
          kebutuhan_sppg: row.kebutuhan_sppg,
          gap_prediksi: row.gap_prediksi,
          status: row.status,
          interpretasi: row.interpretasi,
          rekomendasi_kebijakan: row.rekomendasi_kebijakan,
          penjelasan_prediksi: row.penjelasan_prediksi,
          model_llm: row.model_llm
        }
      }));

      return responseHelper(res, 200, searchKey
        ? `Berhasil memuat riwayat form khusus untuk wilayah '${searchKey}'`
        : 'Berhasil memuat seluruh riwayat analisis manual dari database cache',
        {
          count: formattedAnalyses.length,
          analyses: formattedAnalyses,
        });

    } catch (error) {
      return next(error);
    }
  }
}

export default SppgAnalysesController;