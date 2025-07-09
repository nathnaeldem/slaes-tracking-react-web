import api from './api';

export const getProducts = async () => {
  try {
    const response = await api.get('?action=get_products');
    return response;
  } catch (error) {
    return {
      data: error.response?.data || { message: 'Product fetch failed' },
      status: error.response?.status || 500
    };
  }
};

export const createProduct = (product) => 
  api.post('?action=create_product', product);

export const updateProduct = (id, updates) => 
  api.post('?action=update_product', { id, ...updates });

export const deleteProduct = (id) => 
  api.post('?action=delete_product', { id });