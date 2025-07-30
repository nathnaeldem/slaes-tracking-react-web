import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input, Text } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import axiosRetry from 'axios-retry'; // Import axios-retry
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://dankula.x10.mx/auth.php'; // Define API URL

// --- Configure an Axios instance for product editing operations ---
const productEditApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Set a timeout (e.g., 15 seconds) to trigger retries on slow responses
});

// Apply axios-retry to the productEditApi instance
axiosRetry(productEditApi, {
  retries: 3, // Number of retry attempts
  retryDelay: (retryCount) => {
    return retryCount * 1000; // Exponential backoff: 1s, 2s, 4s
  },
  retryCondition: (error) => {
    // Retry only on network errors (timeouts, no internet, etc.)
    // or 5xx server errors (transient server issues)
    return axiosRetry.isNetworkError(error) || axiosRetry.isIdempotentRequestError(error);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Product edit API retry attempt ${retryCount} for ${requestConfig.url}: ${error.message}`);
    // Optional: provide subtle user feedback during retries
  },
});
// --- End Axios instance configuration ---


const EditProductScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { user } = useAuth(); // Assuming useAuth provides the current user details

  // Form state, initialized with product data from route params
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  // Ensure numeric values are converted to string for Input components
  const [importPrice, setImportPrice] = useState(product.import_price?.toString() || '');
  const [sellingPrice, setSellingPrice] = useState(product.selling_price?.toString() || '');
  const [quantity, setQuantity] = useState(product.quantity?.toString() || '');
  const [status, setStatus] = useState(product.status || 'in_store'); // Default status if not provided
  const [loading, setLoading] = useState(false);

  // You might want to add validation here as well, similar to AddProductScreen
  // using Yup and Formik, but for this fix, we'll focus on the Axios part.

  const handleUpdateProduct = async () => {
    // Basic client-side validation (can be enhanced with Yup)
    if (!name || !importPrice || !sellingPrice || !quantity) {
      Alert.alert('Validation Error', 'Please fill all required fields (Name, Import Price, Selling Price, Quantity).');
      return;
    }
    if (parseFloat(sellingPrice) <= parseFloat(importPrice)) {
        Alert.alert('Validation Error', 'Selling price must be greater than import price.');
        return;
    }
    if (user?.role !== 'admin') {
      Alert.alert('Authorization Error', 'Only admins can update products.');
      return;
    }

    setLoading(true); // Start loading state
    try {
      const updatedProduct = {
        product_id: product.id,
        name,
        description,
        import_price: parseFloat(importPrice),
        selling_price: parseFloat(sellingPrice),
        quantity: parseInt(quantity),
        status // Send current status, even if not directly editable by user on this screen
      };

      const token = await AsyncStorage.getItem('token');
     // Set the Authorization header dynamically on the productEditApi instance
      if (token) {
        productEditApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        // Ensure Authorization header is removed if no token (though unlikely for an authenticated action)
        delete productEditApi.defaults.headers.common['Authorization'];
      }

      // Use the configured productEditApi instance for the request
      const response = await productEditApi.post(
        '', // Empty string as baseURL already includes the full URL
        updatedProduct,
        {
          params: { action: 'updateProduct' },
          // No need to pass headers here; they are set on the instance's defaults
        }
      );

      // Axios-retry will only let the error propagate if all retries fail,
      // or if the error condition is not met (e.g., 401 Unauthorized).
      if (response.data && response.data.success) {
        Alert.alert('Success', 'Product updated successfully');
        navigation.goBack(); // Navigate back to the previous screen (e.g., ProductList)
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update product.');
      }
    } catch (err) {
      console.error('Update product error:', err); // Log the full error object for better debugging

      let errorMessage = 'An unexpected error occurred during product update.';
      if (axios.isAxiosError(err)) { // Check if it's an Axios error
        if (err.response) {
          // Server responded with a status code outside 2xx (e.g., 400, 403, 404)
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
        } else if (err.request) {
          // Request was made but no response received (after all retries)
          console.error('Request:', err.request);
          errorMessage = 'Network error: No response from server after multiple attempts.';
        } else {
          // Something else happened (e.g., setting up the request)
          console.error('Error message:', err.message);
          errorMessage = err.message || 'An unknown error occurred.';
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Product Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter product name"
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Enter product description"
        multiline
      />

      <Input
        label="Import Price"
        value={importPrice}
        onChangeText={setImportPrice}
        keyboardType="numeric"
      />

      <Input
        label="Selling Price"
        value={sellingPrice}
        onChangeText={setSellingPrice}
        keyboardType="numeric"
      />

      <Input
        label="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      {/* You might also want to add a status picker if status is editable by the user */}
      {/* <Input
        label="Status"
        value={status}
        onChangeText={setStatus}
        placeholder="e.g., in_store, sold_out"
      /> */}

      <Button
        title="Save Changes"
        loading={loading}
        onPress={handleUpdateProduct}
        buttonStyle={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5', // Added a background color for consistency
  },
  saveButton: {
    backgroundColor: '#3498db',
    marginTop: 20,
  }
});

export default EditProductScreen;