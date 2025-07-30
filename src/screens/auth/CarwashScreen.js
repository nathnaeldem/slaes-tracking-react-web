import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const API = 'https://dankula.x10.mx/auth.php';
const api = axios.create({ baseURL: API, headers:{ 'Content-Type':'application/json' }, timeout:15000 });
axiosRetry(api, { retries:2, retryDelay:axiosRetry.exponentialDelay });

export default function CarwashTransactionManagement() {
  const [workers, setWorkers]     = useState([]);
  const [vehicles, setVehicles]   = useState([]);
  const [form, setForm] = useState({
    worker_ids: [], // Changed to array
    vehicle_id: null,
    wash_type: 'full',
    payment_method: null,
  });
  const [loading, setLoading]     = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionStatuses, setTransactionStatuses] = useState({});
  const [selectedBank, setSelectedBank] = useState('');
  
  // Predefined payment methods
  const paymentMethods = ['Cash', 'Institution', 'Bank'];
  const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr', 'Check'];

  const call = async (action, data = {}) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post(`?action=${action}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const wRes = await call('get_unpaid_workers');
        if (!wRes.success) throw new Error(wRes.message || 'Failed to fetch workers');
        setWorkers(wRes.workers);

        const vRes = await call('get_vehicles');
        if (!vRes.success) throw new Error(vRes.message || 'Failed to fetch vehicles');
        setVehicles(vRes.vehicles);

      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchDailyTransactions();
  }, []);

  // Reset bank selection when payment method changes
  useEffect(() => {
    if (form.payment_method !== 'Bank') {
      setSelectedBank('');
    }
  }, [form.payment_method]);

  const handleRecord = async () => {
    const { worker_ids, vehicle_id, wash_type, payment_method } = form;
    
    // Check for at least one worker selected
    if (!worker_ids.length || !vehicle_id || !payment_method) {
      return Alert.alert('Error', 'All fields are required. Please select at least one worker, vehicle, wash type, and payment method.');
    }
    
    // Validate bank selection if payment method is Bank
    if (payment_method === 'Bank' && !selectedBank) {
      return Alert.alert('Error', 'Please select a bank for bank transactions.');
    }
    
    setLoading(true);
    try {
      // Include bank name in form data if payment method is Bank
      const formData = {
        ...form,
        bank_name: payment_method === 'Bank' ? selectedBank : ''
      };
      
      const res = await call('create_carwash_transaction', formData);
      if (!res.success) throw new Error(res.message);
      Alert.alert('Success','Carwash transaction recorded successfully!');
      setForm({ worker_ids: [], vehicle_id: null, wash_type: 'full', payment_method: null });      // reload data
      setSelectedBank('');
      const wRes = await call('get_unpaid_workers');
      const vRes = await call('get_vehicles');
      setWorkers(wRes.success ? wRes.workers : []);
      setVehicles(vRes.success ? vRes.vehicles : []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyTransactions = async () => {
    setLoading(true);
    try {
      const res = await call('get_daily_carwash_transactions');
      if (!res.success) throw new Error(res.message || 'Failed to fetch daily transactions');

      const storedStatuses = await AsyncStorage.getItem('transactionStatuses');
      const statuses = storedStatuses ? JSON.parse(storedStatuses) : {};
      setTransactionStatuses(statuses);

      const transactionsWithStatus = res.transactions.map(tx => ({
        ...tx,
        status: statuses[tx.id] || 'not received'
      }));

      setTransactions(transactionsWithStatus);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTransactionStatus = async (transactionId) => {
    const newStatuses = { ...transactionStatuses };
    const currentStatus = newStatuses[transactionId] || 'not received';
    newStatuses[transactionId] = currentStatus === 'received' ? 'not received' : 'received';

    await AsyncStorage.setItem('transactionStatuses', JSON.stringify(newStatuses));
    setTransactionStatuses(newStatuses);

    setTransactions(prevTransactions =>
      prevTransactions.map(tx =>
        tx.id === transactionId ? { ...tx, status: newStatuses[transactionId] } : tx
      )
    );
  };

  const handlePay = async id => {
    setLoading(true);
    try {
      const res = await call('pay_commission', { worker_id: id });
      if (!res.success) throw new Error(res.message);
      Alert.alert('Success','Commission paid successfully!');
      const wRes = await call('get_unpaid_workers');
      setWorkers(wRes.success ? wRes.workers : []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingIndicator}/>}

      <Text style={styles.sectionTitle}>Record New Wash</Text>

      <Text style={styles.label}>Select Worker</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollContainer}>
        {workers.map(item => (
          <TouchableOpacity
            key={String(item.id)}
            style={[styles.choice, form.worker_ids.includes(item.id) && styles.choiceActive]}
            onPress={() => {
              setForm(f => {
                const newIds = f.worker_ids.includes(item.id)
                  ? f.worker_ids.filter(id => id !== item.id)
                  : [...f.worker_ids, item.id];
                return {...f, worker_ids: newIds};
              });
            }}
          >
            <Text style={[styles.choiceText, form.worker_ids.includes(item.id) && styles.choiceTextActive]}>
              {item.name} ({item.unpaid_commission || '0.00'} ETB)
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Select Vehicle</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollContainer}>
        {vehicles.map(item => (
          <TouchableOpacity
            key={String(item.id)}
            style={[styles.choice, form.vehicle_id === item.id && styles.choiceActive]}
            onPress={() => setForm(f => ({ ...f, vehicle_id: item.id }))}
          >
            <Text style={[styles.choiceText, form.vehicle_id === item.id && styles.choiceTextActive]}>
                {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Wash Type</Text>
      <View style={styles.row}>
        {['full','partial'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.choice, form.wash_type === t && styles.choiceActive]}
            onPress={() => setForm(f => ({ ...f, wash_type: t }))}
          >
            <Text style={[styles.choiceText, form.wash_type === t && styles.choiceTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.row}>
        {paymentMethods.map(method => (
          <TouchableOpacity
            key={method}
            style={[styles.choice, form.payment_method === method && styles.choiceActive]}
            onPress={() => setForm(f => ({ ...f, payment_method: method }))}
          >
            <Text style={[styles.choiceText, form.payment_method === method && styles.choiceTextActive]}>
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bank Selection */}
      {form.payment_method === 'Bank' && (
        <>
          <Text style={styles.label}>Select Bank</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScrollContainer}
          >
            {banks.map(bank => (
              <TouchableOpacity
                key={bank}
                style={[
                  styles.choice, 
                  selectedBank === bank && styles.choiceActive
                ]}
                onPress={() => setSelectedBank(bank)}
              >
                <Text style={[
                  styles.choiceText,
                  selectedBank === bank && styles.choiceTextActive
                ]}>
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRecord}
        disabled={loading}
      >
        <Text style={styles.btnText}>Record Wash Transaction</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <Text style={styles.sectionTitle}>Unpaid Commissions</Text>
      {workers.filter(w => parseFloat(w.unpaid_commission) > 0).length === 0 ? (
        <Text style={styles.emptyListText}>No unpaid commissions at the moment.</Text>
      ) : (
        <View>
          {workers.filter(w => parseFloat(w.unpaid_commission) > 0).map(item => (
            <View key={String(item.id)} style={styles.payRow}>
              <Text style={styles.payRowText}>
                {item.name}: <Text style={styles.commissionAmount}>{parseFloat(item.unpaid_commission).toFixed(2)} ETB</Text>
              </Text>
              <TouchableOpacity onPress={() => handlePay(item.id)} style={styles.payButton}>
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.separator} />

      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={styles.sectionTitle}>Daily Transactions</Text>
        <TouchableOpacity onPress={fetchDailyTransactions} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {transactions.length > 0 ? (
        <View>
          {transactions.map((tx) => (
            <View style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionVehicle}>{tx.vehicle_type} - {tx.plate_number}</Text>
                <Text style={styles.transactionAmount}>${parseFloat(tx.total_amount).toFixed(2)}</Text>
              </View>
              <View style={styles.transactionBody}>
                <Text style={styles.transactionDetailText}>Wash Type: {tx.wash_type}</Text>
                <Text style={styles.transactionDetailText}>Time: {new Date(tx.transaction_date).toLocaleTimeString()}</Text>
              </View>
              <View style={styles.transactionFooter}>
                <Text style={{
                  ...styles.statusText,
                  color: transactionStatuses[tx.id] === 'received' ? '#4CAF50' : '#F44336'
                }}>
                  Status: {transactionStatuses[tx.id] || 'not received'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    transactionStatuses[tx.id] === 'received'
                      ? styles.toggleButtonReceived
                      : styles.toggleButtonNotReceived,
                  ]}
                  onPress={() => toggleTransactionStatus(tx.id)} >
                  <Text style={[
                      styles.toggleButtonText,
                      transactionStatuses[tx.id] === 'received'
                        ? styles.toggleButtonTextReceived
                        : styles.toggleButtonTextNotReceived,
                    ]}>
                    {transactionStatuses[tx.id] === 'received' ? 'Mark Not Received' : 'Mark as Received'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyListText}>No transactions for today.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5', // Light gray background
  },
  loadingIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    marginTop: 15,
    marginBottom: 8,
  },
  horizontalScrollContainer: {
    marginBottom: 10, // Add some bottom margin
  },
  choice: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Lighter gray border
    borderRadius: 8, // More rounded corners
    marginRight: 10,
    backgroundColor: '#FFFFFF', // White background for choices
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  choiceActive: {
    borderColor: '#FFC107', // Amber for active
    backgroundColor: '#FFF8E1', // Lighter amber background
  },
  choiceText: {
    color: '#333333',
    fontWeight: '500',
  },
  choiceTextActive: {
    color: '#B77C00', // Darker amber text for active
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap', // Allow choices to wrap to the next line
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: '#4CAF50', // Green primary button
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7', // Lighter green when disabled
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 30,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  payRowText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  commissionAmount: {
    fontWeight: 'bold',
    color: '#D32F2F', // Red for unpaid amounts
  },
  payButton: {
    backgroundColor: '#2196F3', // Blue for pay action
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleButtonReceived: {
    backgroundColor: '#E8F5E9', // Light Green
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  toggleButtonNotReceived: {
    backgroundColor: '#FFEBEE', // Light Red
    borderColor: '#F44336',
    borderWidth: 1,
  },
  toggleButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleButtonTextReceived: {
    color: '#2E7D32', // Dark Green
  },
  toggleButtonTextNotReceived: {
    color: '#C62828', // Dark Red
  },
  refreshButton: {
    backgroundColor: '#FF9800', // Orange for refresh
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionVehicle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  transactionBody: {
    marginBottom: 12,
  },
  transactionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionDetailText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 4,
  },
  transactionDetailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionTimeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  transactionDetailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  transactionTimeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777777',
  }
});