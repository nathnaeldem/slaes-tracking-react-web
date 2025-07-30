// AdminVehicleManagement.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = 'https://dankula.x10.mx/auth.php';
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
axiosRetry(api, { retries: 2, retryDelay: axiosRetry.exponentialDelay });

export default function AdminVehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [mode, setMode] = useState('add');
  const [form, setForm] = useState({ id: null, name: '', tariff: '', partial_tariff: '' });
  const [loading, setLoading] = useState(false);

  const callApi = async (action, data = {}) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post(`?action=${action}`, data, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await callApi('get_vehicles');
      if (res.success) setVehicles(res.vehicles);
      else throw new Error(res.message);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicles(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.tariff) return Alert.alert('Error', 'Both fields are required.');
    setLoading(true);
    try {
      const action = mode === 'add' ? 'create_vehicle' : 'update_vehicle';
      const payload = mode === 'add'
        ? { name: form.name, tariff: parseFloat(form.tariff), partial_tariff: parseFloat(form.partial_tariff) || 0 }
        : { id: form.id, name: form.name, tariff: parseFloat(form.tariff), partial_tariff: parseFloat(form.partial_tariff) || 0 };
      const res = await callApi(action, payload);
      if (!res.success) throw new Error(res.message);
      Alert.alert('Success', mode === 'add' ? 'Vehicle added.' : 'Vehicle updated.');
      setForm({ id: null, name: '', tariff: '' });
      setMode('add');
      loadVehicles();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = v => {
    setForm({ 
      id: v.id, 
      name: v.name, 
      tariff: String(v.tariff),
      partial_tariff: String(v.partial_tariff || '')
    });
    setMode('edit');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setMode('add'); setForm({ id: null, name: '', tariff: '' }); }}>
          <Text style={[styles.tab, mode==='add' && styles.activeTab]}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={loadVehicles}>
          <Text style={styles.tab}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Vehicle Name"
          value={form.name}
          onChangeText={t => setForm(f => ({ ...f, name: t }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Tariff"
          keyboardType="numeric"
          value={form.tariff}
          onChangeText={t => setForm(f => ({ ...f, tariff: t }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Partial Tariff"
          keyboardType="numeric"
          value={form.partial_tariff}
          onChangeText={t => setForm(f => ({ ...f, partial_tariff: t }))}
        />
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>{mode==='add'?'Add Vehicle':'Update Vehicle'}</Text>}
        </TouchableOpacity>
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={item => String(item.id)}
        renderItem={({item})=>(
          <View style={styles.item}>
            <View>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSub}>Tariff: {item.tariff}</Text>
              {item.partial_tariff > 0 && <Text style={styles.itemSub}>Partial Tariff: {item.partial_tariff}</Text>}
            </View>
            <TouchableOpacity onPress={()=>startEdit(item)}>
              <Text style={styles.edit}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  header: { flexDirection:'row', marginBottom:12, justifyContent:'space-between' },
  tab: { fontSize:16, color:'#777' },
  activeTab: { color:'#007bff', fontWeight:'bold' },
  form: { marginBottom:24 },
  input: { borderWidth:1, borderColor:'#ccc', borderRadius:4, padding:10, marginBottom:12 },
  button: { backgroundColor:'#007bff', padding:12, borderRadius:4, alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'bold' },
  item: { flexDirection:'row', justifyContent:'space-between', padding:12, borderBottomWidth:1, borderColor:'#eee' },
  itemText: { fontSize:16 },
  itemSub: { color:'#555' },
  edit: { color:'#007bff' }
});
