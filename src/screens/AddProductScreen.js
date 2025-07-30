import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import { Button, Input, Card } from 'react-native-elements';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://dankula.x10.mx/auth.php';

const productApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});
axiosRetry(productApi, {
  retries: 3,
  retryDelay: (count) => count * 1000,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || axiosRetry.isIdempotentRequestError(error),
});

const CATEGORIES = ['balstera', 'accessory', 'battery', 'mestawet', 'cherke', 'blon'];

const AddProductScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const ProductSchema = Yup.object().shape({
    name: Yup.string().required('የእቃ ስም ያስፈልጋል'),
    category: Yup.string().required('ምድብ መምረጥ አለብዎት'),
    description: Yup.string(),
    quantity: Yup.number()
      .required('ብዛት አስፈላጊ ነው')
      .positive('ብዛቱ አንፃፃፊ መሆን አለበት')
      .integer('ብዛቱ ቁጥር መሆን አለበት'),
    import_price: Yup.number()
      .required('የማምጫ ዋጋ አስፈላጊ ነው')
      .positive('የማምጫ ዋጋ አንፃፃፊ መሆን አለበት'),
    selling_price: Yup.number()
      .required('የሽያጭ ዋጋ አስፈላጊ ነው')
      .positive('የሽያጭ ዋጋ አንፃፃፊ መሆን አለበት')
      .test('is-greater', 'የሽያጭ ዋጋ ከየማምጫ ዋጋ በላይ መሆን አለበት', function (value) {
        return value > this.parent.import_price;
      }),
  });

  const handleAddProduct = async (values, { resetForm }) => {
    if (user?.role !== 'admin') {
      Alert.alert('Error', 'ምርቶችን ማከል በአድሚኖች ብቻ ይቻላል');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        productApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete productApi.defaults.headers.common['Authorization'];
      }

      const payload = { ...values, status: 'in_store' };
      const res = await productApi.post('', payload, { params: { action: 'addProduct' } });

      if ([200, 201].includes(res.status)) {
        Alert.alert('ስኬት', 'በትክክል ተመዝግቧል', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              navigation.navigate('ProductList');
            },
          },
        ]);
      } else {
        Alert.alert('ስህተት', res.data?.message || 'ምርት ማከል አልተሳካም');
      }
    } catch (err) {
      console.error(err);
      let msg = 'ምርት ማከል አልተሳካም';
      if (axios.isAxiosError(err)) {
        if (err.response) msg = err.response.data?.message || `Error: ${err.response.status}`;
        else if (err.request) msg = 'የአውታረ መረብ ችግር';
        else msg = err.message;
      }
      Alert.alert('ስህተት', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Title h4>አዲስ እቃ መመዝገቢያ</Card.Title>
        <Card.Divider />

        <Formik
          initialValues={{
            name: '',
            category: '',
            description: '',
            quantity: '',
            import_price: '',
            selling_price: '',
          }}
          validationSchema={ProductSchema}
          onSubmit={handleAddProduct}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
          }) => (
            <View>
              <Input
                label="Product Name"
                placeholder="ስም"
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
                errorMessage={touched.name && errors.name}
                labelStyle={{ color: 'black' }}
                placeholderTextColor="#888"
              />

              {/* Category Selector */}
              <Text style={styles.label}>ምድብ</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.selectedCategoryText}>
                  {values.category || 'ምድብ ይምረጡ'}
                </Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
              {touched.category && errors.category && (
                <Text style={styles.errorText}>{errors.category}</Text>
              )}

              <Input
                label="Description - Optional"
                placeholder="የምርቱ መግለጫ"
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                value={values.description}
                multiline
                numberOfLines={3}
                labelStyle={{ color: 'black' }}
                placeholderTextColor="#888"
              />

              <Input
                label="Quantity"
                placeholder="ብዛት"
                onChangeText={handleChange('quantity')}
                onBlur={handleBlur('quantity')}
                value={values.quantity}
                keyboardType="numeric"
                errorMessage={touched.quantity && errors.quantity}
                labelStyle={{ color: 'black' }}
                placeholderTextColor="#888"
              />

              <Input
                label="Import Price"
                placeholder="የማምጫ ዋጋ"
                onChangeText={handleChange('import_price')}
                onBlur={handleBlur('import_price')}
                value={values.import_price}
                keyboardType="numeric"
                errorMessage={touched.import_price && errors.import_price}
                labelStyle={{ color: 'black' }}
                placeholderTextColor="#888"
              />

              <Input
                label="Selling Price"
                placeholder="የሽያጭ ዋጋ"
                onChangeText={handleChange('selling_price')}
                onBlur={handleBlur('selling_price')}
                value={values.selling_price}
                keyboardType="numeric"
                errorMessage={touched.selling_price && errors.selling_price}
                labelStyle={{ color: 'black' }}
                placeholderTextColor="#888"
              />

              <Button
                title="Add product"
                onPress={handleSubmit}
                buttonStyle={styles.submitButton}
                loading={loading}
                disabled={loading}
              />
              <Button
                title="Cancel"
                type="outline"
                onPress={() => navigation.goBack()}
                buttonStyle={styles.cancelButton}
                disabled={loading}
              />

              {/* ← Move Modal inside Formik so setFieldValue is available */}
              <Modal
                visible={showCategoryModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowCategoryModal(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>ምድብ ይምረጡ</Text>
                    <View style={styles.categoriesContainer}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.categoryButton}
                          onPress={() => {
                            setFieldValue('category', cat);
                            setShowCategoryModal(false);
                          }}
                        >
                          <Text style={styles.categoryText}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Button
                      title="ዝጋ"
                      buttonStyle={styles.closeButton}
                      titleStyle={styles.buttonText}
                      onPress={() => setShowCategoryModal(false)}
                    />
                  </View>
                </View>
              </Modal>
            </View>
          )}
        </Formik>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  label: {
    fontSize: 16,
    color: '#86939e',
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 10,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86939e',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    marginHorizontal: 10,
    backgroundColor: '#fff',
  },
  selectedCategoryText: { fontSize: 16, color: '#2d3436' },
  arrow: { fontSize: 16, color: '#86939e' },
  errorText: { color: 'red', marginLeft: 10, marginBottom: 10, fontSize: 14 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  categoryText: { fontSize: 16, color: '#2d3436', fontWeight: '500' },
  closeButton: { backgroundColor: '#e74c3c', borderRadius: 12, height: 48, marginTop: 10 },
  buttonText: { fontWeight: '600', fontSize: 15, color: 'white' },
  submitButton: { backgroundColor: '#2ecc71', marginTop: 20 },
  cancelButton: { marginTop: 10 },
});

export default AddProductScreen;
