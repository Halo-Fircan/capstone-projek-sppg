import DashboardRepository from '../repositories/dashboard-repositories.js';

class DashboardService {
  constructor() {
    this._repository = new DashboardRepository();
  }

  async getDashboardSummary() {
    const [totalSppg, totalSiswa, wilayahPrioritas, topKerawanan] = await Promise.all([
      this._repository.getTotalSppgMaster(),
      this._repository.getTotalSiswaAnalyses(),
      this._repository.getTotalWilayahPrioritas(),
      this._repository.getTopKerawanan()
    ]);

    let rasioNasional = '1 : 0';
    if (totalSppg > 0) {
      const hitungRasio = Math.round(totalSiswa / totalSppg);
      rasioNasional = `1 : ${hitungRasio.toLocaleString('id-ID')}`;
    }

    return {
      totalSppgTerdaftar: totalSppg,
      totalPenerimaAnak: totalSiswa,
      rasioNasional: rasioNasional,
      wilayahPrioritas: wilayahPrioritas,
      kualitasData: '92.4%',
      indeksKerawanan: topKerawanan.map((row, index) => ({
        peringkat: index + 1,
        namaWilayah: row.nama_wilayah,
        gap: parseFloat(row.gap_prediksi) || 0,
        status: row.status
      }))
    };
  }
}

export default DashboardService;