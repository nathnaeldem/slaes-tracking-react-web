// CommissionReportScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert,
  TouchableOpacity, SectionList, Platform, Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { ListItem, Icon } from 'react-native-elements';

const API_URL = 'https://dankula.x10.mx/auth.php';
const screenWidth = Dimensions.get('window').width;
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});
axiosRetry(api, { retries: 2, retryDelay: axiosRetry.exponentialDelay });

const EthiopianCalendar = {
  months: [
    'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit',
    'Megabit','Miazia','Ginbot','Sene','Hamle','Nehase','Pagume'
  ],
  ETHIOPIC_EPOCH: 1723856,
  gregorianToEthiopian(date) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const a = Math.floor((14 - m) / 12),
          y1 = y + 4800 - a,
          m1 = m + 12 * a - 3,
          jd = d + Math.floor((153 * m1 + 2) / 5)
               + 365 * y1 + Math.floor(y1 / 4)
               - Math.floor(y1 / 100) + Math.floor(y1 / 400)
               - 32045;
    const r = jd - this.ETHIOPIC_EPOCH,
          cycle = Math.floor(r / 1461),
          rem = r % 1461,
          yearInCycle = Math.floor(rem / 365),
          year = cycle * 4 + yearInCycle,
          dayOfYear = rem % 365,
          month = Math.floor(dayOfYear / 30) + 1,
          day = (dayOfYear % 30) + 1;
    return { year, month, day };
  },
  formatEthiopianDate(y, m, d) {
    return `${d} ${this.months[m - 1]} ${y}`;
  }
};

