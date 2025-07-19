import React, { useState, useEffect } from 'react';
import { getProducts, getDailySales, checkout, deleteSale } from '../services/salesService';
import { useAuth } from '../auth/AuthContext';
import './CreditRegisterPage.css';
import axios from 'axios';

const CreditRegisterPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [customer, setCustomer] = useState('');
  const [unpaidAmount, setUnpaidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [showDailySales, setShowDailySales] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      const availableProducts = await getProducts();
      setProducts(availableProducts);
    } catch (err) {
      console.error("Fetch products error:", err);
      setNetworkError(true);
      alert('Error: Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySales = async () => {
    try {
      const response = await getDailySales();
      if (response.success) {
        setDailySales(response.sales);
      } else {
        alert('Error: ' + (response.message || 'Failed to fetch daily sales.'));
      }
    } catch (error) {
      console.error('Fetch daily sales error:', error);
      const errorMessage = error.response?.data?.message || 'An error occurred while fetching daily sales.';
      alert('Error: ' + errorMessage);
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
    setCart(prevCart => prevCart.map(item => 
      item.product_id === productId 
        ? { ...item, [field]: value } 
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    if (paymentMethod === 'credit' && !customer) {
      alert('Please enter a customer name for credit sales.');
      return;
    }

    setProcessing(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Set up headers with token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Prepare sale data
      const saleData = {
        cart: JSON.stringify(cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
        }))),
        comment: comment || '',
        payment_method: 'credit',
        customer_name: customer,
        unpaid_amount: parseFloat(unpaidAmount) || 0,
        action: 'checkout2',
        user_id: user?.id,
        organization_id: user?.organization_id
      };

      console.log('Sending sale data:', saleData);

      // Make the API request
      const API_URL = 'https://dankula.x10.mx/auth.php';
      const response = await axios.post(API_URL, saleData, { headers });
      
      console.log('API Response:', response.data);

      if (response.data && response.data.success) {
        alert('Checkout successful!');
        // Reset form
        setCart([]);
        setComment('');
        setCustomer('');
        setUnpaidAmount('');
        // Refresh data
        await Promise.all([
          fetchProducts(),
          fetchDailySales()
        ]);
      } else {
        throw new Error(response.data?.message || 'Checkout failed');
      }
    } catch (error) {
      console.error('Detailed checkout error:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      let errorMessage = 'An error occurred during checkout.\n\n';
      
      if (error.response) {
        // Server responded with an error
        errorMessage += `Status: ${error.response.status}\n`;
        if (error.response.data?.message) {
          errorMessage += `Error: ${error.response.data.message}`;
        } else if (error.response.data) {
          errorMessage += `Error: ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        // Something else caused the error
        errorMessage += `Error: ${error.message || 'Unknown error occurred'}`;
      }
      
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

    const handleDeleteSale = async (saleId) => {
        if (window.confirm('Are you sure you want to delete this sale?')) {
            try {
                const response = await deleteSale(saleId);
                if (response.success) {
                    alert('Sale deleted successfully!');
                    fetchDailySales(); // Refresh sales list
                } else {
                    alert('Failed to delete sale: ' + response.message);
                }
            } catch (error) {
                alert('An error occurred while deleting the sale.');
            }
        }
    };

  const getFilteredProducts = () => {
    let filtered = products;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  if (loading) {
    return <div className="loading-indicator">Loading...</div>;
  }

  if (networkError) {
    return <div className="network-error">Network error. Please check your connection and try again.</div>;
  }

  return (
    <div className="credit-register-page">
        <div className="main-content">
            <div className="product-list-section">
                <h3>Products</h3>
                <div className="filters">
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        className="search-input"
                    />
                    <div className="category-tabs">
                        {categories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)} 
                                className={selectedCategory === cat ? 'active' : ''}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="product-grid">
                    {getFilteredProducts().map(product => (
                        <div key={product.id} className="product-card">
                            <h4>{product.name}</h4>
                            <p>Price: ${product.selling_price}</p>
                            <p>Stock: {product.quantity}</p>
                            <button onClick={() => addToCart(product)}>Add to Cart</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cart-section">
                <h3>Shopping Cart</h3>
                {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    <div className="cart-items">
                        {cart.map(item => (
                            <div key={item.product_id} className="cart-item">
                                <span>{item.name}</span>
                                <input 
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={e => updateCartItem(item.product_id, 'quantity', parseInt(e.target.value) || 1)} 
                                />
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                                <button onClick={() => removeFromCart(item.product_id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="cart-total">
                    <strong>Total: ${calculateTotal()}</strong>
                </div>
                <div className="checkout-form">
                    <h3>Customer Information</h3>
                    <input 
                        type="text" 
                        placeholder="Customer Name" 
                        value={customer} 
                        onChange={e => setCustomer(e.target.value)} 
                        className="customer-input" 
                    />
                    <input 
                        type="number" 
                        placeholder="Unpaid Amount" 
                        value={unpaidAmount}
                        onChange={e => setUnpaidAmount(e.target.value)}
                        className="unpaid-amount-input"
                    />
                    <button 
                        onClick={handleCheckout} 
                        disabled={processing || cart.length === 0}
                        className="checkout-button"
                    >
                        {processing ? 'Processing...' : 'Checkout'}
                    </button>
                </div>
            </div>
        </div>

        <div className="daily-sales-section">
            <button onClick={() => setShowDailySales(!showDailySales)} className="toggle-sales-btn">
                {showDailySales ? 'Hide' : 'Show'} Daily Sales
            </button>
            {showDailySales && (
                <div className="sales-list">
                    {dailySales.map(sale => (
                        <div key={sale.id} className="sale-item">
                            <span>{sale.customer_name || 'N/A'} - ${sale.total_amount}</span>
                            <button onClick={() => handleDeleteSale(sale.id)} className="delete-btn">Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default CreditRegisterPage;
