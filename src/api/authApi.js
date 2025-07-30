import axios from 'axios';
import axiosRetry from 'axios-retry'; // Import axios-retry

// Replace with your actual API base URL
const API_URL = 'https://dankula.x10.mx/auth.php';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // IMPORTANT: Set a reasonable timeout (e.g., 15 seconds)
                  // This ensures requests don't hang indefinitely and triggers retries.
});

// Configure axios-retry for the 'api' instance
axiosRetry(api, {
  retries: 3, // Number of retry attempts (e.g., 3 retries means 1 initial attempt + 3 retries = 4 total attempts)
  retryDelay: (retryCount) => {
    // Exponential backoff: 1st retry after 1 second, 2nd after 2 seconds, 3rd after 4 seconds
    return retryCount * 1000;
  },
  retryCondition: (error) => {
    // Retry on network errors (e.g., 'ECONNABORTED' for timeout, no internet)
    // and 5xx server errors (server issues)
    return axiosRetry.isNetworkError(error) || axiosRetry.isIdempotentRequestError(error);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt ${retryCount} for ${requestConfig.url}: ${error.message}`);
    // Optional: You can add a subtle UI feedback here, like a small toast message
    // "Retrying request..." (be careful not to spam the user)
  },
});


// Add defaults to authApi
const authApi = {
  // Expose the defaults from the configured 'api' instance
  defaults: api.defaults,

  addSpending: async (spendingData) => {
    try {
      // All calls through 'api' will now benefit from retries and timeouts
      const response = await api.post('', spendingData, {
        params: { action: 'add_spending' }
      });
      return response.data;
    } catch (error) {
      console.error('Error in addSpending:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to record spending. Please try again.'
      );
    }
  },

  login: async (username, password) => {
    try {
      const response = await api.post('', {
        username,
        password
      }, {
        params: { action: 'login' }
      });

      return {
        user: response.data.user,
        token: response.data.token,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error in login:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.'
      );
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('', userData, {
        params: { action: 'register' }
      });
      return {
        message: response.data.message
      };
    } catch (error) {
      console.error('Error in register:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    }
  },

  resetPassword: async (email) => {
    try {
      const response = await api.post('', { email }, {
        params: { action: 'reset' }
      });
      return {
        message: response.data.message
      };
    } catch (error) {
      console.error('Error in resetPassword:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Password reset failed. Please try again.'
      );
    }
  },

  // Add these new product management functions
  getProducts: async () => {
    try {
      const response = await api.post('', {}, {
        params: { action: 'getProducts' }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getProducts:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch products. Please try again.'
      );
    }
  },
  getUnpaidTransactions: async () => {
    try {
      const response = await api.post('', {}, {
        params: { action: 'get_unpaid_transactions' }
      });
      return response.data;
    } catch (error) {
      // Error handling
    }
  },

  getProductDetails: async (productId) => {
    try {
      const response = await api.post('', {}, {
        params: { action: 'getProductDetails', productId }
      });
      return response.data;
    } catch (error) {
      console.error('Error in getProductDetails:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch product details. Please try again.'
      );
    }
  },

  addProduct: async (productData) => {
    try {
      const response = await api.post('', productData, {
        params: { action: 'addProduct' }
      });
      return response.data;
    } catch (error) {
      console.error('Error in addProduct:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to add product. Please try again.'
      );
    }
  },

  updateProductStatus: async (productId, status, quantity) => {
    try {
      const response = await api.post('', {
        product_id: productId,
        new_status: status,
        quantity: quantity
      }, {
        params: { action: 'updateProductStatus' }
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateProductStatus:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to update product status. Please try again.'
      );
    }
  },

  updateProduct: async (productData) => {
    try {
      const response = await api.post('', productData, {
        params: { action: 'updateProduct' }
      });
      return response.data;
    } catch (error) {
      console.error('Error in updateProduct:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to update product. Please try again.'
      );
    L}
  },

  sellProduct: async (saleData) => {
    try {
      const response = await api.post('', saleData, {
        params: { action: 'sellProduct' }
      });
      return response.data;
    } catch (error) {
      console.error('Error in sellProduct:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to process sale. Please try again.'
      );
    }
  },

  getReports: async (timeframe) => {
    console.log('getReports called with timeframe:', timeframe);
    try {
      const response = await api.post('', { timeframe }, {
        params: { action: 'get_reports' }
      });
      console.log('getReports response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getReports error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load reports. Please try again.'
      );
    }
  },
};

export { authApi };
export default api;