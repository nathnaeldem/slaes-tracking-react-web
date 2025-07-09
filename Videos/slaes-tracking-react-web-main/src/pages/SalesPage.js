import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaSearch, FaTrash, FaPlus, FaMinus, FaMoneyBill, FaCreditCard, FaSync } from 'react-icons/fa';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api2';
import './SalesPage.css';

const bankOptions = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr', 'Check'];

const SalesPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedBank, setSelectedBank] = useState('');
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      
      const response = await api.post('', {}, {
        params: { action: 'getProducts' }
      });

      const availableProducts = response.data.products.filter(
        product => product.status === 'in_store' && product.quantity > 0
      );
      
      setProducts(availableProducts);
    } catch (err) {
      console.error("Fetch products error:", err);
      setNetworkError(true);
      alert('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySales = async () => {
    try {
      const response = await api.post('', {}, {
        params: { action: 'get_daily_sales' }
      });
      if (response.data.success) {
        setDailySales(response.data.sales);
      } else {
        alert(response.data.message || 'Failed to fetch daily sales.');
      }
    } catch (error) {
      console.error('Fetch daily sales error:', error);
      alert(error.response?.data?.message || 'An error occurred while fetching daily sales.');
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
      alert('Your cart is empty');
      return;
    }

    if (paymentMethod === 'credit' && !customer) {
      alert('Please enter customer name for credit payment');
      return;
    }

    setProcessing(true);
    
    try {
      const response = await api.post('', {
        action: 'checkout',
        cart: JSON.stringify(cart),
        payment_method: paymentMethod,
        bank_name: paymentMethod === 'bank' ? selectedBank : 
                  (paymentMethod === 'credit' && secondaryPaymentMethod === 'bank') ? secondarySelectedBank : '',
        customer_name: customer,
        unpaid_amount: unpaidAmount,
        secondary_payment_method: paymentMethod === 'credit' ? secondaryPaymentMethod : null,
        comment: comment
      });

      if (response.data.success) {
        alert('Checkout completed successfully');
        setCart([]);
        setComment('');
        setPaymentMethod('cash');
        setSelectedBank('');
        setCustomer('');
        setUnpaidAmount('');
        setSecondaryPaymentMethod('cash');
        setSecondarySelectedBank('');
        fetchProducts();
      } else {
        alert(response.data.message || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h2>Sales</h2>
        <button 
          className="toggle-button"
          onClick={() => setShowDailySales(!showDailySales)}
        >
          {showDailySales ? 'Hide Daily Sales' : 'Show Daily Sales'}
        </button>
      </div>

      {showDailySales && (
        <div className="daily-sales-card">
          <h3>Today's Sales</h3>
          {dailySales.length > 0 ? (
            <div className="sales-list">
              {dailySales.map((item) => (
                <div key={item.transaction_item_id} className="sales-item">
                  <div className="sales-item-info">
                    <span className="sales-item-name">{item.product_name}</span>
                    <div className="sales-item-details">
                      <span>Qty: {item.quantity}</span>
                      <span>Price: {item.price} ETB</span>
                      <span>Total: {item.total_amount} ETB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-sales">No sales recorded for today.</p>
          )}
        </div>
      )}

      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="search-button"
            onClick={fetchProducts}
          >
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="category-container">
        <div className="category-scroll">
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="sales-content">
        <div className="cart-section">
          <div className="section-header">
            <h3>Current Sale</h3>
            <span className="item-count">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
          </div>
          
          {cart.length === 0 ? (
            <div className="empty-cart">
              <FaShoppingCart className="cart-icon" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.product_id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value) || 0;
                        updateCartItem(item.product_id, 'price', Math.max(0, num));
                      }}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="item-controls">
                    <button 
                      onClick={() => updateCartItem(item.product_id, 'quantity', Math.max(1, item.quantity - 1))}
                    >
                      <FaMinus />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 1;
                        updateCartItem(item.product_id, 'quantity', Math.min(num, item.maxQuantity));
                      }}
                      min="1"
                      max={item.maxQuantity}
                    />
                    <button 
                      onClick={() => updateCartItem(item.product_id, 'quantity', Math.min(item.quantity + 1, item.maxQuantity))}
                    >
                      <FaPlus />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="remove-button"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">ETB {calculateTotal()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="payment-section">
          <h3>Payment Method</h3>
          <div className="payment-methods">
            <button
              className={`payment-button ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <FaMoneyBill /> Cash
            </button>
            <button
              className={`payment-button ${paymentMethod === 'bank' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('bank')}
            >
              Bank
            </button>
            <button
              className={`payment-button ${paymentMethod === 'credit' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('credit')}
            >
              <FaCreditCard /> Credit
            </button>
          </div>
          
          {paymentMethod === 'bank' && (
            <div className="bank-section">
              <h4>Select Bank</h4>
              <div className="bank-options">
                {bankOptions.map(bank => (
                  <button
                    key={bank}
                    className={`bank-option ${selectedBank === bank ? 'active' : ''}`}
                    onClick={() => setSelectedBank(bank)}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {paymentMethod === 'credit' && (
            <div className="credit-section">
              <h4>Credit Payment Details</h4>
              <input
                type="text"
                placeholder="Customer Name"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
              <input
                type="number"
                placeholder="Unpaid Amount"
                value={unpaidAmount}
                onChange={(e) => setUnpaidAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              
              {parseFloat(unpaidAmount || 0) > 0 && (
                <div className="paid-amount-section">
                  <h5>Payment for Paid Amount</h5>
                  <div className="secondary-payment">
                    <button
                      className={`payment-button ${secondaryPaymentMethod === 'cash' ? 'active' : ''}`}
                      onClick={() => setSecondaryPaymentMethod('cash')}
                    >
                      Cash
                    </button>
                    <button
                      className={`payment-button ${secondaryPaymentMethod === 'bank' ? 'active' : ''}`}
                      onClick={() => setSecondaryPaymentMethod('bank')}
                    >
                      Bank
                    </button>
                  </div>
                  
                  {secondaryPaymentMethod === 'bank' && (
                    <div className="bank-section">
                      <h5>Select Bank for Paid Amount</h5>
                      <div className="bank-options">
                        {bankOptions.map(bank => (
                          <button
                            key={bank}
                            className={`bank-option ${secondarySelectedBank === bank ? 'active' : ''}`}
                            onClick={() => setSecondarySelectedBank(bank)}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="products-section">
          <h3>Available Products</h3>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : networkError ? (
            <p className="error">Network Error. Please try again.</p>
          ) : (
            <div className="product-grid">
              {getFilteredProducts().map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <p className="product-price">{product.selling_price} ETB</p>
                    <p className="product-stock">Available: {product.quantity}</p>
                  </div>
                  <button 
                    className="add-to-cart"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sales-footer">
        <button 
          className="clear-button"
          onClick={() => setCart([])}
        >
          <FaTrash /> Clear
        </button>
        <button 
          className={`checkout-button ${processing || cart.length === 0 ? 'disabled' : ''}`}
          onClick={handleCheckout}
          disabled={processing || cart.length === 0}
        >
          {processing ? (
            <>
              <FaSync className="spinning" /> Processing...
            </>
          ) : (
            <>
              <FaShoppingCart /> Checkout
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SalesPage;