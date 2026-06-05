import SppgMasterService from '../services/sppgmaster-service.js';
import response from '../../../utils/response.js';
import InvariantError from '../../../exceptions/invariant-error.js';
import fetch from 'node-fetch';

const sppgMasterService = new SppgMasterService();

export const uploadMasterCsvHandler = async (req, res, next) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      throw new InvariantError('Gagal mengunggah berkas. Mohon lampirkan file CSV yang valid.');
    }

    // Download file dari Supabase
    const fileRes = await fetch(fileUrl);
    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

    const totalInserted = await sppgMasterService.importMasterCsv(fileBuffer);

    return response(res, 201, `Berhasil mengimpor ${totalInserted} baris data master fisik SPPG ke database.`);
  } catch (error) {
    next(error);
  }
};

export const getMasterCsvHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const result = await sppgMasterService.getMasterSppg(page, limit);

    return response(res, 200, 'Berhasil mengambil data master fisik SPPG.', {
      data: result.data,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadMasterCsvHandler,
  getMasterCsvHandler,
};