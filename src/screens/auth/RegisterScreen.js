import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const RegisterScreen = ({ navigation }) => {
  const { register, error, clearError } = useAuth();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

  // Clear errors when screen loads
  useEffect(() => {
    clearError();
  }, []);

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      const userData = {
        username: values.username,
        email: values.email,
        password: values.password,
      };

      const success = await register(userData);
      
      if (success) {
        Alert.alert('Success', 'Registration successful! Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (e) {
      // Error will be automatically set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  // Show error alert if exists
  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      clearError();
    }
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text h3 style={styles.headerText}>Create Account</Text>
          <Text style={styles.subHeaderText}>Sign up to get started</Text>
        </View>

        <Formik
          initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <View style={styles.formContainer}>
              <Input
                placeholder="Username"
                leftIcon={{ type: 'font-awesome', name: 'user', size: 20, color: '#86939e' }}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                value={values.username}
                autoCapitalize="none"
                errorMessage={touched.username && errors.username}
                containerStyle={styles.inputContainer}
              />

              <Input
                placeholder="Email"
                leftIcon={{ type: 'font-awesome', name: 'envelope', size: 18, color: '#86939e' }}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                autoCapitalize="none"
                keyboardType="email-address"
                errorMessage={touched.email && errors.email}
                containerStyle={styles.inputContainer}
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
                onBlur={handleBlur('password')}
                value={values.password}
                secureTextEntry={secureTextEntry}
                errorMessage={touched.password && errors.password}
                containerStyle={styles.inputContainer}
              />

              <Input
                placeholder="Confirm Password"
                leftIcon={{ type: 'font-awesome', name: 'lock', size: 20, color: '#86939e' }}
                rightIcon={{
                  type: 'font-awesome',
                  name: confirmSecureTextEntry ? 'eye-slash' : 'eye',
                  size: 20,
                  color: '#86939e',
                  onPress: () => setConfirmSecureTextEntry(!confirmSecureTextEntry),
                }}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                value={values.confirmPassword}
                secureTextEntry={confirmSecureTextEntry}
                errorMessage={touched.confirmPassword && errors.confirmPassword}
                containerStyle={styles.inputContainer}
              />

              <Button
                title="Register"
                onPress={handleSubmit}
                buttonStyle={styles.registerButton}
                titleStyle={styles.registerButtonText}
                disabled={isSubmitting}
                loading={isSubmitting}
              />

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 25,
    height: 50,
    marginTop: 10,
  },
  registerButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  loginText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RegisterScreen;