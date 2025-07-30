import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Icon } from 'react-native-elements';

const SalesProductItem = ({ item, selected, onSelect }) => (
  <Card containerStyle={styles.card}>
    <View style={styles.cardInner}>
      <View style={styles.cardHeader}>
        <Icon
          name="box-open"
          type="font-awesome-5"
          size={22}
          color="#2980b9"
          containerStyle={{ marginRight: 8 }}
        />
        <Text style={styles.cardTitle}>{item.name}</Text>
      </View>
      <Card.Divider />

      <View style={styles.productInfo}>
        <View style={styles.infoRow}>
          <Icon
            name="boxes"
            type="font-awesome-5"
            size={18}
            color="#34495e"
            containerStyle={styles.iconSpacing}
          />
          <Text style={styles.label}>Available:</Text>
          <Text style={styles.value}>{item.quantity} units</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon
            name="tag"
            type="font-awesome"
            size={18}
            color="#34495e"
            containerStyle={styles.iconSpacing}
          />
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>${item.selling_price}</Text>
        </View>
        {item.description && (
          <View style={styles.infoRow}>
            <Icon
              name="info-circle"
              type="font-awesome"
              size={18}
              color="#34495e"
              containerStyle={styles.iconSpacing}
            />
            <Text style={styles.label}>Desc:</Text>
            <Text style={styles.value}>{item.description}</Text>
          </View>
        )}
      </View>

      <Button
        title={selected ? 'Selected' : 'Select for Sale'}
        onPress={onSelect}
        buttonStyle={[
          styles.selectButton,
          selected && styles.selectedButton,
        ]}
        titleStyle={styles.selectButtonText}
        icon={
          <Icon
            name={selected ? 'check-circle' : 'cart-plus'}
            type="font-awesome"
            color="#fff"
            containerStyle={{ marginRight: 6 }}
          />
        }
      />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInner: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  productInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconSpacing: {
    width: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    width: '30%',
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    flexWrap: 'wrap',
  },
  selectButton: {
    backgroundColor: '#2980b9',
    borderRadius: 6,
    paddingVertical: 10,
  },
  selectedButton: {
    backgroundColor: '#27ae60',
  },
  selectButtonText: {
    fontWeight: 'bold',
  },
});

export default SalesProductItem;