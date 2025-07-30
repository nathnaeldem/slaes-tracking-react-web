import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'; // Added Alert
import { Text, Button, Input, Overlay } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropdownPicker from 'react-native-dropdown-picker';
import { useAuth } from '../context/AuthContext';
import axiosRetry from 'axios-retry'; // Import axios-retry
import { Picker } from '@react-native-picker/picker';

// Configure axios-retry for this component's API calls
// You could also set this up globally in a dedicated axios instance file if you have one.
axiosRetry(axios, {
  retries: 3, // Number of retry attempts
  retryDelay: (retryCount) => {
    return retryCount * 1000; // Exponential back-off: 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Retry only on network errors or 5xx status codes
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
  },
});

// Define the API URL directly in the component
const API_URL = 'https://dankula.x10.mx/auth.php';

const SpendingScreen = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('purchase');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown picker state
  const [openCategoryPicker, setOpenCategoryPicker] = useState(false);
  const [categoryItems, setCategoryItems] = useState([
    { label: 'Purchase', value: 'purchase' },
    { label: 'Logistics', value: 'logistics' },
    { label: 'Consumption', value: 'consumption' },
  ]);

  const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr'];

  const handleSubmit = async () => {
    // Basic validation before attempting submission
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter a reason for the spending.');
      return;
    }

    setError(null); // Clear previous errors
    setLoading(true); // Set loading to true
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const spendingData = {
        user_id: user.id,
        amount: parseFloat(amount),
        category,
        reason,
        comment,
        payment_method: paymentMethod,
        bank_name: paymentMethod === 'bank' ? bankName : null
      };

      const response = await axios.post(
        API_URL,
        spendingData,
        {
          params: { action: 'add_spending' },
          headers: headers,
        }
      );

      const responseData = response.data;

      if (responseData.success) {
        // Clear form
        setAmount('');
        setCategory('purchase');
        setReason('');
        setComment('');
        setPaymentMethod('cash');
        setBankName('');
        Alert.alert('Success', 'Spending recorded successfully!'); // Changed from alert to Alert.alert
      } else {
        // If the API returns success: false, it's a server-side validation/business logic error, not a network error.
        setError(responseData.message || 'Failed to record spending.');
        Alert.alert('Failed', responseData.message || 'Failed to record spending: Unknown error.'); // Changed from alert to Alert.alert
      }
    } catch (err) {
      console.error("Error recording spending:", err); // Log the full error

      // Check if the error is due to a network issue after all retries have failed
      if (axiosRetry.isNetworkError(err) || axiosRetry.isRetryableError(err)) {
        setError('Network Error: Could not connect to the server after multiple retries. Please check your internet connection.');
        Alert.alert('Network Error', 'Could not record spending due to a network problem after multiple retries. Please check your connection and try again.');
      } else {
        // Handle other types of errors (e.g., 4xx client errors, unexpected server responses)
        const message = err.response?.data?.message || err.message || 'An unexpected error occurred.';
        setError(message);
        Alert.alert('Error', 'Error recording spending: ' + message);
      }
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  const renderLoadingOverlay = () => (
    <Overlay isVisible={loading} overlayStyle={styles.overlay}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>Recording Spending...</Text>
    </Overlay>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={50} color="red" />
      <Text style={styles.errorMessage}>{error}</Text>
      <Button
        title="Retry"
        onPress={handleSubmit}
        buttonStyle={styles.retryButton}
        titleStyle={styles.retryButtonTitle}
        icon={<MaterialIcons name="refresh" size={20} color="#fff" style={{ marginRight: 5 }} />}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {renderLoadingOverlay()}
      {error && renderErrorState()}

      {/* Conditionally render form if not loading and no error */}
      {!loading && !error && (
        <View style={styles.form}>
          <Text h4 style={styles.title}>Record Spending</Text>

          <Input
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            leftIcon={<MaterialIcons name="attach-money" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Category</Text>
            <DropdownPicker
              open={openCategoryPicker}
              value={category}
              items={categoryItems}
              setOpen={setOpenCategoryPicker}
              setValue={setCategory}
              setItems={setCategoryItems}
              containerStyle={styles.dropdownContainer}
              style={styles.dropdownStyle}
              itemSeparator={true}
              itemSeparatorStyle={styles.itemSeparator}
              dropDownContainerStyle={styles.dropDownContainerStyle}
              textStyle={styles.dropdownText}
              labelStyle={styles.dropdownLabel}
              zIndex={3000}
              zIndexInverse={1000}
              placeholderStyle={styles.dropdownPlaceholder}
              listItemLabelStyle={styles.dropdownListItemLabel}
              selectedItemLabelStyle={styles.dropdownSelectedItemLabel}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text>Payment Method:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}>
              <TouchableOpacity 
                style={[styles.methodButton, paymentMethod === 'cash' && styles.selectedMethod]}
                onPress={() => setPaymentMethod('cash')}>
                <Text style={paymentMethod === 'cash' ? styles.selectedText : styles.methodText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodButton, paymentMethod === 'bank' && styles.selectedMethod]}
                onPress={() => setPaymentMethod('bank')}>
                <Text style={paymentMethod === 'bank' ? styles.selectedText : styles.methodText}>Bank</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {paymentMethod === 'bank' && (
            <View style={styles.inputContainer}>
              <Text>Select Bank:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}>
                {banks.map(bank => (
                  <TouchableOpacity 
                    key={bank}
                    style={[styles.bankButton, bankName === bank && styles.selectedBank]}
                    onPress={() => setBankName(bank)}>
                    <Text style={bankName === bank ? styles.selectedText : styles.methodText}>{bank}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Input
            placeholder="Reason"
            value={reason}
            onChangeText={setReason}
            leftIcon={<MaterialIcons name="description" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
          />

          <Button
            title="Record Spending"
            onPress={handleSubmit}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonTitle}
            disabled={loading || !amount || parseFloat(amount) <= 0 || !reason.trim()} // More robust disabling
            icon={<MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 5 }} />}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  inputContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#ddd',
    marginBottom: 20,
    paddingLeft: 5,
  },
  inputText: {
    color: '#333',
  },
  commentInputContainer: {
    minHeight: 80,
  },
  pickerContainer: {
    marginBottom: 20,
    zIndex: 2000,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    marginBottom: 8,
    fontWeight: '600',
  },
  dropdownContainer: {
    height: 50,
  },
  dropdownStyle: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderRadius: 10,
    borderWidth: 1,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#eee',
  },
  dropDownContainerStyle: {
    backgroundColor: '#fafafa',
    borderColor: '#ddd',
    borderRadius: 10,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownLabel: {
    color: '#333',
  },
  dropdownPlaceholder: {
    color: 'gray',
  },
  dropdownListItemLabel: {
    color: '#333',
  },
  dropdownSelectedItemLabel: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    marginTop: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginTop: 10,
  },
  retryButtonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingVertical: 8,
  },
  methodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  bankButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  selectedMethod: {
    backgroundColor: '#4CAF50',
  },
  selectedBank: {
    backgroundColor: '#4CAF50',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  methodText: {
    color: '#333',
  },
});

export default SpendingScreen;