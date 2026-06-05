import DashboardService from '../services/dashboard-service.js';
import response from '../../../utils/response.js';

const dashboardService = new DashboardService();

export const getDashboardSummaryHandler = async (req, res, next) => {
  try {
    const summaryData = await dashboardService.getDashboardSummary();

    return response(res, 200, 'Ringkasan data dashboard berhasil dimuat secara berkala.', summaryData);
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardSummaryHandler,
};