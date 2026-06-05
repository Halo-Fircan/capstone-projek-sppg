import SppgPredictCsvRepository from '../repositories/sppgpredictcsv-repositories.js';

class SppgPredictCsvService {
  constructor() {
    this._repository = new SppgPredictCsvRepository();
  }

  async processAndCombineBatch(userId, newRows, aiPredictions, cachedRows) {
    const finalBatchData = [...cachedRows];

    for (let i = 0; i < newRows.length; i++) {
      const currentAi = aiPredictions[i];

      const prediksi = currentAi?.jumlah_sppg_prediksi || 0;
      const kebutuhan = currentAi?.kebutuhan_sppg || 0;
      const gap = currentAi?.gap_prediksi || 0;
      const statusWilayah = currentAi?.status || 'UNKNOWN';
      const interpretasiSingkat = currentAi?.interpretasi || `Status wilayah terpantau ${statusWilayah}.`;

      const totalSiswa = newRows[i].total_siswa || 1;

      const rasioSd = ((newRows[i].sd_sederajat || 0) / totalSiswa * 100);
      const rasioSmp = ((newRows[i].smp_sederajat || 0) / totalSiswa * 100);
      const rasioSmaSmk = (((newRows[i].sma_sederajat || 0) + (newRows[i].smk_sederajat || 0)) / totalSiswa * 100);

      let rekomendasi = '';

      if (statusWilayah === 'KURANG') {
        rekomendasi = `1. Prioritaskan penambahan unit baru secepatnya untuk mengejar gap kekurangan sebesar ${Math.abs(gap)} unit.\n2. Alokasikan anggaran khusus daerah.\n3. Pertimbangkan redistribusi unit.`;
      } else if (statusWilayah === 'SURPLUS') {
        rekomendasi = `1. Optimalisasi pemanfaatan aset berlebih sebesar ${gap} unit lintas wilayah.\n2. Alihkan alokasi anggaran pemeliharaan ke wilayah lain.\n3. Lakukan evaluasi efisiensi operasional.`;
      } else {
        rekomendasi = `1. Pertahankan rasio pemenuhan ideal.\n2. Fokus pada peningkatan mutu pelayanan operasional unit.`;
      }

      const penjelasan = `Analisis batch mendeteksi wilayah ${newRows[i].nama_wilayah} memiliki total siswa terdata sebanyak ${totalSiswa} orang. Model memproyeksikan total alokasi ideal sebesar ${kebutuhan} unit.`;

      const generatedId = `csv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      finalBatchData.push({
        id: generatedId,
        user_id: userId,
        nama_wilayah: newRows[i].nama_wilayah,
        total_siswa: totalSiswa,
        jumlah_sppg_prediksi: Math.round(parseFloat(prediksi)),
        kebutuhan_sppg: parseFloat(kebutuhan),
        gap_prediksi: parseFloat(gap),
        status: statusWilayah,
        rasio_sd: parseFloat(rasioSd.toFixed(2)),
        rasio_smp: parseFloat(rasioSmp.toFixed(2)),
        rasio_sma_smk: parseFloat(rasioSmaSmk.toFixed(2)),
        interpretasi: interpretasiSingkat,
        rekomendasi_kebijakan: rekomendasi,
        penjelasan_prediksi: penjelasan,
        model_llm: 'FastAPI-Batch/Ridge-Reg',
        input_type: 'CSV'
      });
    }

    await this._repository.insertBatchPredictions(finalBatchData);

    return finalBatchData;
  }

  async getPredictionHistory() {
    return await this._repository.findAllPredictions();
  }
}

export default SppgPredictCsvService;