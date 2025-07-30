import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

const API_URL = 'https://dankula.x10.mx/auth.php';

const OrderHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        API_URL,
        {},
        {
          params: { action: 'get_product_orders', status: statusFilter },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Order fetch error:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        API_URL,
        {},
        {
          params: { action: 'receiveOrder', order_id: orderId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      fetchOrders();
      Alert.alert('Success', 'Order received successfully');
    } catch (error) {
      console.error('Receive error:', error);
      Alert.alert('Error', 'Failed to receive order');
    }
  };

  const handlePay = (order) => {
    navigation.navigate('PayOrder', { order });
  };

  const renderItem = ({ item }) => (
    <Card containerStyle={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'ordered' ? styles.orderedBadge : styles.receivedBadge
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.productName}>{item.product_name}</Text>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Quantity:</Text>
        <Text style={styles.detailValue}>{item.quantity}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Order Price:</Text>
        <Text style={styles.detailValue}>{item.ordered_price} ብር</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Selling Price:</Text>
        <Text style={styles.detailValue}>{item.selling_price} ብር</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Payment Method:</Text>
        <Text style={styles.detailValue}>{item.payment_method}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Paid:</Text>
        <Text style={styles.detailValue}>{item.paid_amount} ብር</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Unpaid:</Text>
        <Text style={styles.detailValue}>{item.unpaid_amount} ብር</Text>
      </View>
      
      <Text style={styles.dateText}>
        Ordered: {moment(item.created_at).format('MMM D, YYYY h:mm A')}
      </Text>
      
      {item.received_at && (
        <Text style={styles.dateText}>
          Received: {moment(item.received_at).format('MMM D, YYYY h:mm A')}
        </Text>
      )}
      
      <View style={styles.buttonContainer}>
        {item.status === 'ordered' && (
          <Button
            title="Receive"
            buttonStyle={styles.receiveButton}
            onPress={() => handleReceive(item.id)}
          />
        )}
        
        {item.unpaid_amount > 0 && item.status === 'received' && (
          <Button
            title="Pay Credit"
            buttonStyle={styles.payButton}
            onPress={() => handlePay(item)}
          />
        )}
      </View>
    </Card>
  );

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'all' && styles.activeFilter]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.filterText, statusFilter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'ordered' && styles.activeFilter]}
          onPress={() => setStatusFilter('ordered')}
        >
          <Text style={[styles.filterText, statusFilter === 'ordered' && styles.activeFilterText]}>
            Ordered
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, statusFilter === 'received' && styles.activeFilter]}
          onPress={() => setStatusFilter('received')}
        >
          <Text style={[styles.filterText, statusFilter === 'received' && styles.activeFilterText]}>
            Received
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" style={styles.loader} />
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.emptyText}>No orders found</Text>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchOrders}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  activeFilter: {
    backgroundColor: '#0984e3',
  },
  filterText: {
    color: '#636e72',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  card: {
    borderRadius: 12,
    padding: 15,
    margin: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  orderedBadge: {
    backgroundColor: '#fdcb6e',
  },
  receivedBadge: {
    backgroundColor: '#00b894',
  },
  statusText: {
    color: 'white',
    fontWeight: '500',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    color: '#636e72',
    fontSize: 14,
  },
  detailValue: {
    color: '#2d3436',
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    color: '#636e72',
    fontSize: 12,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  receiveButton: {
    backgroundColor: '#00b894',
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  payButton: {
    backgroundColor: '#0984e3',
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#636e72',
    marginTop: 20,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default OrderHistoryScreen;