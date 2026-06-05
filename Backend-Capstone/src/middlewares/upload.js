import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import InvariantError from '../exceptions/invariant-error.js';
import { fileURLToPath } from 'url';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueID = nanoid(16);
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueID}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const isPDF = file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf';
  if (!isPDF) {
    return cb(new InvariantError('File is required to be a PDF'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

export const MulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new InvariantError('Ukuran file melebihi batas maksimal 5 MB'));
    }
    return next(new InvariantError(err.message));
  }
  next(err);
};

export default upload;