export default function CommissionReportScreen() {
  const [selectedDate, setSelectedDate]       = useState(new Date());
  const [showPicker, setShowPicker]           = useState(false);
  const [isEthiopianCalendar, setIsEthio]     = useState(false);
  const [timeframe, setTimeframe]             = useState('daily');
  const [summary, setSummary]                 = useState({ unpaid:0, paid:0, tariffSum:0 });
  const [carwashTxs, setCarwashTxs]           = useState([]);
  const [paidComms, setPaidComms]             = useState([]);
  const [carwashSpendings, setCarwashSpendings] = useState([]);
  const [loading, setLoading]                 = useState(false);

  const formatDateTime = (d, end = false) => {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const hh   = end ? '23' : '00';
    const mi   = end ? '59' : '00';
    const ss   = end ? '59' : '00';
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  const formatTime12Hour = (time24) => {
    // Expecting format like "14:30:45"
    if (!time24 || time24.length < 5) return time24;
    
    const [hours24, minutes, seconds] = time24.split(':');
    const hours = parseInt(hours24, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${hours12}:${minutes}${seconds ? `:${seconds}` : ''} ${period}`;
  };

  const getDisplayDate = () => {
    if (!isEthiopianCalendar) return selectedDate.toISOString().slice(0,10);
    const { year, month, day } = EthiopianCalendar.gregorianToEthiopian(selectedDate);
    return EthiopianCalendar.formatEthiopianDate(year, month, day);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const start = formatDateTime(selectedDate, false);
      const end   = formatDateTime(selectedDate, true);
      const dailyParams = timeframe === 'daily'
        ? { start, end }
        : {};

      // 1. Commission summary
      const sumRes = await api.get('', {
        params: {
          action: 'get_commission_summary',
          filter: timeframe,
          ...dailyParams
        }
      });

      // 2. Carwash spendings
      const csRes = await api.get('', {
        params: {
          action: 'get_carwash_spendings',
          filter: timeframe,
          ...dailyParams
        }
      });
      if (csRes.data.success) {
        setCarwashSpendings(
          csRes.data.spendings.map(sp => ({
            ...sp,
            uniqueKey: `cs-${sp.id}`
          }))
        );
      }

      // 3. Carwash transactions
      const cwRes = await api.get('', {
        params: {
          action: 'get_carwash_transactions',
          filter: timeframe,
          ...dailyParams
        }
      });
      if (cwRes.data.success) {
        setCarwashTxs(
          cwRes.data.transactions.map(tx => ({
            ...tx,
            uniqueKey: `cw-${tx.id}`
          }))
        );
      }

      // 4. Paid commissions
      const pcRes = await api.get('', {
        params: {
          action: 'get_paid_commissions',
          filter: timeframe,
          ...dailyParams
        }
      });
      if (pcRes.data.success) {
        setPaidComms(
          pcRes.data.commissions.map(pc => ({
            ...pc,
            uniqueKey: `pc-${pc.id}`
          }))
        );
      }

      // update summary
      if (sumRes.data.success) {
        setSummary({
          unpaid:    parseFloat(sumRes.data.total_unpaid) || 0,
          paid:      parseFloat(sumRes.data.total_paid)   || 0,
          tariffSum: parseFloat(sumRes.data.tariff_sum)   || 0
        });
      }

    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // calculate totals
  const totalSpend = carwashSpendings.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const netIncome  = (summary.tariffSum * 0.75 - totalSpend).toFixed(2);

  const renderCarwash = ({ item }) => (
    <ListItem 
      key={item.uniqueKey} 
      bottomDivider
      containerStyle={styles.listItem}
    >
      <Icon name="local-car-wash" type="material" color="#3498db" />
      <ListItem.Content>
        <ListItem.Title style={styles.listTitle}>
          {item.worker_name} → {item.vehicle_name}
        </ListItem.Title>
        <ListItem.Subtitle style={styles.listSubtitle}>
          {item.payment_method} | ₵{item.tariff}
        </ListItem.Subtitle>
      </ListItem.Content>
      <View style={styles.trailingContainer}>
        <Text style={styles.txDate}>{formatTime12Hour(item.transaction_date.slice(11,19))}</Text>
      </View>
    </ListItem>
  );

  const renderPaid = ({ item }) => (
    <ListItem 
      key={item.uniqueKey} 
      bottomDivider
      containerStyle={styles.listItem}
    >
      <Icon name="paid" type="material" color="#27ae60" />
      <ListItem.Content>
        <ListItem.Title style={styles.listTitle}>{item.worker_name}</ListItem.Title>
        <ListItem.Subtitle style={styles.listSubtitle}>₵{item.amount}</ListItem.Subtitle>
      </ListItem.Content>
      <View style={styles.trailingContainer}>
        <Text style={styles.txDate}>{formatTime12Hour(item.paid_at.slice(11,19))}</Text>
      </View>
    </ListItem>
  );

  const renderSpending = ({ item }) => (
    <ListItem 
      key={item.uniqueKey} 
      bottomDivider
      containerStyle={styles.listItem}
    >
      <Icon name="money-off" type="material" color="#e74c3c" />
      <ListItem.Content>
        <ListItem.Title style={styles.listTitle}>
          {item.worker_name}: ₵{item.amount}
        </ListItem.Title>
        <ListItem.Subtitle style={styles.listSubtitle}>
          {item.category} – {item.reason}
        </ListItem.Subtitle>
      </ListItem.Content>
      <View style={styles.trailingContainer}>
        <Text style={styles.txDate}>{formatTime12Hour(item.transaction_date.slice(11,19))}</Text>
      </View>
    </ListItem>
  );

  // Render empty state for sections with no data
  const renderEmptyComponent = (sectionTitle) => {
    let message = 'No data available';
    let iconName = 'info-outline';
    
    switch (sectionTitle) {
      case 'Carwash Transactions':
        message = 'No carwash transactions found for this period';
        iconName = 'local-car-wash';
        break;
      case 'Paid Commissions':
        message = 'No paid commissions found for this period';
        iconName = 'paid';
        break;
      case 'Carwash Spendings':
        message = 'No carwash spendings found for this period';
        iconName = 'money-off';
        break;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Icon name={iconName} type="material" size={24} color="#95a5a6" />
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Commission Reports</Text>
        
        <View style={styles.dateRow}>
          <View style={styles.dateDisplay}>
            <Text style={styles.dateLabel}>
              {isEthiopianCalendar ? 'Ethiopian Date' : 'Gregorian Date'}
            </Text>
            <Text style={styles.dateValue}>{getDisplayDate()}</Text>
          </View>
          
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={styles.calendarToggle} 
              onPress={() => setIsEthio(e => !e)}
            >
              <Text style={styles.calendarToggleText}>
                {isEthiopianCalendar ? 'ET' : 'GR'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowPicker(true)}>
              <Icon name="calendar-month" type="material" color="#fff" size={18} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.filterBar}>
          {['daily','weekly','monthly'].map(tf => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.filterBtn,
                timeframe === tf && styles.filterBtnActive
              ]}
              onPress={() => setTimeframe(tf)}
            >
              <Text
                style={[
                  styles.filterText,
                  timeframe === tf && styles.filterTextActive
                ]}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowPicker(false);
            date && setSelectedDate(date);
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Loading or Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <>
          {/* Summary Row */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Unpaid</Text>
                <Text style={styles.summaryVal}>₵{summary.unpaid.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={styles.summaryVal}>₵{summary.paid.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Net Income</Text>
                <Text style={styles.summaryVal}>₵{netIncome}</Text>
              </View>
            </View>
          </View>

          {/* SectionList */}
          <SectionList
            contentContainerStyle={styles.content}
            sections={[
              { title: 'Carwash Transactions', data: carwashTxs },
              { title: 'Paid Commissions',      data: paidComms },
              { title: 'Carwash Spendings',     data: carwashSpendings }
            ]}
            keyExtractor={item => item.uniqueKey}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item, section }) => {
              switch (section.title) {
                case 'Carwash Transactions': return renderCarwash({ item });
                case 'Paid Commissions':      return renderPaid({ item });
                case 'Carwash Spendings':     return renderSpending({ item });
              }
            }}
            renderSectionFooter={({ section }) => {
              // Show empty state message when section has no data
              return section.data.length === 0 ? renderEmptyComponent(section.title) : null;
            }}
            stickySectionHeadersEnabled={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateDisplay: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarToggle: {
    backgroundColor: '#3498db',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  calendarToggleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: '#2c3e50',
    borderRadius: 6,
    padding: 10,
  },
  filterBar: {
    flexDirection: 'row',
    marginTop: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  filterBtnActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    color: '#333',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryBox: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 10,
    marginBottom: 15,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  trailingContainer: {
    alignItems: 'flex-end',
  },
  txDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
});
