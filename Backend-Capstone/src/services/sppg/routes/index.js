import { Router } from 'express';
import {
  getAnalyze,
  getPredict,
  getPredictBatch,
  getPredictAndAnalyze,
  handleChat
} from '../controller/aiController.js';
import { checkHealth } from '../controller/systemController.js';

const sppgRouter = Router();

sppgRouter.get('/api/health', checkHealth);
sppgRouter.post('/api/predict', getPredict);
sppgRouter.post('/api/predict/batch', getPredictBatch);
sppgRouter.post('/api/analyze', getAnalyze);
sppgRouter.post('/api/predict-and-analyze', getPredictAndAnalyze);
sppgRouter.post('/api/chat', handleChat);

export default sppgRouter;