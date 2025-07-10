import api2 from './api2';

/**
 * Records a new spending entry.
 * @param {object} spendingData - The data for the new spending record.
 * @returns {Promise<object>} The response data from the API.
 */
export const recordSpending = async (spendingData) => {
  try {
    const response = await api2.post('', spendingData, {
      params: {
        action: 'add_spending',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error recording spending:', error);
    // Re-throw the error to be handled by the calling component
    throw error.response?.data || { success: false, message: 'An unexpected error occurred.' };
  }
};
