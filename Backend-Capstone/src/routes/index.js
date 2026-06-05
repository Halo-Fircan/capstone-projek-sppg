import { Router } from 'express';
import fastapiRoutes from '../services/sppg/routes/index.js';
import sppgAnalysesRoutes from '../services/sppganalyses/routes/index.js';
import sppgPredictCsvRoutes from '../services/sppgpredictcsv/routes/index.js';
import chatbotRoutes from '../services/chatbot/routes/index.js';
import sppgMasterRoutes from '../services/sppgmaster/routes/index.js';
import dashboardRoutes from '../services/dashboard/routes/index.js';
import users from '../services/users/routes/index.js';
import authentications from '../services/authentications/routes/index.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: "Welcome to Capstone API" });
});
router.use('/', fastapiRoutes);
router.use('/', sppgAnalysesRoutes);
router.use('/api', sppgPredictCsvRoutes);
router.use('/', chatbotRoutes);
router.use('/api', sppgMasterRoutes);
router.use('/', dashboardRoutes);
router.use('/', users);
router.use('/', authentications);

export default router;