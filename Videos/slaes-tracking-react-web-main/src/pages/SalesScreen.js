import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform, 
  TextInput, 
  Dimensions, 
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://dankula.x10.mx/auth.php';
const windowWidth = Dimensions.get('window').width;
const bankOptions = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr', 'Check'];

const SalesScreen = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedBank, setSelectedBank] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [customer, setCustomer] = useState('');
  const [unpaidAmount, setUnpaidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState('cash');
  const [secondarySelectedBank, setSecondarySelectedBank] = useState('');
  const [dailySales, setDailySales] = useState([]);
  const [showDailySales, setShowDailySales] = useState(false);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(
        API_URL,
        {},
        {
          params: { action: 'getProducts' },
          headers: headers,
        }
      );

      const availableProducts = response.data.products.filter(
        (product) => product.status === 'in_store' && product.quantity > 0
      );
      
      setProducts(availableProducts);
    } catch (err) {
      console.error("Fetch products error:", err);
      setNetworkError(true);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySales = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        API_URL,
        {},
        {
          params: { action: 'get_daily_sales' },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setDailySales(response.data.sales);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch daily sales.');
      }
    } catch (error) {
      console.error('Fetch daily sales error:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while fetching daily sales.';
      Alert.alert('Error', errorMessage);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDailySales();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = ['All', ...new Set(products.map(p => p.category))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  // Cart management functions
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.product_id === product.id 
            ? {...item, quantity: item.quantity + 1} 
            : item
        );
      }
      return [...prevCart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price: product.selling_price,
        maxQuantity: product.quantity
      }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  const updateCartItem = (productId, field, value) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product_id === productId ? {...item, [field]: value} : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => 
      total + (item.quantity * item.price), 0
    ).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (paymentMethod === 'credit' && !customer) {
      Alert.alert('Error', 'Please enter customer name for credit payment');
      return;
    }

    // Validate partial payment: if bank amount is provided, bank must be selected
    if (paymentMethod === 'partial') {
      const bankAmt = parseFloat(bankAmount || 0);
      if (bankAmt > 0 && !selectedBank) {
        Alert.alert('Error', 'Please select a bank for the bank transfer portion');
        return;
      }
    }

    setProcessing(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log("Payment data being sent:", {
        paymentMethod,
        cashAmount: typeof cashAmount,
        bankAmount: typeof bankAmount,
        values: { cashAmount, bankAmount }
      });

      console.log('Sending payment data:', {
        paymentMethod,
        cashAmount,
        bankAmount,
        selectedBank,
        customerName: customer,
        unpaidAmount,
        comment,
        products: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      const response = await axios.post(
        API_URL,
        {
          action: 'checkout',
          cart: JSON.stringify(cart),
          payment_method: paymentMethod,
          bank_name: paymentMethod === 'bank' || (paymentMethod === 'partial' && parseFloat(bankAmount) > 0) ? selectedBank : 
                    (paymentMethod === 'credit' && secondaryPaymentMethod === 'bank') ? secondarySelectedBank : '',
          cash_amount: paymentMethod === 'partial' ? cashAmount : null,
          bank_amount: paymentMethod === 'partial' ? bankAmount : null,
          customer_name: customer,
          unpaid_amount: unpaidAmount,
          secondary_payment_method: paymentMethod === 'credit' ? secondaryPaymentMethod : null,
          comment: comment
        },
        { headers: headers }
      );

      console.log("Backend response:", {
        cash_amount: response.data.cash_amount,
        bank_amount: response.data.bank_amount,
        input_cash: response.data.input_cash,
        input_bank: response.data.input_bank
      });

      if (response.data.success) {
        Alert.alert('Success', 'Checkout completed successfully');
        setCart([]);
        setComment('');
        setPaymentMethod('cash');
        setSelectedBank('');
        setCashAmount('');
        setBankAmount('');
        setCustomer('');
        setUnpaidAmount('');
        setSecondaryPaymentMethod('cash');
        setSecondarySelectedBank('');
        fetchProducts();
      } else {
        Alert.alert('Error', response.data.message || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.selling_price} ETB</Text>
        <Text style={styles.productStock}>Available: {item.quantity}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addToCartButton}
        onPress={() => addToCart(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <TextInput
          style={styles.cartItemPrice}
          value={item.price.toString()}
          onChangeText={(text) => {
            const num = parseFloat(text) || 0;
            updateCartItem(item.product_id, 'price', Math.max(0, num));
          }}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity 
          onPress={() => updateCartItem(item.product_id, 'quantity', Math.max(1, item.quantity - 1))}
          style={styles.quantityButton}
        >
          <Icon name="remove" size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TextInput
          style={styles.quantityInput}
          value={item.quantity.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 1;
            updateCartItem(item.product_id, 'quantity', Math.min(num, item.maxQuantity));
          }}
          keyboardType="numeric"
        />
        <TouchableOpacity 
          onPress={() => updateCartItem(item.product_id, 'quantity', Math.min(item.quantity + 1, item.maxQuantity))}
          style={styles.quantityButton}
        >
          <Icon name="add" size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => removeFromCart(item.product_id)}
          style={styles.removeButton}
        >
          <Icon name="delete" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getFilteredProducts = () => {
    let filtered = [...products];
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const renderPaymentMethod = () => (
    <View style={{marginBottom: 20, gap: 10}}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
        <TouchableOpacity 
          style={[styles.paymentMethodButton, paymentMethod === 'cash' && styles.selectedPaymentMethod]}
          onPress={() => setPaymentMethod('cash')}
        >
          <Text style={[styles.paymentMethodText, paymentMethod === 'cash' && styles.selectedPaymentMethodText]}>Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.paymentMethodButton, paymentMethod === 'bank' && styles.selectedPaymentMethod]}
          onPress={() => setPaymentMethod('bank')}
        >
          <Text style={[styles.paymentMethodText, paymentMethod === 'bank' && styles.selectedPaymentMethodText]}>Bank</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.paymentMethodButton, paymentMethod === 'credit' && styles.selectedPaymentMethod]}
          onPress={() => setPaymentMethod('credit')}
        >
          <Text style={[styles.paymentMethodText, paymentMethod === 'credit' && styles.selectedPaymentMethodText]}>Credit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.paymentMethodButton, paymentMethod === 'partial' && styles.selectedPaymentMethod]}
          onPress={() => setPaymentMethod('partial')}
        >
          <Text style={[styles.paymentMethodText, paymentMethod === 'partial' && styles.selectedPaymentMethodText]}>Partial</Text>
        </TouchableOpacity>
      </View>
      
      {(paymentMethod === 'bank' || paymentMethod === 'partial') && (
        <View style={styles.bankScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {bankOptions.map(bank => (
              <TouchableOpacity
                key={bank}
                style={[styles.bankOption, selectedBank === bank && styles.selectedBankOption]}
                onPress={() => setSelectedBank(bank)}
              >
                <Text style={[styles.bankOptionText, selectedBank === bank && styles.selectedBankOptionText]}>{bank}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {paymentMethod === 'partial' && (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Cash Amount"
            placeholderTextColor="#999"
            value={cashAmount}
            onChangeText={setCashAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Bank Amount"
            placeholderTextColor="#999"
            value={bankAmount}
            onChangeText={setBankAmount}
            keyboardType="numeric"
          />
        </View>
      )}
     
      
      {paymentMethod === 'credit' && (
        <View style={styles.creditContainer}>
          <Text style={styles.creditTitle}>Credit Payment Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            placeholderTextColor="#999"
            value={customer}
            onChangeText={setCustomer}
          />
          <TextInput
            style={[styles.input, {marginTop: 10}]}
            placeholder="Unpaid Amount"
            placeholderTextColor="#999"
            value={unpaidAmount}
            onChangeText={setUnpaidAmount}
            keyboardType="numeric"
          />
          
          {parseFloat(unpaidAmount || 0) > 0 && (
            <View style={styles.paidAmountSection}>
              <Text style={styles.paidAmountTitle}>Payment for Paid Amount</Text>
              <Text style={styles.sectionSubtitle}>Select payment method for the paid portion</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                <TouchableOpacity 
                  style={[styles.paymentMethodButton, secondaryPaymentMethod === 'cash' && styles.selectedPaymentMethod]}
                  onPress={() => setSecondaryPaymentMethod('cash')}
                >
                  <Text style={[styles.paymentMethodText, secondaryPaymentMethod === 'cash' && styles.selectedPaymentMethodText]}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.paymentMethodButton, secondaryPaymentMethod === 'bank' && styles.selectedPaymentMethod]}
                  onPress={() => setSecondaryPaymentMethod('bank')}
                >
                  <Text style={[styles.paymentMethodText, secondaryPaymentMethod === 'bank' && styles.selectedPaymentMethodText]}>Bank</Text>
                </TouchableOpacity>
              </View>
              
              {secondaryPaymentMethod === 'bank' && (
                <View style={{marginTop: 10}}>
                  <Text style={styles.sectionSubtitle}>Select Bank for Paid Amount</Text>
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.bankScrollContainer}
                  >
                    {bankOptions.map(bank => (
                      <TouchableOpacity
                        key={bank}
                        style={[
                          styles.bankOption,
                          secondarySelectedBank === bank && styles.selectedBankOption
                        ]}
                        onPress={() => setSecondarySelectedBank(bank)}
                      >
                        <Text style={styles.bankOptionText}>{bank}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const deleteSale = async (saleId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        API_URL,
        { sale_id: saleId },
        {
          params: { action: 'delete_sale' },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Sale deleted successfully');
        // Refresh daily sales after deletion
        fetchDailySales();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to delete sale');
      }
    } catch (error) {
      console.error('Delete sale error:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while deleting the sale.';
      Alert.alert('Error', errorMessage);
    }
  };

  const confirmDelete = (saleId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this sale?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteSale(saleId) }
      ]
    );
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowDailySales(!showDailySales)}>
          <Text style={styles.toggleButtonText}>{showDailySales ? 'Hide' : 'Show'} Daily Sales</Text>
        </TouchableOpacity>

        {showDailySales && (
          <View style={styles.dailySalesContainer}>
            <Text style={styles.sectionTitle}>Today's Sales</Text>
            <FlatList
              data={dailySales}
              keyExtractor={(item) => item.transaction_item_id.toString()}
              renderItem={({ item }) => (
                <View style={styles.salesItem}>
                  <Text style={styles.salesItemText}>{item.product_name}</Text>
                  <Text style={styles.salesItemText}>Qty: {item.quantity}</Text>
                  <Text style={styles.salesItemText}>Price: {item.price}</Text>
                  <Text style={styles.salesItemText}>Total: {item.total_amount}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item.transaction_item_id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text>No sales recorded for today.</Text>}
            />
          </View>
        )}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => {
            // Re-fetch products to ensure we have latest data
            fetchProducts();
          }}
        >
          <Icon name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryButtonText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cart Section at Top */}
        <View style={styles.cartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Sale</Text>
            <Text style={styles.itemCount}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
          </View>
          
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Icon name="shopping-cart" size={40} color="#ccc" />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
            </View>
          ) : (
            <View style={styles.cartItemsContainer}>
              <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.product_id.toString()}
                scrollEnabled={false}
              />
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>ETB {calculateTotal()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Method */}
        {renderPaymentMethod()}

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4A90E2" />
          ) : networkError ? (
            <Text style={styles.errorText}>Network Error. Please try again.</Text>
          ) : (
            <FlatList
              data={getFilteredProducts()}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.productGrid}
              scrollEnabled={false}
            />
          )}
        </View>

      </ScrollView>

      {/* Fixed Action Buttons at Bottom */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.clearButton]}
          onPress={() => setCart([])}
        >
          <Icon name="delete" size={20} color="#e74c3c" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.checkoutButton, (processing || cart.length === 0) && styles.disabledButton]}
          onPress={handleCheckout}
          disabled={processing || cart.length === 0}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100, // Space for fixed footer
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCount: {
    backgroundColor: '#4A90E2',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 14,
  },
  cartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyCart: {
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    color: '#999',
    marginTop: 10,
    fontSize: 16,
  },
  cartItemsContainer: {
    marginTop: 10,
  },
  productsSection: {
    marginBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 40, // Fixed height for 2 lines
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 13,
    color: '#666',
  },
  productGrid: {
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 5,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  clearButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  clearButtonText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontWeight: '600',
  },
  checkoutButton: {
    backgroundColor: '#4A90E2',
  },
  checkoutButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 4,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    width: 100,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
  },
  quantityInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    marginLeft: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  addToCartButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    paddingTop: 16,
    paddingBottom: 29,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    height: 40,
  },
  selectedCategoryButton: {
    backgroundColor: '#3a7bd5',
    borderColor: '#3a7bd5',
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textTransform: 'capitalize',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  paymentMethodButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    height: 40,
  },
  selectedPaymentMethod: {
    backgroundColor: '#4A90E2',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textTransform: 'capitalize',
  },
  selectedPaymentMethodText: {
    color: '#fff',
  },
  input: {
    height: 40,
    fontSize: 16,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  bankScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  bankOption: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    minWidth: 90,
  },
  selectedBankOption: {
    backgroundColor: '#4A90E2',
  },
  bankOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedBankOptionText: {
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  // New styles for credit section
  creditContainer: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  creditTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  paidAmountSection: {
    backgroundColor: '#e6f2ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  paidAmountTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 5,
  },
  toggleButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 350,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dailySalesContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  salesItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salesItemText: {
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SalesScreen;