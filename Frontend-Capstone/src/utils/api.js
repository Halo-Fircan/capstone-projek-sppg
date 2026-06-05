import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api-proxy' : 'https://backend-capstone-naufalms29s-projects.vercel.app',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    // Membaca token (mendukung beberapa variasi nama key saat login)
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('userToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/** =========================================================================
 * 1. FEATURE: DASHBOARD SUMMARY
 * ========================================================================= */
export const fetchDashboardSummary = async () => {
  try {
    const response = await api.get('/api/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

/** =========================================================================
 * 2. FEATURE: MANAJEMEN MASTER FISIK SPPG (DataSPPG.jsx)
 * ========================================================================= */

// A. Mengambil Semua Data Riwayat Analisis / Master SPPG yang tersimpan
export const getMasterSppgData = async (page = 1, limit = 100, search = "") => {
  try {
    // Tambahkan query param &search= ke dalam URL endpoint
    const response = await api.get(`/api/sppg/master/csv?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching master sppg data:', error);
    throw error;
  }
};

export const uploadMasterSppgCsv = async (payload) => {
  try {
    const response = await api.post('/api/sppg/master/csv', payload);
    return response.data;
  } catch (error) {
    console.error('Error uploading master csv:', error);
    throw error;
  }
};

/** =========================================================================
 * 3. FEATURE: PREDIKSI MASSAL BATCH CSV SISWA (PusatInteligensi.jsx)
 * ========================================================================= */

// A. Unggah CSV Siswa untuk dianalisis AI (Sesuai dokumen: /api/sppg-predict-csv/upload)
export const uploadSppgPredictCsv = async (formData) => {
  try {
    const response = await api.post('/api/sppg-predict-csv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading prediction csv:', error);
    throw error;
  }
};

export default api;