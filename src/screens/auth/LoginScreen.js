// LoginScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

const LoginScreen = ({ navigation }) => {
  // Use the new 'isAuthenticating' state for the spinner and input disabling
  const { login, error, isAuthenticating } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleLogin = async (values) => {
    // isAuthenticating will be set by AuthContext's login function
    try {
      const success = await login(values.username, values.password);
      if (!success) {
        Alert.alert('Login Failed', error || 'Invalid credentials');
      }
      // IMPORTANT: No manual navigation here. AppNavigator will handle the switch
      // based on isAuthenticated becoming true (which happens when AuthContext sets 'user').
    } catch (e) {
      Alert.alert('Error', e.message || 'Login failed');
    }
    // isAuthenticating will be set to false by AuthContext's finally block automatically.
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text h3 style={styles.headerText}>Betse Spare Parts</Text>
        <Text style={styles.subHeaderText}>Login to your account</Text>
      </View>

      <Formik
        initialValues={{ username: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleSubmit, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Input
              placeholder="Username"
              leftIcon={{ type: 'font-awesome', name: 'user', size: 20, color: '#86939e' }}
              onChangeText={handleChange('username')}
              value={values.username}
              autoCapitalize="none"
              errorMessage={touched.username && errors.username}
              containerStyle={styles.inputContainer}
              // Disable input if isAuthenticating is true
              disabled={isAuthenticating}
            />

            <Input
              placeholder="Password"
              leftIcon={{ type: 'font-awesome', name: 'lock', size: 20, color: '#86939e' }}
              rightIcon={{
                type: 'font-awesome',
                name: secureTextEntry ? 'eye-slash' : 'eye',
                size: 20,
                color: '#86939e',
                onPress: () => setSecureTextEntry(!secureTextEntry),
              }}
              onChangeText={handleChange('password')}
              value={values.password}
              secureTextEntry={secureTextEntry}
              errorMessage={touched.password && errors.password}
              containerStyle={styles.inputContainer}
              // Disable input if isAuthenticating is true
              disabled={isAuthenticating}
            />

            <Button
              title={isAuthenticating ? '' : 'Log In'} // Show empty title when isAuthenticating is true
              onPress={handleSubmit}
              buttonStyle={styles.loginButton}
              titleStyle={styles.loginButtonText}
              disabled={isAuthenticating} // Disable button if isAuthenticating is true
              icon={
                isAuthenticating ? ( // Show ActivityIndicator if isAuthenticating is true
                  <ActivityIndicator
                    color="#fff" // White spinner
                    size="small"
                  />
                ) : null
              }
            />

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isAuthenticating}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#34495e',
    fontSize: 28,
  },
  subHeaderText: {
    fontSize: 18,
    color: '#95a5a6',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1abc9c',
    borderRadius: 25,
    height: 50,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  signupText: {
    color: '#1abc9c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;