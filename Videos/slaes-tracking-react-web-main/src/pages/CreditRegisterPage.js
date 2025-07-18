import React, { useState, useEffect } from 'react';
import { getProducts, getDailySales, checkout, deleteSale } from '../services/salesService';
import { useAuth } from '../auth/AuthContext';
import './CreditRegisterPage.css';

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
    const checkoutData = {
      user_id: user.id,
      organization_id: user.organization_id,
      cart: cart,
      comment: comment,
      payment_method: paymentMethod,
      customer_name: customer,
      unpaid_amount: unpaidAmount,
      total_amount: calculateTotal(),
    };

    try {
      const response = await checkout(checkoutData);
      if (response.success) {
        alert('Checkout successful!');
        setCart([]);
        setComment('');
        setCustomer('');
        setUnpaidAmount('');
        fetchProducts(); // Refresh products
        fetchDailySales(); // Refresh sales
      } else {
        alert('Checkout failed: ' + response.message);
      }
    } catch (err) {
      alert('An error occurred during checkout.');
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
                     <input type="text" placeholder="Customer Name" value={customer} onChange={e => setCustomer(e.target.value)} className="customer-input" />
                     <textarea placeholder="Comment" value={comment} onChange={e => setComment(e.target.value)}></textarea>
                    <button onClick={handleCheckout} disabled={processing}>
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
