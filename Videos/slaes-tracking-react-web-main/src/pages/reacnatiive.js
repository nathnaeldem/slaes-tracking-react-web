// File: AnalyticsReportScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';
import { Card, Icon } from 'react-native-elements';
import { LineChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://dankula.x10.mx/auth.php';

const analyticsApi = axios.create({ 
  baseURL: API_URL, 
  headers: { 'Content-Type': 'application/json' }, 
  timeout: 15000, 
});


const AnalyticsReportScreen = ({ navigation }) => { 
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchReport = async () => { 
    setLoading(true); 
    setError(null); 
    try { 
      const token = await AsyncStorage.getItem('token'); 
      analyticsApi.defaults.headers.common['Authorization'] = `Bearer ${token}`; 

      console.log(`Fetching report with start_date: ${formatDate(startDate)} and end_date: ${formatDate(endDate)}`);
      const response = await analyticsApi.post('', {}, {
        params: { 
          action: 'getAnalyticsAndReports',
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        } 
      });

      console.log('Report data received:', response.data);

      if (response.data.success) {
        setReportData(response.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch report');
      }
    } catch (err) { 
      console.error('Error fetching report:', err); 
      setError('Failed to load report. Please try again.'); 
    } finally { 
      setLoading(false); 
    } 
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCurrency = (amount) => {
    return `ETB ${Number(amount).toFixed(2)}`;
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  useEffect(() => { 
    fetchReport(); 
  }, [startDate, endDate]);

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  const renderLineChart = () => {
    if (!reportData?.daily_summary || reportData.daily_summary.length === 0) {
      return null;
    }

    const data = {
      labels: reportData.daily_summary.map(d => new Date(d.date).getDate()),
      datasets: [
        {
          data: reportData.daily_summary.map(d => Number(d.sales)),
          color: (opacity = 1) => `rgba(0, 184, 148, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: reportData.daily_summary.map(d => Number(d.expenses)),
          color: (opacity = 1) => `rgba(225, 112, 85, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Sales", "Expenses"],
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>Sales vs Expenses Trend</Card.Title>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderPieChart = (title, chartData, colors) => {
    if (!chartData || Object.keys(chartData).length === 0) {
      return null;
    }

    const data = Object.entries(chartData).map(([name, population], index) => ({
      name,
      population: Number(population),
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    }));

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>{title}</Card.Title>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          absolute
          hasLegend={false}
        />
        <View style={styles.legendContainer}>
          {data.map(item => (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}: </Text>
              <Text style={styles.legendValue}>{formatCurrency(item.population)}</Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  // Function to render summary cards
  const renderSummaryCard = (title, value, color = '#2d3436') => (
    <Card containerStyle={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, { color }]}>{formatCurrency(value)}</Text>
    </Card>
  );

  // Function to render bank balance rows
  const renderBankBalance = (bank, balance) => (
    <View key={bank} style={styles.bankRow}>
      <Text style={styles.bankName}>{bank}</Text>
      <Text style={[
        styles.bankBalance, 
        { color: balance >= 0 ? '#00b894' : '#e17055' }
      ]}>
        {formatCurrency(balance)}
      </Text>
    </View>
  );

  // Function to render sales transaction items
  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <View style={styles.transactionDetail}>
        <Text>{item.quantity} x {formatCurrency(item.unit_price)}</Text>
        <Text style={styles.itemTotal}>{formatCurrency(item.quantity * item.unit_price)}</Text>
      </View>
      <View style={styles.transactionFooter}>
        <Text style={styles.paymentMethod}>{item.payment_method} - {item.bank_name || 'Cash'}</Text>
        {item.item_unpaid > 0 && (
          <Text style={styles.unpaidAmount}>
            Unpaid: {formatCurrency(item.item_unpaid)}
          </Text>
        )}
      </View>
    </View>
  );

  // Function to render expense items
  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <Text style={styles.expenseReason}>{item.reason}</Text>
      <View style={styles.expenseDetail}>
        <Text style={styles.expenseType}>{item.type === 'spending' ? 'Expense' : 'Order'}</Text>
        <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
      </View>
      <View style={styles.expenseFooter}>
        <Text style={styles.paymentMethod}>{item.payment_method} - {item.bank_name || 'Cash'}</Text>
      </View>
    </View>
  );

  // Function to render bank deposit items
  const renderDepositItem = ({ item }) => (
    <View style={styles.depositItem}>
      <Text style={styles.depositBank}>{item.bank_name}</Text>
      <View style={styles.depositDetail}>
        <Text>{item.reference_number || 'No Ref'}</Text>
        <Text style={styles.depositAmount}>{formatCurrency(item.amount)}</Text>
      </View>
      <Text style={styles.depositDate}>{new Date(item.deposit_date).toLocaleDateString()}</Text>
    </View>
  );

  return ( 
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Financial Analytics Report</Text>
      
      {/* Date Range Selector */}
      <View style={styles.dateContainer}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={styles.dateText}>From: {startDate.toLocaleDateString()}</Text>
          <Icon name="calendar" type="font-awesome" size={20} color="#3498db" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={styles.dateText}>To: {endDate.toLocaleDateString()}</Text>
          <Icon name="calendar" type="font-awesome" size={20} color="#3498db" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchReport}
        >
          <Icon name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={handleStartDateChange}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          onChange={handleEndDateChange}
        />
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Generating report...</Text>
        </View>
      )}

      {/* Error Message */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchReport}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Report Content */}
      {reportData && !loading && !error && (
        <ScrollView style={styles.reportContainer}>
          {/* Date Range Info */}
          <Text style={styles.dateRangeText}>
            Report Period: {new Date(reportData.start_date).toLocaleDateString()} to {new Date(reportData.end_date).toLocaleDateString()}
          </Text>
          
          {/* Financial Summary */}
          <Card containerStyle={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            
            <View style={styles.summaryContainer}>
              {renderSummaryCard('Total Sales', reportData.summary.total_sales)}
              {renderSummaryCard('Total Expenses', reportData.summary.total_expenses, '#e74c3c')}
              {renderSummaryCard('Net Income', 
                reportData.summary.net_income, 
                reportData.summary.net_income >= 0 ? '#27ae60' : '#e74c3c'
              )}
            </View>
          </Card>
          
          {/* Sales vs Expenses Trend */}
          {renderLineChart()}

          {renderPieChart("Sales by Category", reportData.summary.category_sales, ['#00b894', '#00cec9', '#55efc4', '#81ecec', '#74b9ff'])}
          {renderPieChart("Expenses by Category", reportData.summary.expense_categories, ['#d63031', '#e17055', '#ff7675', '#fab1a0', '#fd79a8'])}

          {/* Cash and Bank Balances */}
          <Card containerStyle={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Cash & Bank Balances</Text>
            
            {/* Cash Balance */}
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Cash Balance:</Text>
              <Text style={[
                styles.balanceValue,
                { color: reportData.summary.cash_balance >= 0 ? '#27ae60' : '#e74c3c' }
              ]}>
                {formatCurrency(reportData.summary.cash_balance)}
              </Text>
            </View>
            
            {/* Bank Balances */}
            <View style={styles.bankBalancesContainer}>
              <Text style={styles.subSectionTitle}>Bank Balances</Text>
              {Object.entries(reportData.summary.bank_balances).map(([bank, balance]) => 
                renderBankBalance(bank, balance)
              )}
            </View>
          </Card>
          
          {/* Sales Transactions */}
          <Card containerStyle={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sales Transactions</Text>
              <Text style={styles.countBadge}>{reportData.sales.length} transactions</Text>
            </View>
            <FlatList
              data={reportData.sales}
              renderItem={renderTransactionItem}
              keyExtractor={(item, index) => `${item.transaction_id}_${index}`}
              scrollEnabled={false}
            />
          </Card>
          
          {/* Expenses */}
          <Card containerStyle={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              <Text style={styles.countBadge}>{reportData.expenses.length} records</Text>
            </View>
            <FlatList
              data={reportData.expenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => `${item.type}_${item.id}`}
              scrollEnabled={false}
            />
          </Card>
          
          {/* Bank Deposits */}
          <Card containerStyle={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bank Deposits</Text>
              <Text style={styles.countBadge}>{reportData.deposits.length} deposits</Text>
            </View>
            <FlatList
              data={reportData.deposits}
              renderItem={renderDepositItem}
              keyExtractor={(item) => `deposit_${item.id}`}
              scrollEnabled={false}
            />
          </Card>
          
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </View> 
  ); 
}; 

const styles = StyleSheet.create({ 
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
    color: '#2c3e50',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    elevation: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
    color: '#34495e',
  },
  refreshButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  dateRangeText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#7f8c8d',
    fontSize: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: '#3498db',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    marginRight: 10,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#34495e',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#34495e',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bankBalancesContainer: {
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34495e',
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  bankName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  bankBalance: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryContainer: {
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  categoryName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 6,
  },
  transactionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTotal: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  unpaidAmount: {
    color: '#e74c3c',
    fontWeight: '500',
    fontSize: 14,
  },
  expenseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  expenseReason: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 6,
  },
  expenseDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expenseType: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  expenseAmount: {
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  depositItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  depositBank: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 6,
  },
  depositDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  depositAmount: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  depositDate: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerSpace: {
    height: 50,
  },
});

export default AnalyticsReportScreen;