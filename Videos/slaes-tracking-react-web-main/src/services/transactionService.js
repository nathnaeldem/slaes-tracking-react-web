import api2 from './api2';

/**
 * Fetches all transactions (sales, expenses, deposits) within a date range.
 * @param {string} startDate - The start date in 'YYYY-MM-DD' format.
 * @param {string} endDate - The end date in 'YYYY-MM-DD' format.
 * @returns {Promise<object>} The response data from the API.
 */
export const getAllTransactions = async (startDate, endDate) => {
  try {
    const response = await api2.post('', {},
      {
        params: {
          action: 'getAnalyticsAndReports', // This action already returns all data we need
          start_date: startDate,
          end_date: endDate,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error.response?.data || { success: false, message: 'An unexpected error occurred.' };
  }
};
