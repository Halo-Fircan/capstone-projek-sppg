import { Router } from 'express';
import sppgAnalysesController from '../controller/sppganalyses-controller.js';

const router = Router();
const controller = new sppgAnalysesController();

router.post('/api/sppg-analyses', controller.postAnalyzeHandler);
router.get('/api/sppg-analyses', controller.getAnalysesHandler);

export default router;