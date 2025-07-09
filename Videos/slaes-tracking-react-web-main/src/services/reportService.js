import api from './api2';

export const getAnalyticsAndReports = (startDate, endDate) => {
  return api.get('?action=getAnalyticsAndReports', {
    params: { 
      start_date: startDate,
      end_date: endDate
    } 
  });
};

export const getReportData = (startDate, endDate) => {
  return api.get('?action=get_report_data', { 
    params: { start: startDate, end: endDate } 
  });
};


// Add the missing function
export const getDashboardStats = () => {
  return api.get('?action=dashboard_stats');
};

// Keep existing functions
export const getSalesData = (startDate, endDate) => 
  api.get('?action=get_sales_data', { params: { start: startDate, end: endDate } });

export const getProductPerformance = () => 
  api.get('?action=get_product_performance');

export const getCommissionReport = () => 
  api.get('?action=get_commission_report');