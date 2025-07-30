import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, FlatList, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = 'https://dankula.x10.mx/auth.php';
const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});
axiosRetry(adminApi, { retries: 2, retryDelay: axiosRetry.exponentialDelay });

export default function AdminUserManagement() {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    current_password: '', new_password: '',
    worker_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);

  const callApi = async (action, data) => {
    const token = await AsyncStorage.getItem('token');
    const res = await adminApi.post(`?action=${action}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await callApi('get_workers', {});
      if (response.success) {
        setWorkers(response.workers);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch workers.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }, []);

  useEffect(() => {
    if (mode === 'create_worker') {
      fetchWorkers();
    }
  }, [mode, fetchWorkers]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'create_worker') {
        if (!form.worker_name.trim()) throw new Error('Worker name is required.');
        const stored = await AsyncStorage.getItem('user');
        if (!stored) throw new Error('Failed to determine your organization.');
        const { organization_id } = JSON.parse(stored);
        const response = await callApi('create_worker', {
          name: form.worker_name,
          organization_id
        });
        if (response.success) {
          Alert.alert('Success', 'Worker created successfully.');
          fetchWorkers(); // Refresh worker list
        } else {
          throw new Error(response.message || 'Failed to create worker.');
        }
        setForm(f => ({ ...f, worker_name: '' }));

      } else if (mode === 'register') {
        if (!form.username || !form.email || !form.password) {
          throw new Error('Please fill all fields.');
        }
        const response = await callApi('register_user', {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        if (response.success) {
          Alert.alert('Success', 'User registered successfully.');
          setForm(f => ({ ...f, username: '', email: '', password: '' }));
        } else {
          throw new Error(response.message || 'Registration failed.');
        }

      } else {
        if (!form.current_password || !form.new_password) {
          throw new Error('Please fill all fields.');
        }
        const response = await callApi('change_password', {
          current_password: form.current_password,
          new_password: form.new_password,
        });
        if (response.success) {
          Alert.alert('Success', 'Password changed.');
          setForm(f => ({ ...f, current_password: '', new_password: '' }));
        } else {
          throw new Error(response.message || 'Password change failed.');
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this worker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await callApi('delete_worker', { worker_id: workerId });
              if (response.success) {
                Alert.alert('Success', 'Worker deleted successfully.');
                fetchWorkers(); // Refresh worker list
              } else {
                throw new Error(response.message || 'Failed to delete worker.');
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchBtn, mode === 'register' && styles.activeSwitch]}
          onPress={() => setMode('register')}
        >
          <Text style={[styles.switchText, mode === 'register' && styles.activeSwitchText]}>
            Register User
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, mode === 'change_password' && styles.activeSwitch]}
          onPress={() => setMode('change_password')}
        >
          <Text style={[styles.switchText, mode === 'change_password' && styles.activeSwitchText]}>
            Change Password
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, mode === 'create_worker' && styles.activeSwitch]}
          onPress={() => setMode('create_worker')}
        >
          <Text style={[styles.switchText, mode === 'create_worker' && styles.activeSwitchText]}>
            Create Worker
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        {mode === 'create_worker' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Worker Name"
              value={form.worker_name}
              onChangeText={t => setForm(f => ({ ...f, worker_name: t }))}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Worker</Text>}
            </TouchableOpacity>

            <Text style={styles.listHeader}>Existing Workers</Text>
            <FlatList
              data={workers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.workerItem}>
                  <Text>{item.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteWorker(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text>No workers found.</Text>}
            />
          </>
        ) : mode === 'register' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={form.username}
              onChangeText={t => setForm(f => ({ ...f, username: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              onChangeText={t => setForm(f => ({ ...f, email: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={form.password}
              onChangeText={t => setForm(f => ({ ...f, password: t }))}
            />
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={form.current_password}
              onChangeText={t => setForm(f => ({ ...f, current_password: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={form.new_password}
              onChangeText={t => setForm(f => ({ ...f, new_password: t }))}
            />
          </>
        )}

        {mode !== 'create_worker' && (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'register' ? 'Register' : 'Change Password'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  switchBtn: { padding: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeSwitch: { borderBottomColor: '#007bff' },
  switchText: { fontSize: 16, color: '#777' },
  activeSwitchText: { color: '#007bff', fontWeight: 'bold' },
  formContainer: {},
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 12 },
  button: { backgroundColor: '#007bff', padding: 12, borderRadius: 4, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  workerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  deleteButton: { backgroundColor: 'red', padding: 8, borderRadius: 4 },
  deleteButtonText: { color: '#fff' }
});
