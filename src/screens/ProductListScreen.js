import React, { useState, useEffect, useCallback } from 'react'; 
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView
} from 'react-native'; 
import { Button, Card, Icon } from 'react-native-elements'; 
import { useAuth } from '../context/AuthContext'; 
import axios from 'axios'; 
import axiosRetry from 'axios-retry'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const API_URL = 'https://dankula.x10.mx/auth.php'; 

const productsApi = axios.create({ 
  baseURL: API_URL, 
  headers: { 
    'Content-Type': 'application/json', 
  }, 
  timeout: 15000, 
}); 

axiosRetry(productsApi, { 
  retries: 3, 
  retryDelay: (retryCount) => { 
    return retryCount * 1000; 
  }, 
  retryCondition: (error) => { 
    return axiosRetry.isNetworkError(error) || axiosRetry.isIdempotentRequestError(error); 
  }, 
  onRetry: (retryCount, error, requestConfig) => { 
    console.log(`Product list API retry attempt ${retryCount} for ${requestConfig.url}: ${error.message}`); 
  }, 
}); 

const ProductListScreen = ({ navigation }) => { 
  const { user } = useAuth(); 
  const [products, setProducts] = useState([]); 
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [categories, setCategories] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('ሁሉም'); 
  const [unitsFilterMode, setUnitsFilterMode] = useState('ሁሉም');
  const [unitsThreshold, setUnitsThreshold] = useState('');

  const fetchProducts = useCallback(async () => { 
    setLoading(true); 
    setError(null); 
    try { 
      const token = await AsyncStorage.getItem('token'); 
      if (token) { 
        productsApi.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
      } else { 
        delete productsApi.defaults.headers.common['Authorization']; 
      } 

      const response = await productsApi.post( 
        '', 
        {}, 
        { 
          params: { action: 'getProducts' }, 
        } 
      ); 

      const fetchedData = response.data.products || []; 
      setProducts(fetchedData); 
      
      // Extract unique categories
      const uniqueCategories = ['ሁሉም', ...new Set(fetchedData.map(p => p.category))];
      setCategories(uniqueCategories);
      
      applyFilters(fetchedData, searchQuery, selectedCategory, unitsFilterMode, unitsThreshold);
    } catch (err) { 
      console.error('Error fetching products:', err); 
      let errorMessage = 'ምርቶችን ማግኘት አልተቻለም። እባክዎ የኢንተርኔት ግንኙነትዎን ያረጋግጡ።'; 

      if (axios.isAxiosError(err)) { 
        if (err.response) { 
          errorMessage = err.response.data?.message || `የሰርቨር ስህተት: ${err.response.status}`; 
          if (err.response.status === 401) { 
            errorMessage = 'የስራ ልውውጥ ጊዜው አልቋል። እባክዎ እንደገና ይግቡ።'; 
          } 
        } else if (err.request) { 
          errorMessage = 'የኔትዎርክ ስህተት፡ ከሰርቨር ምላሽ አልተሰጠም። የኢንተርኔት ግንኙነትዎን ያረጋግጡ።'; 
        } else { 
          errorMessage = err.message || 'ያልታወቀ ስህተት ተፈጥሯል።'; 
        } 
      } 
      setError(errorMessage); 
      Alert.alert('ስህተት', errorMessage); 
    } finally { 
      setLoading(false); 
    } 
  }, [searchQuery, selectedCategory, unitsFilterMode, unitsThreshold]); 

  const applyFilters = (data, query, category, mode, threshold) => {
    let filtered = [...data];
    
    // Apply category filter
    if (category !== 'ሁሉም') {
      filtered = filtered.filter(product => product.category === category);
    }
    
    // Apply units filter
    if (mode !== 'ሁሉም') {
      if (mode === 'ቀሪ አለ') {
        filtered = filtered.filter(product => product.quantity > 0);
      } else if (mode === 'ተጠናቀቀ') {
        filtered = filtered.filter(product => product.quantity <= 0);
      } else if (mode === 'በመጠን' && threshold) {
        const thresholdNum = parseInt(threshold);
        if (!isNaN(thresholdNum)) {
          filtered = filtered.filter(product => product.quantity < thresholdNum);
        }
      }
    }
    
    // Apply search query
    if (query) { 
      const lowerCaseQuery = query.toLowerCase(); 
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(lowerCaseQuery) || 
        product.description?.toLowerCase().includes(lowerCaseQuery)
      ); 
    } 
    
    setFilteredProducts(filtered); 
  }; 

  const handleSearch = (text) => { 
    setSearchQuery(text); 
    applyFilters(products, text, selectedCategory, unitsFilterMode, unitsThreshold); 
  }; 

  const handleCategorySelect = (category) => { 
    setSelectedCategory(category); 
    applyFilters(products, searchQuery, category, unitsFilterMode, unitsThreshold); 
  }; 

  const handleUnitsFilter = (mode) => {
    setUnitsFilterMode(mode);
    applyFilters(products, searchQuery, selectedCategory, mode, unitsThreshold);
  };

  const handleUnitsThresholdChange = (text) => {
    setUnitsThreshold(text);
    if (unitsFilterMode === 'በመጠን') {
      applyFilters(products, searchQuery, selectedCategory, 'በመጠን', text);
    }
  };

  useEffect(() => { 
    fetchProducts(); 
  }, []); 

  const getStatusColor = (status) => { 
    switch (status) { 
      case 'active': 
        return '#00b894'; 
      case 'inactive': 
        return '#e17055'; 
      case 'low_stock': 
        return '#fdcb6e'; 
      default: 
        return '#636e72'; 
    } 
  }; 

  const renderItem = ({ item }) => ( 
    <Card containerStyle={styles.card}> 
      <View style={styles.cardHeader}> 
        <Text style={styles.productName}>{item.name}</Text> 
        <View 
          style={[ 
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }, 
          ]} 
        > 
          <Text style={styles.statusText}>{item.status}</Text> 
        </View> 
      </View> 
      <View style={styles.divider} /> 
      <View style={styles.detailsContainer}> 
        <DetailRow label="የተለያዩ ክፍሎች" value={item.quantity} /> 
        <DetailRow label="የገባበት ዋጋ" value={`${item.import_price} ብር`} /> 
        <DetailRow label="የሽያጭ ዋጋ" value={`${item.selling_price} ብር`} /> 
        <DetailRow label="ምድብ" value={item.category} /> 
      </View> 
      <Button 
        title="ዝርዝር ይመልከቱ" 
        buttonStyle={styles.detailButton} 
        titleStyle={styles.buttonText} 
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} 
      /> 
    </Card> 
  ); 

  return ( 
    <View style={styles.container}> 
      <View style={styles.header}> 
        <Text style={styles.screenTitle}>የምርት ዝርዝር</Text> 
        <Button 
          icon={<Icon name="add" size={20} color="white" />} 
          title="አዲስ" 
          buttonStyle={styles.addButton} 
          titleStyle={styles.buttonText} 
          onPress={() => navigation.navigate('AddProduct')} 
        /> 
      </View> 

      <View style={styles.searchContainer}> 
        <TextInput 
          style={styles.searchInput} 
          placeholder="ምርቶችን ይፈልጉ..." 
          value={searchQuery} 
          onChangeText={handleSearch} 
        /> 
        {searchQuery ? ( 
          <TouchableOpacity 
            style={styles.clearIcon} 
            onPress={() => handleSearch('')} 
          > 
            <Icon name="close" size={20} color="#636e72" /> 
          </TouchableOpacity> 
        ) : null} 
      </View> 

      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>የምድብ ማጣሪያ:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                selectedCategory === category && styles.selectedCategoryPill
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>የቀሪ ክፍሎች ማጣሪያ:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
        >
          {['ሁሉም', 'ቀሪ አለ', 'ተጠናቀቀ', 'በመጠን'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.categoryPill,
                unitsFilterMode === filter && styles.selectedCategoryPill
              ]}
              onPress={() => handleUnitsFilter(filter)}
            >
              <Text style={[
                styles.categoryText,
                unitsFilterMode === filter && styles.selectedCategoryText
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {unitsFilterMode === 'በመጠን' && (
          <View style={styles.thresholdInputContainer}>
            <TextInput
              style={styles.thresholdInput}
              placeholder="ከዚህ በታች ያሉ ምርቶችን አሳይ"
              keyboardType="numeric"
              value={unitsThreshold}
              onChangeText={handleUnitsThresholdChange}
            />
          </View>
        )}
      </View>

      {loading ? ( 
        <View style={styles.loadingContainer}> 
          <ActivityIndicator size="large" color="#0984e3" /> 
        </View> 
      ) : error ? ( 
        <View style={styles.errorContainer}> 
          <Text style={styles.errorText}>{error}</Text> 
          <Button 
            title="እንደገና ይሞክሩ" 
            buttonStyle={styles.retryButton} 
            titleStyle={styles.buttonText} 
            onPress={fetchProducts} 
          /> 
        </View> 
      ) : filteredProducts.length === 0 ? ( 
        <View style={styles.emptyListContainer}> 
          <Icon name="search-off" size={50} color="#b2bec3" /> 
          <Text style={styles.emptyListText}>ምንም ምርቶች አልተገኙም</Text> 
        </View> 
      ) : ( 
        <FlatList 
          data={filteredProducts} 
          renderItem={renderItem} 
          keyExtractor={(item) => item.id.toString()} 
          contentContainerStyle={styles.listContainer} 
          ListFooterComponent={() => ( 
            <View style={{ height: 30 }} /> 
          )} 
          refreshing={loading} 
          onRefresh={fetchProducts} 
        /> 
      )} 
    </View> 
  ); 
}; 

const DetailRow = ({ label, value }) => ( 
  <View style={styles.detailRow}> 
    <Text style={styles.detailLabel}>{label}</Text> 
    <Text style={styles.detailValue}>{value}</Text> 
  </View> 
); 

const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    paddingHorizontal: 20, 
  }, 
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10, 
    marginTop: 10, 
  }, 
  screenTitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#2d3436', 
  }, 
  categoryContainer: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#636e72',
    marginBottom: 8,
  },
  categoryScrollView: {
    paddingBottom: 5,
  },
  categoryPill: {
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  selectedCategoryPill: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  categoryText: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
  },
  thresholdInputContainer: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thresholdInput: {
    color: '#2d3436',
    fontSize: 16,
    height: '100%',
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    height: 48, 
    paddingHorizontal: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2, 
  }, 
  searchInput: { 
    flex: 1, 
    color: '#2d3436', 
    fontSize: 16, 
    height: '100%', 
  }, 
  clearIcon: { 
    padding: 5, 
  }, 
  card: { 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 3, 
  }, 
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
  }, 
  productName: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#2d3436', 
    flex: 1, 
  }, 
  statusBadge: { 
    borderRadius: 12, 
    paddingVertical: 4, 
    paddingHorizontal: 12, 
  }, 
  statusText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: '500', 
  }, 
  divider: { 
    backgroundColor: '#dfe6e9', 
    marginVertical: 8, 
  }, 
  detailsContainer: { 
    marginBottom: 16, 
  }, 
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8, 
  }, 
  detailLabel: { 
    fontSize: 14, 
    color: '#636e72', 
    fontWeight: '500', 
  }, 
  detailValue: { 
    fontSize: 14, 
    color: '#2d3436', 
    fontWeight: '600', 
  }, 
  detailButton: { 
    backgroundColor: '#0984e3', 
    borderRadius: 12, 
    height: 48, 
  }, 
  addButton: { 
    backgroundColor: '#00b894', 
    borderRadius: 12, 
    paddingHorizontal: 20, 
    height: 48, 
  }, 
  buttonText: { 
    fontWeight: '600', 
    fontSize: 15, 
  }, 
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  }, 
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
  }, 
  errorText: { 
    color: '#e74c3c', 
    fontSize: 16, 
    marginVertical: 20, 
    textAlign: 'center', 
  }, 
  retryButton: { 
    backgroundColor: '#5C4033', 
    borderRadius: 12, 
    width: 200, 
    height: 48, 
  }, 
  listContainer: { 
    paddingBottom: 30, 
  }, 
  emptyListContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 50, 
  }, 
  emptyListText: { 
    fontSize: 16, 
    color: '#7f8c8d', 
    marginTop: 10, 
    textAlign: 'center', 
  }, 
});

export default ProductListScreen;