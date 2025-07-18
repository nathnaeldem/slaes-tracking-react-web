import api2 from './api2';

export const getProducts = async () => {
  try {
    const response = await api2.post('', {}, {
      params: { action: 'getProducts' },
    });
    return response.data.products.filter(
      (product) => product.status === 'in_store' && product.quantity > 0
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getDailySales = async () => {
  try {
    const response = await api2.post('', {}, {
        params: { action: 'get_daily_sales2' },
    });
    return response.data;
  } catch (error) {
    console.error('Fetch daily sales error:', error);
    throw error;
  }
};

export const checkout = async (checkoutData) => {
  try {
    const response = await api2.post('', checkoutData, {
      params: { action: 'checkout' },
    });
    return response.data;
  } catch (error) {
    console.error('Error during checkout:', error);
    throw error;
  }
};

export const getNewTransactions = async () => {
  try {
    const response = await api2.post('', {}, {
      params: { action: 'getNewTransactions' },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching new transactions:', error);
    throw error;
  }
};

export const payTransaction = async (transactionId, paidAmount) => {
  try {
    const response = await api2.post('', { transaction_id: transactionId, paid_amount: paidAmount }, {
      params: { action: 'payTransaction' },
    });
    return response.data;
  } catch (error) {
    console.error('Error paying transaction:', error);
    throw error;
  }
};

export const deleteSale = async (saleId) => {
    try {
        const response = await api2.post('', { sale_id: saleId }, {
            params: { action: 'delete_sale' },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting sale:', error);
        throw error;
    }
};
