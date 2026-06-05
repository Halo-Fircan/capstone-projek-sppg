import fs from 'fs';
import csv from 'csv-parser';
import { Readable } from 'stream';
import SppgMasterRepository from '../repositories/sppgmaster-repositories.js';

class SppgMasterService {
  constructor() {
    this._repository = new SppgMasterRepository();
  }

  async importMasterCsv(csvBuffer) {
    const results = [];

    return new Promise((resolve, reject) => {
      // 💡 PERBAIKAN 1: Konversi Buffer ke String UTF-8 agar csv-parser bisa membaca pembatas baris dengan akurat
      const csvString = csvBuffer.toString('utf-8');

      Readable.from(csvString)
        .pipe(csv({
          // 💡 PERBAIKAN 2: Paksa parser mengenali standar LF/CRLF agar tidak tersedak oleh Enter di dalam kolom alamat
          newline: '\n',
          mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
        }))
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', async () => {
          try {
            const totalRecords = results.length;
            console.log(`🚀 Total data SPPG berhasil di-parse: ${totalRecords} baris.`);

            if (totalRecords === 0) {
              return resolve(0);
            }

            // Bersihkan tabel lama
            await this._repository.truncateMasterTable();

            // 💡 PERBAIKAN 3: OPTIMASI BATCH INSERT (Jangan insert satu-satu biar gak kena timeout Vercel!)
            const batchSize = 1000;
            let currentBatch = [];

            for (let i = 0; i < totalRecords; i++) {
              const row = results[i];

              const mappedData = {
                no_sppg: parseInt(row['no']) || null,
                provinsi: row['provinsisppg'] || row['provinsi'] || null,
                kab_kota: row['kabkotasppg'] || row['kabkota'] || null,
                kecamatan: row['kecamatansppg'] || row['kecamatan'] || null,
                kelurahan: row['kelurahandesasppg'] || row['kelurahan'] || null,
                alamat: row['alamatsppg'] || row['alamat'] || null,
                nama_sppg: row['namasppg'] || null
              };

              if (!mappedData.nama_sppg && !mappedData.provinsi) {
                continue;
              }

              currentBatch.push(mappedData);

              // Jika batch sudah mencapai 1000 data atau sudah di ujung baris data, langsung tembak ke DB
              if (currentBatch.length === batchSize || i === totalRecords - 1) {
                // Catatan: Pastikan repository lu mendukung menerima Array objek atau gunakan Promise.all
                await this._repository.insertMasterRow(currentBatch);
                currentBatch = []; // Kosongkan container untuk batch berikutnya
              }
            }

            resolve(totalRecords);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async getMasterSppg(page = 1, limit = 100) {
    return await this._repository.getAllMasterData(page, limit);
  }
}

export default SppgMasterService;