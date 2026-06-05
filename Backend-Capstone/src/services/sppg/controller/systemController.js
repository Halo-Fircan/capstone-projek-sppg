import fastapiService from '../services/fastapiService.js';
import sendResponse from '../../../utils/response.js';

export const checkHealth = async (req, res) => {
  try {
    const fastapiStatus = await fastapiService.checkHealth();
    return sendResponse(res, 200, "Backend Express Berjalan Normal!", {
      express_status: "OK",
      ai_engine_status: fastapiStatus
    });
  } catch (error) {
    console.error(`🚨 System Controller Error: ${error.message}`);
    return sendResponse(res, 500, "Express OK, tetapi AI Engine bermasalah", {
      express_status: "OK",
      ai_engine_status: "Gagal terhubung ke FastAPI",
      error: error.message
    });
  }
};