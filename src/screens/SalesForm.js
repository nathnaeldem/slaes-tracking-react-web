import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import SalesFormFields from './SalesFormFields';

const SalesForm = (props) => (
  <ScrollView contentContainerStyle={styles.saleFormContainer}>
    <SalesFormFields {...props} />
  </ScrollView>
);

const styles = StyleSheet.create({
  saleFormContainer: {
    padding: 16,
    paddingBottom: 40,
  },
});

export default SalesForm;