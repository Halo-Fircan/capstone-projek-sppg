import { Readable } from 'stream';
import csvParser from 'csv-parser';
import axios from 'axios';
import responseHelper from '../../../utils/response.js';
import SppgPredictCsvService from '../services/sppgpredictcsv-service.js';

class SppgPredictCsvController {
  constructor() {
    this._service = new SppgPredictCsvService();
    this.postBatchCsvHandler = this.postBatchCsvHandler.bind(this);
    this.getBatchCsvHistoryHandler = this.getBatchCsvHistoryHandler.bind(this);
  }

  async postBatchCsvHandler(req, res, next) {
    try {
      if (!req.file) {
        return responseHelper(res, 400, 'Mohon unggah file CSV data peserta didik terlebih dahulu');
      }

      const rows = [];
      const stream = Readable.from(req.file.buffer.toString());

      // 1. Parsing file CSV ke array JavaScript
      await new Promise((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (data) => {
            const kodeWilayahStr = String(data.kode_wilayah || '');
            const kodeProvinsi = kodeWilayahStr.substring(0, 2);

            rows.push({
              kb_sederajat: parseInt(data.kb_sederajat) || 0,
              kode_provinsi: kodeProvinsi || '32',
              sd_sederajat: parseInt(data.sd_sederajat) || 0,
              slb: parseInt(data.slb) || 0,
              sma_sederajat: parseInt(data.sma_sederajat) || 0,
              smk_sederajat: parseInt(data.smk_sederajat) || 0,
              smp_sederajat: parseInt(data.smp_sederajat) || 0,
              sps: parseInt(data.sps) || 0,
              tk_sederajat: parseInt(data.tk_sederajat) || 0,
              total_siswa: parseInt(data.total) || parseInt(data.total_siswa) || 0,
              tpa: parseInt(data.tpa) || 0,
              nama_wilayah: data.nama_wilayah || 'Tidak Diketahui'
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });

      const userId = req.user ? req.user.id : 'system-batch';

      const existingAnalyses = await this._service.getPredictionHistory();

      const dataToProcessToAi = [];
      const cachedDataResults = [];

      for (const row of rows) {
        const matchCache = existingAnalyses.find(
          (exist) =>
            exist.nama_wilayah.toLowerCase().trim() === row.nama_wilayah.toLowerCase().trim() &&
            exist.input_type === 'CSV'
        );

        if (matchCache) {
          cachedDataResults.push({
            id: matchCache.id,
            user_id: userId,
            nama_wilayah: matchCache.nama_wilayah,
            total_siswa: Number(matchCache.total_siswa),
            jumlah_sppg_prediksi: Number(matchCache.jumlah_sppg_prediksi),
            kebutuhan_sppg: parseFloat(matchCache.kebutuhan_sppg),
            gap_prediksi: parseFloat(matchCache.gap_prediksi),
            status: matchCache.status,
            rasio_sd: parseFloat(matchCache.rasio_sd || 0),
            rasio_smp: parseFloat(matchCache.rasio_smp || 0),
            rasio_sma_smk: parseFloat(matchCache.rasio_sma_smk || 0),
            interpretasi: matchCache.interpretasi,
            rekomendasi_kebijakan: matchCache.rekomendasi_kebijakan,
            penjelasan_prediksi: matchCache.penjelasan_prediksi,
            model_llm: matchCache.model_llm.includes('(Cached)') ? matchCache.model_llm : `${matchCache.model_llm} (Cached)`,
            input_type: 'CSV'
          });
        } else {
          dataToProcessToAi.push(row);
        }
      }

      let aiPredictionsResult = [];
      if (dataToProcessToAi.length > 0) {
        const CHUNK_SIZE = 100;
        const fastapiBaseUrl = process.env.FASTAPI_URL || 'https://fkaslana-capstone-projek.hf.space';
        const fastapiUrl = `${fastapiBaseUrl}/predict/batch`;
        const promises = [];

        for (let i = 0; i < dataToProcessToAi.length; i += CHUNK_SIZE) {
          const chunkRows = dataToProcessToAi.slice(i, i + CHUNK_SIZE);
          const fastapiPayload = chunkRows.map(({ nama_wilayah, ...rest }) => rest);

          promises.push(axios.post(fastapiUrl, fastapiPayload, {
            headers: { 'accept': 'application/json', 'Content-Type': 'application/json' }
          }));
        }

        const responses = await Promise.all(promises);
        for (const response of responses) {
          aiPredictionsResult = aiPredictionsResult.concat(response.data);
        }
      }

      const finalInserted = await this._service.processAndCombineBatch(
        userId,
        dataToProcessToAi,
        aiPredictionsResult,
        cachedDataResults
      );

      return responseHelper(res, 201, `Berhasil memproses batch CSV: ${dataToProcessToAi.length} via AI Baru, ${cachedDataResults.length} via Cache DB.`, {
        filename: req.file.originalname,
        total_records: rows.length,
        new_processed: dataToProcessToAi.length,
        cached_applied: cachedDataResults.length,
        result: finalInserted
      });

    } catch (error) {
      if (error.response) {
        return responseHelper(res, error.response.status, `FastAPI Batch Error: ${JSON.stringify(error.response.data)}`, null);
      }
      return next(error);
    }
  }

  async getBatchCsvHistoryHandler(req, res, next) {
    try {
      const historyData = await this._service.getPredictionHistory();
      return responseHelper(res, 200, 'Berhasil memuat semua riwayat data hasil analisis CSV', historyData);
    } catch (error) {
      return next(error);
    }
  }
}

export default SppgPredictCsvController;