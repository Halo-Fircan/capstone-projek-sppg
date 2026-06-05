import fastapiService from '../services/fastapiService.js';
import sendResponse from '../../../utils/response.js';

const handleControllerError = (res, error, customMessage) => {
  console.error(`🚨 AI Controller Error: ${error.message}`);
  const statusCode = error.response ? error.response.status : 500;
  const detailError = error.response ? error.response.data : error.message;

  return sendResponse(res, statusCode, customMessage, detailError);
};

export const getPredict = async (req, res) => {
  try {
    const result = await fastapiService.predict(req.body);
    return sendResponse(res, 200, "Berhasil memproses prediksi", result);
  } catch (error) {
    handleControllerError(res, error, "Gagal memproses prediksi");
  }
};

export const getAnalyze = async (req, res) => {
  try {
    const result = await fastapiService.analyze(req.body);

    const mappedResult = {
      nama_wilayah: result.nama_wilayah || "Wilayah tidak diketahui",
      rekomendasi_kebijakan: result.rekomendasi_kebijakan || "",
      penjelasan_prediksi: result.penjelasan_prediksi || "",
      model_llm: result.model_llm || "",
      analisis_narasi: result.rekomendasi_kebijakan || "Analisis berhasil diproses"
    };

    return sendResponse(res, 200, "Berhasil memproses analisis AI", mappedResult);
  } catch (error) {
    handleControllerError(res, error, "Gagal memproses analisis AI");
  }
};

export const getPredictBatch = async (req, res) => {
  try {
    const result = await fastapiService.predictBatch(req.body);
    return sendResponse(res, 200, "Berhasil memproses prediksi batch massal", result);
  } catch (error) {
    console.error(`🚨 AI Batch Controller Error: ${error.message}`);
    const statusCode = error.response ? error.response.status : 500;
    const detailError = error.response ? error.response.data : error.message;
    return sendResponse(res, statusCode, "Gagal memproses prediksi batch", detailError);
  }
};

export const getPredictAndAnalyze = async (req, res) => {
  try {
    const wilayah = req.query.nama_wilayah || "Wilayah tidak disebutkan";
    const result = await fastapiService.predictAndAnalyze(wilayah, req.body);

    if (result && result.analisis_ai) {
      result.analisis_ai.analisis_narasi = result.analisis_ai.rekomendasi_kebijakan || "Analisis berhasil diproses";
    }

    return sendResponse(res, 200, "Berhasil memproses komparasi prediksi & analisis", result);
  } catch (error) {
    handleControllerError(res, error, "Gagal memproses komparasi prediksi & analisis");
  }
};

export const handleChat = async (req, res) => {
  try {
    const result = await fastapiService.chat(req.body);
    return sendResponse(res, 200, "Berhasil memproses chat", result);
  } catch (error) {
    handleControllerError(res, error, "Gagal memproses chat");
  }
};