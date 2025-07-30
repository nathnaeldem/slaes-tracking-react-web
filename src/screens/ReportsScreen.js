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
import { LinearGradient } from 'expo-linear-gradient';

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

      const response = await analyticsApi.post('', {}, {
        params: { 
          action: 'getAnalyticsAndReports',
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        } 
      });

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
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#f8fafc",
    color: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.6,
    fillShadowGradientFrom: "#4f46e5",
    fillShadowGradientTo: "#7c3aed",
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientToOpacity: 0.1,
    decimalPlaces: 0,
    propsForDots: {
      r: "6",
      strokeWidth: "3",
      stroke: "#4f46e5"
    },
    propsForBackgroundLines: {
      strokeDasharray: "5,5",
      stroke: "#e2e8f0",
      strokeWidth: 1
    },
    labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    style: {
      borderRadius: 16
    }
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
  
  const renderSummaryCard = (title, value, color = '#2d3436', iconName = 'trending-up') => (
    <View style={[styles.summaryCard, { borderColor: color }]}>
      <View style={styles.summaryCardHeader}>
        <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
          <Icon name={iconName} size={20} color={color} />
        </View>
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={[styles.summaryValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );

  const renderBalanceDetails = (details) => {
    if (!details || details.length === 0) {
      return <Text style={styles.balanceDetailText}>No transactions in this period.</Text>;
    }
    return details.map((detail, index) => (
        <View key={index} style={styles.balanceDetailItem}>
            <Text style={styles.balanceDetailText}>{detail}</Text>
        </View>
    ));
  };

  const renderBankBalance = (bank, balance) => {
    const details = reportData?.summary?.bank_balance_details?.[bank] || [];
    return (
      <View key={bank} style={styles.bankRow}>
        <View style={styles.bankRowHeader}>
            <Text style={styles.bankName}>{bank}</Text>
            <Text style={[styles.bankBalance, { color: balance >= 0 ? '#00b894' : '#e17055' }]}>
                {formatCurrency(balance)}
            </Text>
        </View>
        <View style={styles.balanceDetailContainer}>
            {renderBalanceDetails(details)}
        </View>
      </View>
    );
  };

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

  const renderPaymentRecordItem = ({ item }) => (
    <View style={styles.paymentRecordItem}>
      <Text style={styles.paymentCustomer}>{item.customer_name || 'Unknown'}</Text>
      <View style={styles.paymentDetail}>
        <Text style={styles.paymentAmount}>{formatCurrency(item.payment_amount)}</Text>
        <Text style={styles.paymentMethod}>
          {item.payment_method} {item.bank_name ? `(${item.bank_name})` : ''}
        </Text>
      </View>
      <Text style={styles.paymentDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return ( 
    <View style={styles.container}>
    
      
      <View style={styles.dateContainer}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
          <Text style={styles.dateText}>From: {startDate.toLocaleDateString()}</Text>
          <Icon name="calendar" type="font-awesome" size={20} color="#3498db" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
          <Text style={styles.dateText}>To: {endDate.toLocaleDateString()}</Text>
          <Icon name="calendar" type="font-awesome" size={20} color="#3498db" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={fetchReport}>
          <Icon name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {showStartPicker && (<DateTimePicker value={startDate} mode="date" onChange={handleStartDateChange} />)}
      {showEndPicker && (<DateTimePicker value={endDate} mode="date" onChange={handleEndDateChange} />)}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Generating report...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReport}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {reportData && !loading && !error && (
        <ScrollView style={styles.reportContainer}>
          <Text style={styles.dateRangeText}>
            Report Period: {new Date(reportData.start_date).toLocaleDateString()} to {new Date(reportData.end_date).toLocaleDateString()}
          </Text>
          <Card containerStyle={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sales Transactions</Text>
              <Text style={styles.countBadge}>{reportData.sales.length} transactions</Text>
            </View>
            <FlatList data={reportData.sales} renderItem={renderTransactionItem} keyExtractor={(item, index) => `${item.transaction_id}_${index}`} scrollEnabled={false} />
          </Card>
          <Card containerStyle={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <View style={styles.summaryContainer}>
              {renderSummaryCard('Total Sales', reportData.summary.total_sales)}
              {renderSummaryCard('Profit', reportData.summary.total_profit, reportData.summary.total_profit >= 0 ? '#27ae60' : '#e74c3c')}
              {renderSummaryCard('Total Expenses', reportData.summary.total_expenses, '#e74c3c')}
              {renderSummaryCard('Net Income', reportData.summary.net_income, reportData.summary.net_income >= 0 ? '#27ae60' : '#e74c3c')}
            </View>
          </Card>
          
          {renderLineChart()}
          {renderPieChart("Sales by Category", reportData.summary.category_sales, ['#00b894', '#00cec9', '#55efc4', '#81ecec', '#74b9ff'])}
          {renderPieChart("Expenses by Category", reportData.summary.expense_categories, ['#d63031', '#e17055', '#ff7675', '#fab1a0', '#fd79a8'])}

          <Card containerStyle={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Cash & Bank Balances</Text>
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Cash Balance:</Text>
              <Text style={[styles.balanceValue, { color: reportData.summary.cash_balance >= 0 ? '#27ae60' : '#e74c3c' }]}>
                {formatCurrency(reportData.summary.cash_balance)}
              </Text>
            </View>
            <View style={styles.balanceDetailContainer}>
                {renderBalanceDetails(reportData.summary.cash_balance_details)}
            </View>
            
            <View style={styles.bankBalancesContainer}>
              <Text style={styles.subSectionTitle}>Bank Balances</Text>
              {Object.entries(reportData.summary.bank_balances).map(([bank, balance]) => 
                renderBankBalance(bank, balance)
              )}
            </View>
          </Card>
          
         
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="money-off" size={24} color="#ef4444" />
                <Text style={styles.sectionTitle}>Expenses</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.countBadgeText, { color: '#ef4444' }]}>{reportData.expenses.length}</Text>
              </View>
            </View>
            <FlatList data={reportData.expenses} renderItem={renderExpenseItem} keyExtractor={(item) => `${item.type}_${item.id}`} scrollEnabled={false} />
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="savings" size={24} color="#10b981" />
                <Text style={styles.sectionTitle}>Bank Deposits</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[styles.countBadgeText, { color: '#10b981' }]}>{reportData.deposits.length}</Text>
              </View>
            </View>
            <FlatList data={reportData.deposits} renderItem={renderDepositItem} keyExtractor={(item) => `deposit_${item.id}`} scrollEnabled={false} />
          </View>
          
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Icon name="payment" size={24} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Payment Records</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.countBadgeText, { color: '#3b82f6' }]}>{reportData.payment_records.length}</Text>
              </View>
            </View>
            <FlatList data={reportData.payment_records} renderItem={renderPaymentRecordItem} keyExtractor={(item) => `payment_${item.id}`} scrollEnabled={false} />
          </View>
          
          <View style={styles.footerSpace} />
        </ScrollView>
      )}
    </View> 
  ); 
}; 

const styles = StyleSheet.create({ 
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
  
  // Date Container Styles
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  datePickerSection: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e293b',
  },
  dateSeparator: {
    width: 12,
    height: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  refreshButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Summary Section Styles
  summarySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
    textAlign:'center'
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  
  // Balance Card
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  balanceDetailContainer: {
    paddingLeft: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e2e8f0',
  },
  balanceDetailItem: {
    paddingVertical: 4,
  },
  balanceDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  
  // Bank Balances Card
  bankBalancesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankBalancesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  bankRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bankRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  bankBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  
  // Section Card
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Chart Styles
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    marginVertical: 12,
    borderRadius: 16,
  },
  legendContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    marginRight: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  
  // Transaction Item Styles
  transactionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  transactionDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unpaidAmount: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Expense Item Styles
  expenseItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  expenseReason: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  expenseDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expenseType: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  
  // Deposit Item Styles
  depositItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  depositBank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  dateRangeText:{
    textAlign:'center'
  },
  depositDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  depositAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  depositDate: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
  
  // Payment Record Item Styles
  paymentRecordItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  paymentCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  paymentDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentDate: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContent: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Footer
  footerSpace: {
    height: 80,
  },
});

export default AnalyticsReportScreen;
