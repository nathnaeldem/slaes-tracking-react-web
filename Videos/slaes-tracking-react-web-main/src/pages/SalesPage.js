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
  const [cashAmount, setCashAmount] = useState('');
  const [bankAmount, setBankAmount] = useState('');

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

  const deleteSale = async (saleId) => {
    try {
      const response = await api.post('', 
        { sale_id: saleId },
        { params: { action: 'delete_sale' } }
      );

      if (response.data.success) {
        alert('Sale deleted successfully');
        fetchDailySales(); // Refresh the list
      } else {
        alert(response.data.message || 'Failed to delete sale');
      }
    } catch (error) {
      console.error('Delete sale error:', error);
      alert(error.response?.data?.message || 'An error occurred while deleting the sale.');
    }
  };

  const confirmDelete = (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      deleteSale(saleId);
    }
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
      let paymentData = {};
      
      if (paymentMethod === 'partial') {
        const bankAmt = parseFloat(bankAmount || 0);
        const cashAmt = parseFloat(cashAmount || 0);
        const totalPaid = bankAmt + cashAmt;
        const totalCart = parseFloat(calculateTotal());

        if (totalPaid > totalCart) {
          alert('The paid amount cannot be greater than the total amount.');
          setProcessing(false);
          return;
        }

        if (bankAmt > 0 && !selectedBank) {
          alert('Please select a bank for the bank transfer portion');
          setProcessing(false);
          return;
        }
      }

      if (paymentMethod === 'credit') {
        paymentData = {
          payment_method: 'credit',
          customer_name: customer,
          unpaid_amount: unpaidAmount,
          secondary_payment_method: secondaryPaymentMethod,
          bank_name: secondaryPaymentMethod === 'bank' ? secondarySelectedBank : '',
        };
      } else if (paymentMethod === 'partial') {
        paymentData = {
          payment_method: 'partial',
          cash_amount: cashAmount,
          bank_amount: bankAmount,
          bank_name: selectedBank,
        };
      } else if (paymentMethod === 'bank') {
        paymentData = {
          payment_method: 'bank',
          bank_name: selectedBank,
        };
      } else {
        paymentData = {
          payment_method: 'cash',
        };
      }

      const response = await api.post('', {
        action: 'checkout',
        cart: JSON.stringify(cart),
        comment: comment,
        ...paymentData,
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
        setCashAmount('');
        setBankAmount('');
        fetchProducts();
        fetchDailySales();
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
          className="toggle-sales-button"
          onClick={() => setShowDailySales(!showDailySales)}
        >
          {showDailySales ? 'Hide' : 'Show'} Daily Sales
        </button>
      </div>

      {showDailySales && (
        <div className="daily-sales-container">
          <h3>Today's Sales</h3>
          {dailySales.length > 0 ? (
            <ul className="sales-list">
              {dailySales.map(sale => (
                <li key={sale.transaction_item_id} className="sales-item">
                  <span className="sales-item-name">{sale.product_name}</span>
                  <span>Qty: {sale.quantity}</span>
                  <span>Price: {sale.price}</span>
                  <span>Total: {sale.total_amount}</span>
                  <button className="delete-sale-button" onClick={() => confirmDelete(sale.transaction_item_id)}>Delete</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No sales recorded for today.</p>
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
        <div className="cart-and-payment-section">
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
              <button
                className={`payment-button ${paymentMethod === 'partial' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('partial')}
              >
                Partial
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

            {paymentMethod === 'partial' && (
              <div className="partial-section">
                <h4>Partial Payment</h4>
                <input
                  type="number"
                  placeholder="Cash Amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <input
                  type="number"
                  placeholder="Bank Amount"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {parseFloat(bankAmount || 0) > 0 && (
                  <div className="bank-section">
                    <h5>Select Bank for Bank Amount</h5>
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
                
                {parseFloat(calculateTotal()) - parseFloat(unpaidAmount || 0) > 0 && (
                  <div className="paid-amount-section">
                    <h5>Payment for Paid Amount ({(parseFloat(calculateTotal()) - parseFloat(unpaidAmount || 0)).toFixed(2)} ETB)</h5>
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