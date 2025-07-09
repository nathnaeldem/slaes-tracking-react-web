import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
  Sync as SyncIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// Create axios instance with interceptors
const salesApi = axios.create({
  baseURL: 'https://dankula.x10.mx/auth.php',
  headers: { 'Content-Type': 'application/json' }
});

// Configure axios-retry
axiosRetry(salesApi, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => 
    axiosRetry.isNetworkError(error) || 
    axiosRetry.isRetryableError(error)
});

// Add request interceptor
salesApi.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor
salesApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const SalesScreen = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantitySold, setQuantitySold] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedBank, setSelectedBank] = useState('');
  const [toWhom, setToWhom] = useState('');
  const [unpaidAmount, setUnpaidAmount] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setNetworkError(false);
      
      const response = await salesApi.post('', {}, {
        params: { action: 'getProducts' }
      });

      const availableProducts = response.data.products.filter(
        product => product.status === 'in_store' && product.quantity > 0
      );
      setProducts(availableProducts);
    } catch (err) {
      console.error("Fetch products error:", err);
      setNetworkError(true);
      if (!axiosRetry.isNetworkError(err) && !axiosRetry.isRetryableError(err)) {
        showSnackbar('Failed to fetch products', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setQuantitySold('');
    setSoldPrice(product.selling_price.toString());
    setComment('');
    setPaymentMethod('cash');
    setSelectedBank('');
    setToWhom('');
    setUnpaidAmount('');
  };

  const calculateTotalPrice = () => {
    const qty = parseInt(quantitySold) || 0;
    const price = parseFloat(soldPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const handleSale = async () => {
    // Validation logic
    if (!selectedProduct) {
      showSnackbar('Please select a product', 'error');
      return;
    }

    const qty = parseInt(quantitySold);
    const price = parseFloat(soldPrice);

    if (!qty || qty <= 0) {
      showSnackbar('Please enter a valid quantity', 'error');
      return;
    }

    if (!price || price <= 0) {
      showSnackbar('Please enter a valid price', 'error');
      return;
    }

    if (qty > selectedProduct.quantity) {
      showSnackbar('Quantity exceeds available stock', 'error');
      return;
    }

    try {
      setProcessing(true);
      
      const saleData = {
        product_id: selectedProduct.id,
        quantity_sold: qty,
        sold_price: price,
        payment_method: paymentMethod,
        comment: comment,
        bank_name: selectedBank,
        unpaid_amount: paymentMethod === 'credit' ? unpaidAmount : 0,
        to_whom: paymentMethod === 'credit' ? toWhom : '',
      };

      const response = await salesApi.post('', saleData, {
        params: { action: 'sellProduct' }
      });

      if (response.data && response.data.success === false) {
        showSnackbar(response.data.message || 'Sale processing failed', 'error');
      } else {
        showSnackbar('Product sold successfully!', 'success');
        setSelectedProduct(null);
        fetchProducts();
      }
    } catch (error) {
      console.error("Sale processing error:", error);
      if (!axiosRetry.isNetworkError(error) && !axiosRetry.isRetryableError(error)) {
        showSnackbar(
          error.response?.data?.message || error.message || 'An unexpected error occurred',
          'error'
        );
      } else {
        showSnackbar(
          'Could not complete sale due to network issues. Please try again.',
          'error'
        );
        setNetworkError(true);
      }
    } finally {
      setProcessing(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr', 'Check'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2, alignSelf: 'center' }}>
          Loading products...
        </Typography>
      </Box>
    );
  }

  if (networkError) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10, p: 3 }}>
        <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Network Error
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Could not connect to the server. Please check your internet connection.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SyncIcon />}
          onClick={fetchProducts}
          sx={{ py: 1.5, px: 4 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <ShoppingCartIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Product Sales
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={handleCloseSnackbar}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {!selectedProduct ? (
        <>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Select a Product to Sell
          </Typography>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            }}
            sx={{ mb: 3, maxWidth: 500 }}
          />

          {filteredProducts.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                {products.length > 0 
                  ? "No products found matching your search." 
                  : "No products available for sale"}
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: selectedProduct?.id === product.id 
                        ? '2px solid #4caf50' 
                        : '1px solid rgba(0, 0, 0, 0.12)',
                      transition: 'border 0.3s'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="div">
                          {product.name}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 1.5 }} />
                      
                      <List dense disablePadding>
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <InventoryIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Available Quantity" 
                            secondary={`${product.quantity} units`} 
                          />
                        </ListItem>
                        
                        <ListItem disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <AttachMoneyIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Selling Price" 
                            secondary={`$${product.selling_price}`} 
                          />
                        </ListItem>
                        
                        {product.description && (
                          <ListItem disableGutters>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <InfoIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Description" 
                              secondary={product.description} 
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                      <Button
                        variant={selectedProduct?.id === product.id ? "contained" : "outlined"}
                        color={selectedProduct?.id === product.id ? "success" : "primary"}
                        startIcon={
                          selectedProduct?.id === product.id 
                            ? <CheckCircleIcon /> 
                            : <ShoppingCartIcon />
                        }
                        onClick={() => selectProduct(product)}
                        fullWidth
                      >
                        {selectedProduct?.id === product.id ? "Selected" : "Select for Sale"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5">
                  {selectedProduct.name}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Available Quantity:
                  </Typography>
                  <Typography variant="body1">
                    {selectedProduct.quantity} units
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Suggested Price:
                  </Typography>
                  <Typography variant="body1">
                    ${selectedProduct.selling_price}
                  </Typography>
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Quantity to Sell"
                    variant="outlined"
                    type="number"
                    value={quantitySold}
                    onChange={(e) => setQuantitySold(e.target.value)}
                    InputProps={{
                      startAdornment: <InventoryIcon sx={{ color: 'action.active', mr: 1 }} />
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price per Unit"
                    variant="outlined"
                    type="number"
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(e.target.value)}
                    InputProps={{
                      startAdornment: <AttachMoneyIcon sx={{ color: 'action.active', mr: 1 }} />
                    }}
                  />
                </Grid>
              </Grid>
              
              {quantitySold && soldPrice && (
                <Box sx={{ 
                  bgcolor: '#f5f5f5', 
                  p: 2, 
                  mt: 2, 
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="h6">
                    Total: ${calculateTotalPrice()}
                  </Typography>
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Comment (Optional)"
                variant="outlined"
                multiline
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                sx={{ mt: 3 }}
              />
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Payment Method
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Type"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="cash">Cash (ጥሬ)</MenuItem>
                  <MenuItem value="credit">Credit (ዱቤ)</MenuItem>
                  <MenuItem value="account_transfer">Bank Transfer (ባንክ)</MenuItem>
                </Select>
              </FormControl>
              
              {paymentMethod === 'account_transfer' && (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Select Bank:
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {banks.map((bank) => (
                      <Grid item xs={4} key={bank}>
                        <Button
                          fullWidth
                          variant={selectedBank === bank ? "contained" : "outlined"}
                          color={selectedBank === bank ? "primary" : "inherit"}
                          onClick={() => setSelectedBank(bank)}
                          sx={{ py: 1 }}
                        >
                          {bank}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
              
              {paymentMethod === 'credit' && (
                <>
                  <TextField
                    fullWidth
                    label="Unpaid Amount"
                    variant="outlined"
                    type="number"
                    value={unpaidAmount}
                    onChange={(e) => setUnpaidAmount(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="To Whom (Customer Name)"
                    variant="outlined"
                    value={toWhom}
                    onChange={(e) => setToWhom(e.target.value)}
                  />
                </>
              )}
              
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={handleSale}
                  disabled={processing}
                >
                  {processing ? <CircularProgress size={24} /> : 'Complete Sale'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  fullWidth
                  startIcon={<CancelIcon />}
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default SalesScreen;