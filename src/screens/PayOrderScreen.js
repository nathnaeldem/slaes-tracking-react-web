import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Button, Card } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://dankula.x10.mx/auth.php';

const PayOrderScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(order.unpaid_amount)) {
      Alert.alert('Error', 'Amount exceeds unpaid balance');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const payload = {
        action: 'payOrderCredit',
        order_id: order.id,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        bank_name: bankName
      };

      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Payment recorded successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Text style={styles.title}>Pay Credit for Order #{order.id}</Text>
        <Text style={styles.productName}>{order.product_name}</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Unpaid Amount:</Text>
          <Text style={styles.detailValue}>{order.unpaid_amount} ብር</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Payment Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.pickerContainer}>
          <Button
            title="Cash"
            type={paymentMethod === 'cash' ? 'solid' : 'outline'}
            onPress={() => setPaymentMethod('cash')}
            buttonStyle={styles.methodButton}
          />
          <Button
            title="Bank"
            type={paymentMethod === 'bank' ? 'solid' : 'outline'}
            onPress={() => setPaymentMethod('bank')}
            buttonStyle={styles.methodButton}
          />
        </View>
        
        {paymentMethod === 'bank' && (
          <TextInput
            style={styles.input}
            placeholder="Bank Name"
            value={bankName}
            onChangeText={setBankName}
          />
        )}
        
        <Button
          title="Record Payment"
          buttonStyle={styles.submitButton}
          onPress={handleSubmit}
          loading={loading}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  card: {
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2d3436',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0984e3',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  detailLabel: {
    fontSize: 16,
    color: '#636e72',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3436',
    marginVertical: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  methodButton: {
    width: '48%',
    borderRadius: 8,
    height: 48,
  },
  submitButton: {
    backgroundColor: '#00b894',
    borderRadius: 8,
    height: 48,
    marginTop: 10,
  },
});

export default PayOrderScreen;