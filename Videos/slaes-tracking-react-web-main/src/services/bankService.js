import api2 from './api2';

/**
 * Records a new bank deposit.
 * @param {object} depositData - The data for the new deposit.
 * @returns {Promise<object>} The response data from the API.
 */
export const recordBankDeposit = async (depositData) => {
  try {
    const response = await api2.post('', depositData, {
      params: {
        action: 'add_bank_deposit',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error recording bank deposit:', error);
    throw error.response?.data || { success: false, message: 'An unexpected error occurred.' };
  }
};
