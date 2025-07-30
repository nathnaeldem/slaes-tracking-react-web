import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Button, Card, Icon } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'https://dankula.x10.mx/auth.php';

const ProductOrderScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    quantity: '',
    ordered_price: '',
    selling_price: '',
    payment_method: 'bank',
    bank_name: '',
    paid_amount: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (route.params?.selectedProduct) {
      setSelectedProduct(route.params.selectedProduct);
      setFormData(prev => ({
        ...prev,
        ordered_price: route.params.selectedProduct.import_price.toString(),
        selling_price: route.params.selectedProduct.selling_price.toString()
      }));
      navigation.setParams({ selectedProduct: undefined });
    }
  }, [route.params?.selectedProduct]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(API_URL, 
          { action: 'getProducts' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProducts(response.data.products || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!selectedProduct) newErrors.product = 'Product is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.ordered_price) newErrors.ordered_price = 'Order price is required';
    if (!formData.selling_price) newErrors.selling_price = 'Selling price is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        ...formData,
        product_id: selectedProduct.id,
        action: 'orderProduct'
      };

      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Order created successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Error', 'Failed to create order');
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.ordered_price) || 0;
    return (quantity * price).toFixed(2);
  };

  const calculateUnpaid = () => {
    const total = parseFloat(calculateTotal()) || 0;
    const paid = parseFloat(formData.paid_amount) || 0;
    return (total - paid).toFixed(2);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card containerStyle={styles.card}>
        <TouchableOpacity 
          style={styles.productSelector}
          onPress={() => navigation.navigate('ProductSelection')}
        >
          <Text style={selectedProduct ? styles.productSelected : styles.productPlaceholder}>
            {selectedProduct ? selectedProduct.name : 'Select a product...'}
          </Text>
          <Icon name="search" size={24} color="#0984e3" />
        </TouchableOpacity>
        {errors.product && <Text style={styles.errorText}>{errors.product}</Text>}

        {selectedProduct && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Import Price:</Text>
              <Text style={styles.detailValue}>{selectedProduct.import_price} ብር</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Selling Price:</Text>
              <Text style={styles.detailValue}>{selectedProduct.selling_price} ብር</Text>
            </View>
          </>
        )}

        <TextInput
          style={[styles.input, errors.quantity && styles.inputError]}
          placeholder="Quantity"
          keyboardType="numeric"
          value={formData.quantity}
          onChangeText={text => setFormData({...formData, quantity: text})}
        />
        {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}

        <TextInput
          style={[styles.input, errors.ordered_price && styles.inputError]}
          placeholder="Ordered Price (per unit)"
          keyboardType="numeric"
          value={formData.ordered_price}
          onChangeText={text => setFormData({...formData, ordered_price: text})}
        />
        {errors.ordered_price && <Text style={styles.errorText}>{errors.ordered_price}</Text>}

        <TextInput
          style={[styles.input, errors.selling_price && styles.inputError]}
          placeholder="Selling Price (per unit)"
          keyboardType="numeric"
          value={formData.selling_price}
          onChangeText={text => setFormData({...formData, selling_price: text})}
        />
        {errors.selling_price && <Text style={styles.errorText}>{errors.selling_price}</Text>}

        <Text style={styles.sectionTitle}>Payment Method</Text>
       

        {(formData.payment_method === 'bank') && (
          <Picker
            selectedValue={formData.bank_name}
            onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
            style={styles.picker}
          >
            <Picker.Item label="CBE" value="CBE" />
            <Picker.Item label="Awash" value="Awash" />
            <Picker.Item label="Dashen" value="Dashen" />
            <Picker.Item label="Abyssinia" value="Abyssinia" />
            <Picker.Item label="Birhan" value="Birhan" />
            <Picker.Item label="Telebirr" value="Telebirr" />
            <Picker.Item label="Check" value="Check" />
          </Picker>
        )}

        {(formData.payment_method === 'mixed') && (
          <TextInput
            style={styles.input}
            placeholder="Paid Amount"
            keyboardType="numeric"
            value={formData.payment_method === 'bank' ? calculateTotal() : formData.paid_amount}
            onChangeText={(text) => setFormData({ ...formData, paid_amount: text })}
            editable={formData.payment_method !== 'bank'}
          />
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>{calculateTotal()} ብር</Text>
          
          <Text style={styles.summaryLabel}>Unpaid Amount:</Text>
          <Text style={styles.summaryValue}>{calculateUnpaid()} ብር</Text>
        </View>

        <Button
          title="Place Order"
          buttonStyle={styles.submitButton}
          onPress={handleSubmit}
          loading={loading}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  card: {
    borderRadius: 12,
    padding: 20,
  },
  productSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  productPlaceholder: {
    color: '#636e72',
    fontSize: 16,
  },
  productSelected: {
    color: '#2d3436',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3436',
    marginVertical: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryContainer: {
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    color: '#2d3436',
    fontWeight: '600',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#00b894',
    borderRadius: 8,
    height: 48,
  },
});

export default ProductOrderScreen;