import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import SalesProductItem from './SalesProductItem';

const SalesProductList = ({ products, loading, selectedProduct, selectProduct }) => (
  <FlatList
    data={products}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => (
      <SalesProductItem
        item={item}
        selected={selectedProduct?.id === item.id}
        onSelect={() => selectProduct(item)}
      />
    )}
    contentContainerStyle={styles.list}
  />
);

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
});

export default SalesProductList;