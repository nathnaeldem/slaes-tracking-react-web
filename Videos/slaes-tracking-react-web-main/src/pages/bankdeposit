import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Input, Overlay } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropdownPicker from 'react-native-dropdown-picker';
import { useAuth } from '../context/AuthContext';
import axiosRetry from 'axios-retry';

// Configure axios-retry
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => 
    axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error)
});

const API_URL = 'https://dankula.x10.mx/auth.php';

const BankDepositScreen = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('CBE');
  const [accountNumber, setAccountNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bank dropdown state
  const [openBankPicker, setOpenBankPicker] = useState(false);
  const [bankItems, setBankItems] = useState([
    { label: 'CBE', value: 'CBE' },
    { label: 'Awash', value: 'Awash' },
    { label: 'Dashen', value: 'Dashen' },
    { label: 'Abyssinia', value: 'Abyssinia' },
    { label: 'Birhan', value: 'Birhan' },
    { label: 'Telebirr', value: 'Telebirr' },
  ]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const depositData = {
        user_id: user.id,
        organization_id: user.organization_id,
        bank_name: bankName,
        account_number: accountNumber,
        amount: parseFloat(amount),
        deposit_date: depositDate,
        reference_number: referenceNumber,
        comment,
      };

      const response = await axios.post(
        API_URL,
        depositData,
        {
          params: { action: 'add_bank_deposit' },
          headers: headers,
        }
      );

      const responseData = response.data;

      if (responseData.success) {
        // Clear form
        setAmount('');
        setBankName('CBE');
        setAccountNumber('');
        setReferenceNumber('');
        setComment('');
        Alert.alert('Success', 'Bank deposit recorded successfully!');
      } else {
        setError(responseData.message || 'Failed to record deposit.');
        Alert.alert('Failed', responseData.message || 'Failed to record deposit.');
      }
    } catch (err) {
      console.error("Error recording deposit:", err);
      setError('Network Error: Could not connect to the server.');
      Alert.alert('Error', 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const renderLoadingOverlay = () => (
    <Overlay isVisible={loading} overlayStyle={styles.overlay}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>Recording Deposit...</Text>
    </Overlay>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={50} color="red" />
      <Text style={styles.errorMessage}>{error}</Text>
      <Button
        title="Try Again"
        onPress={() => setError(null)}
        buttonStyle={styles.retryButton}
        titleStyle={styles.retryButtonTitle}
        icon={<MaterialIcons name="refresh" size={20} color="#fff" style={{ marginRight: 5 }} />}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      {error ? renderErrorState() : (
        <View style={styles.form}>
          <Text h4 style={styles.title}>Record Bank Deposit</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Bank Name</Text>
            <DropdownPicker
              open={openBankPicker}
              value={bankName}
              items={bankItems}
              setOpen={setOpenBankPicker}
              setValue={setBankName}
              setItems={setBankItems}
              placeholder="Select Bank"
              style={styles.dropdownContainer}
              dropDownContainerStyle={styles.dropDownContainerStyle}
              textStyle={styles.dropdownText}
              labelStyle={styles.dropdownLabel}
              placeholderStyle={styles.dropdownPlaceholder}
              listItemLabelStyle={styles.dropdownListItemLabel}
              selectedItemLabelStyle={styles.dropdownSelectedItemLabel}
              itemSeparatorStyle={styles.itemSeparator}
              listMode="SCROLLVIEW"
              scrollViewProps={{ nestedScrollEnabled: true }}
            />
          </View>

          <Input
            placeholder="Account Number (Optional)"
            value={accountNumber}
            onChangeText={setAccountNumber}
            leftIcon={<MaterialIcons name="account-balance" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            keyboardType="numeric"
          />

          <Input
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            leftIcon={<MaterialIcons name="attach-money" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            keyboardType="numeric"
          />

          <Input
            placeholder="Deposit Date"
            value={depositDate}
            onChangeText={setDepositDate}
            leftIcon={<MaterialIcons name="date-range" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
          />

          <Input
            placeholder="Reference Number (Optional)"
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            leftIcon={<MaterialIcons name="receipt" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
          />

          <Input
            placeholder="Comment (Optional)"
            value={comment}
            onChangeText={setComment}
            leftIcon={<MaterialIcons name="comment" size={24} color="gray" />}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            multiline={true}
          />

          <Button
            title="Record Deposit"
            onPress={handleSubmit}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonTitle}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            icon={<MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 5 }} />}
          />
        </View>
      )}
      {renderLoadingOverlay()}
    </ScrollView>
  );
};

// Reuse the same styles from SpendingScreen
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
});

export default BankDepositScreen;
