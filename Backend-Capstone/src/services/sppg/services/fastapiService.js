import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FASTAPI_URL = process.env.FASTAPI_URL || "https://fkaslana-capstone-projek.hf.space";

class FastAPIService {
  async checkHealth() {
    const response = await axios.get(`${FASTAPI_URL}/health`);
    return response.data;
  }

  async predict(data) {
    const response = await axios.post(`${FASTAPI_URL}/predict`, data);
    return response.data;
  }

  async predictBatch(batchData) {
    const response = await axios.post(`${FASTAPI_URL}/predict/batch`, batchData);
    return response.data;
  }

  async analyze(data) {
    const response = await axios.post(`${FASTAPI_URL}/analyze`, data);
    return response.data;
  }

  async predictAndAnalyze(wilayah, data) {
    const response = await axios.post(
      `${FASTAPI_URL}/predict-and-analyze?nama_wilayah=${encodeURIComponent(wilayah)}`,
      data
    );
    return response.data;
  }

  async chat(chatData) {
    const response = await axios.post(`${FASTAPI_URL}/chat`, chatData);
    return response.data;
  }
}

export default new FastAPIService();