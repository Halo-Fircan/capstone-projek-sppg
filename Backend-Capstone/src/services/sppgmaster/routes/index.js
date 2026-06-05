import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os'; // ─── TAMBAHKAN INI ───
import { uploadMasterCsvHandler, getMasterCsvHandler } from '../controller/sppgmaster-controller.js';
import authMiddleware from '../../../middlewares/auth.js';

const router = express.Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.csv') {
      return cb(new Error('Hanya diperbolehkan mengunggah berkas dengan format .csv'), false);
    }
    cb(null, true);
  }
});

router.post('/sppg/master/csv', authMiddleware, uploadMasterCsvHandler);
router.get('/sppg/master/csv', authMiddleware, getMasterCsvHandler);

export default router;