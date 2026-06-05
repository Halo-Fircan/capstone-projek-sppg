import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const fastApiClient = axios.create({
  baseURL: process.env.FASTAPI_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default fastApiClient;