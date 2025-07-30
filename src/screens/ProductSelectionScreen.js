import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Text } from 'react-native';
import { Card, Button } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://dankula.x10.mx/auth.php';

const ProductSelectionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.post(
          API_URL,
          { action: 'getProducts' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProducts(response.data.products || []);
        setFilteredProducts(response.data.products || []);
      } catch (error) {
        console.error('Product fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = products.filter(
      product => product.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleSelect = (product) => {
    navigation.navigate({
      name: 'ProductOrder',
      params: { selectedProduct: product },
      merge: true,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleSelect(item)}>
      <Card containerStyle={styles.card}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.details}>
          <Text style={styles.detailText}>ቀሪ: {item.quantity}</Text>
          <Text style={styles.detailText}>የገባበት ዋጋ: {item.import_price} ብር</Text>
          <Text style={styles.detailText}>የሽያጭ ዋጋ: {item.selling_price} ብር</Text>
        </View>
        <Button
          title="Select"
          buttonStyle={styles.selectButton}
          onPress={() => handleSelect(item)}
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0984e3" style={styles.loader} />
      ) : filteredProducts.length === 0 ? (
        <Text style={styles.emptyText}>No products found</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2d3436',
  },
  details: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 5,
  },
  selectButton: {
    backgroundColor: '#0984e3',
    borderRadius: 8,
    height: 40,
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

export default ProductSelectionScreen;