import express from 'express';
import ChatbotController from '../controller/chatbot-controller.js';
import authenticationMiddleware from '../../../middlewares/auth.js';

const router = express.Router();
const chatbotController = new ChatbotController();

router.post('/api/sessions', authenticationMiddleware, chatbotController.postSessionHandler);
router.get('/api/sessions', authenticationMiddleware, chatbotController.getSessionsHandler);
router.get('/api/sessions/:sessionId/messages', authenticationMiddleware, chatbotController.getMessagesHandler);
router.post('/api/messages', authenticationMiddleware, chatbotController.postMessageHandler);

router.post('/api/public-chat', chatbotController.postPublicMessageHandler);

export default router;