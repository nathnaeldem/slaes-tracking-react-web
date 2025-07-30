import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, Input, Icon } from 'react-native-elements';

const SalesFormFields = ({
  selectedProduct,
  quantitySold,
  soldPrice,
  comment,
  paymentMethod,
  processing,
  handleSale,
  setQuantitySold,
  setSoldPrice,
  setComment,
  setPaymentMethod,
  setSelectedProduct
}) => (
  <>
    {/* Selected Product Card */}
    <Card containerStyle={styles.selectedProductCard}>
      <View style={styles.cardHeader}>
        <Icon
          name="tag"
          type="font-awesome"
          size={22}
          color="#27ae60"
          containerStyle={{ marginRight: 8 }}
        />
        <Text style={styles.cardTitle}>{selectedProduct.name}</Text>
      </View>
      <Card.Divider />
      <Text style={styles.selectedProductInfo}>
        Available: {selectedProduct.quantity} units
      </Text>
      <Text style={styles.selectedProductInfo}>
        Suggested Price: ${selectedProduct.selling_price}
      </Text>
    </Card>

    {/* Inputs */}
    <View style={styles.inputContainer}>
      <Input
        label="Quantity to Sell"
        placeholder="Enter quantity"
        value={quantitySold}
        onChangeText={setQuantitySold}
        keyboardType="numeric"
        leftIcon={{
          type: 'font-awesome-5',
          name: 'warehouse',
          color: '#2980b9',
        }}
        returnKeyType="done"
        inputContainerStyle={styles.inputInner}
      />

      <Input
        label="Price per Unit"
        placeholder="Enter price"
        value={soldPrice}
        onChangeText={setSoldPrice}
        keyboardType="numeric"
        leftIcon={{
          type: 'font-awesome-5',
          name: 'dollar-sign',
          color: '#2980b9',
        }}
        returnKeyType="done"
        inputContainerStyle={styles.inputInner}
      />

      <Input
        label="Comment (Optional)"
        placeholder="Enter any comments"
        value={comment}
        onChangeText={setComment}
        multiline
        leftIcon={{
          type: 'font-awesome',
          name: 'comment',
          color: '#2980b9',
        }}
        returnKeyType="default"
        inputContainerStyle={styles.inputInner}
      />

      {quantitySold && soldPrice && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total: ${(parseInt(quantitySold) * parseFloat(soldPrice)).toFixed(2)}
          </Text>
        </View>
      )}
    </View>

    {/* Payment Method */}
    <View style={styles.paymentContainer}>
      <Text style={styles.paymentLabel}>Payment Method:</Text>
      <View style={styles.paymentButtons}>
        <Button
          title="Cash"
          onPress={() => setPaymentMethod('cash')}
          buttonStyle={[
            styles.paymentButton,
            paymentMethod === 'cash' && styles.selectedPayment,
          ]}
          icon={
            <Icon
              name="money-bill-wave"
              type="font-awesome-5"
              color="#fff"
              containerStyle={{ marginRight: 6 }}
            />
          }
        />
        <Button
          title="Credit"
          onPress={() => setPaymentMethod('credit')}
          buttonStyle={[
            styles.paymentButton,
            paymentMethod === 'credit' && styles.selectedPayment,
          ]}
          icon={
            <Icon
              name="credit-card"
              type="font-awesome"
              color="#fff"
              containerStyle={{ marginRight: 6 }}
            />
          }
        />
        <Button
          title="Transfer"
          onPress={() => setPaymentMethod('account_transfer')}
          buttonStyle={[
            styles.paymentButton,
            paymentMethod === 'account_transfer' && styles.selectedPayment,
          ]}
          icon={
            <Icon
              name="exchange-alt"
              type="font-awesome-5"
              color="#fff"
              containerStyle={{ marginRight: 6 }}
            />
          }
        />
      </View>
    </View>

    {/* Action Buttons */}
    <View style={styles.buttonContainer}>
      <Button
        title="Cancel"
        onPress={() => setSelectedProduct(null)}
        buttonStyle={styles.cancelButton}
        titleStyle={styles.cancelButtonText}
      />
      <Button
        title="Complete Sale"
        onPress={handleSale}
        loading={processing}
        disabled={processing}
        buttonStyle={styles.saleButton}
        titleStyle={styles.saleButtonText}
        icon={
          <Icon
            name="check-circle"
            type="font-awesome-5"
            color="#fff"
            containerStyle={{ marginRight: 6 }}
          />
        }
      />
    </View>
  </>
);

const styles = StyleSheet.create({
  selectedProductCard: {
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
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
  selectedProductInfo: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputInner: {
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
  },
  totalContainer: {
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  paymentContainer: {
    marginVertical: 18,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  paymentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentButton: {
    flex: 0.3,
    backgroundColor: '#2980b9',
    borderRadius: 20,
    paddingVertical: 8,
  },
  selectedPayment: {
    backgroundColor: '#27ae60',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 6,
    flex: 0.45,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  saleButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    flex: 0.45,
    paddingVertical: 12,
  },
  saleButtonText: {
    fontWeight: 'bold',
  },
});

export default SalesFormFields;