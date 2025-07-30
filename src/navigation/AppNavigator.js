// AppNavigator.js - NO CHANGES NEEDED HERE
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProductOrderScreen from '../screens/ProductOrderScreen';
import ProductSelectionScreen from '../screens/ProductSelectionScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import PayOrderScreen from '../screens/PayOrderScreen';

// App Screens (add your main app screens here)
import HomeScreen from '../screens/HomeScreen';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import SalesScreen from '../screens/SalesScreen';
import SpendingScreen from '../screens/SpendingScreen'
import ReportsScreen from '../screens/ReportsScreen';
import AdminUserManagement from '../screens/auth/AdminUserManagement';
import AdminVehicleManagement from '../screens/auth/AdminVehicleManagement';
import CarWashScreen from '../screens/auth/CarwashScreen';
import CommissionReportScreen from '../screens/ComissionReportScreen';
import CarWashSpendingScreen from '../screens/CarWashSpendingScreen'
import BankDepositScreen from '../screens/BankDepositScreen'; // Added import statement
import CreditRegister from '../screens/CreditRegister';
import NewTransactionsScreen from '../screens/NewTransactionsScreen'; 
const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add New Product' }} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
      <Stack.Screen name="Sales" component={SalesScreen} options={{ title: 'Product Sales' }} />
      <Stack.Screen name="Spending" component={SpendingScreen} options={{ title: 'Record Spending' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Analytics Dashboard' }} />
      <Stack.Screen name="AdminUserManagement" component={AdminUserManagement} options={{ title: 'Admin User Management' }} />
      <Stack.Screen name="AdminVehicleManagement" component={AdminVehicleManagement} options={{ title: 'Admin Vehicle Management' }} />
      <Stack.Screen name="CarWashScreen" component={CarWashScreen} options={{ title: 'Car Wash Screen' }} />
      <Stack.Screen name="CommissionReportScreen" component={CommissionReportScreen} options={{ title: 'Commission Report' }} />
            <Stack.Screen name="ProductOrder" component={ProductOrderScreen} />
<Stack.Screen name="ProductSelection" component={ProductSelectionScreen} />
<Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
<Stack.Screen name="PayOrder" component={PayOrderScreen} />
            <Stack.Screen name="CarWashSpendingScreen" component={CarWashSpendingScreen} options={{ title: 'Record Car Wash Spending' }} />
            <Stack.Screen name="BankDeposit" component={BankDepositScreen} options={{ title: 'Bank Deposit' }} />
            <Stack.Screen name="CreditRegister" component={CreditRegister} options={{ title: 'Credit Register' }} />    
            <Stack.Screen name="NewTransactions" component={NewTransactionsScreen} options={{ title: 'New Transactions' }} /> 
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth(); // 'loading' here is for initial app load check

  if (loading) {
    // This 'loading' state is for the *initial* app load (checking AsyncStorage).
    // You can replace 'null' with a proper splash screen component if desired.
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;