import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  FlatList, 
  Button, 
  TextInput,
  TouchableOpacity 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://dankula.x10.mx/';

const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr', 'Check'];

const NewTransactionsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paidAmounts, setPaidAmounts] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [selectedBanks, setSelectedBanks] = useState({});

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('[DEBUG] Making request to:', API_BASE_URL + 'auth.php?action=getNewTransactions');
      const response = await axios.post(
        API_BASE_URL + 'auth.php',
        {},
        {
          params: { action: 'getNewTransactions' },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        console.log(`[DEBUG] Received ${response.data.transactions.length} transactions`);
        console.log('[DEBUG] Transactions:', response.data.transactions);
        setTransactions(response.data.transactions);
        const initialMethods = {};
        const initialBanks = {};
        response.data.transactions.forEach(t => {
          initialMethods[t.id] = 'cash';
          initialBanks[t.id] = 'CBE';
        });
        setPaymentMethods(initialMethods);
        setSelectedBanks(initialBanks);
      } else {
        throw new Error(response.data.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('[DEBUG] Error details:', err.response ? err.response.data : err.message);
      setError(`Failed to load transactions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatDate = dateString => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = amount => `ETB ${Number(amount).toFixed(2)}`;

  const calculateTransactionTotal = items =>
    items.reduce((total, item) => total + item.quantity * item.unit_price, 0);

  const updatePaidAmount = (transactionId, text) => {
    setPaidAmounts(prev => ({ ...prev, [transactionId]: text }));
  };

  const updatePaymentMethod = (transactionId, method) => {
    setPaymentMethods(prev => ({ ...prev, [transactionId]: method }));
  };

  const updateSelectedBank = (transactionId, bank) => {
    setSelectedBanks(prev => ({ ...prev, [transactionId]: bank }));
  };

  const handlePay = async (transactionId) => {
    const paidAmount = paidAmounts[transactionId];
    if (!paidAmount || isNaN(paidAmount) || parseFloat(paidAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const paymentMethod = paymentMethods[transactionId];
    if (paymentMethod === 'bank' && !selectedBanks[transactionId]) {
      alert('Please select a bank for bank payment.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const paymentData = {
        transaction_id: transactionId,
        paid_amount: parseFloat(paidAmount),
        payment_method: paymentMethod
      };

      if (paymentMethod === 'bank') {
        paymentData.bank_name = selectedBanks[transactionId];
      }

      const response = await axios.post(
        API_BASE_URL + 'auth.php?action=payTransaction',
        paymentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Payment successful!');
        fetchTransactions();
      } else {
        throw new Error(response.data.message || 'Failed to process payment');
      }
    } catch (err) {
      console.error('[DEBUG] Payment error:', err.response ? err.response.data : err.message);
      alert(`Payment failed: ${err.message}`);
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <Text style={styles.customerName}>{item.customer_name || 'No name'}</Text>
      <Text style={styles.date}>{formatDate(item.transaction_date)}</Text>
      <Text style={styles.paymentMethod}>Original Payment: {item.payment_method}</Text>
      <Text style={styles.total}>
        Total: {formatCurrency(calculateTransactionTotal(item.items))}
      </Text>
      {item.unpaid_amount > 0 && (
        <Text style={styles.unpaid}>
          Unpaid: {formatCurrency(item.unpaid_amount)}
        </Text>
      )}

      <Text style={styles.itemsHeader}>Items:</Text>
      {item.items.map((itemDetail, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemName}>Product ID: {itemDetail.product_id}</Text>
          <Text>Quantity: {itemDetail.quantity}</Text>
          <Text>Unit Price: {formatCurrency(itemDetail.unit_price)}</Text>
          <Text>Total: {formatCurrency(itemDetail.quantity * itemDetail.unit_price)}</Text>
        </View>
      ))}

      <TextInput
        style={styles.paymentInput}
        placeholder="Enter payment amount"
        keyboardType="numeric"
        value={paidAmounts[item.id] || ''}
        onChangeText={text => updatePaidAmount(item.id, text)}
      />

      <View style={styles.paymentMethodContainer}>
        <Text style={styles.sectionTitle}>Payment Method:</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              paymentMethods[item.id] === 'cash' && styles.selectedMethod
            ]}
            onPress={() => updatePaymentMethod(item.id, 'cash')}
          >
            <Text style={paymentMethods[item.id] === 'cash' ? styles.selectedMethodText : styles.methodText}>
              Cash
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              paymentMethods[item.id] === 'bank' && styles.selectedMethod
            ]}
            onPress={() => updatePaymentMethod(item.id, 'bank')}
          >
            <Text style={paymentMethods[item.id] === 'bank' ? styles.selectedMethodText : styles.methodText}>
              Bank
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {paymentMethods[item.id] === 'bank' && (
        <View style={styles.bankSelectionContainer}>
          <Text style={styles.sectionTitle}>Select Bank:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bankScrollContainer}
          >
            {banks.map((bank, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.bankButton,
                  selectedBanks[item.id] === bank && styles.selectedBank
                ]}
                onPress={() => updateSelectedBank(item.id, bank)}
              >
                <Text style={selectedBanks[item.id] === bank ? styles.selectedBankText : styles.bankText}>
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Button 
        title="Pay" 
        onPress={() => handlePay(item.id)} 
        style={styles.payButton}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={fetchTransactions} />
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  transactionCard: {
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    marginBottom: 4,
  },
  total: {
    fontSize: 14,
    marginBottom: 4,
  },
  unpaid: {
    fontSize: 14,
    color: 'red',
    marginBottom: 4,
  },
  itemsHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  itemRow: {
    marginBottom: 5,
    marginLeft: 10,
    marginBottom: 5,
  },
  itemName: {
    fontWeight: 'bold',
  },
  paymentInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  paymentMethodContainer: {
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedMethod: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  methodText: {
    color: '#000',
  },
  selectedMethodText: {
    color: '#fff',
  },
  bankSelectionContainer: {
    marginBottom: 10,
  },
  bankScrollContainer: {
    paddingVertical: 5,
  },
  bankButton: {
    padding: 10,
    marginRight: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedBank: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bankText: {
    color: '#000',
  },
  selectedBankText: {
    color: '#fff',
  },
  payButton: {
    marginTop: 10,
  },
});

export default NewTransactionsScreen;