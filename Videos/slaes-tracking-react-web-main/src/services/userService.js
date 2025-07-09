import api from './api';

export const getUsers = () => 
  api.get('?action=get_users');

export const updateUser = (userId, updates) => 
  api.post('?action=update_user', { id: userId, ...updates });

export const resetPassword = (userId) => 
  api.post('?action=reset_password', { user_id: userId });

export const getActivityLogs = (limit = 50, offset = 0) => 
  api.get('?action=get_activity_logs', { params: { limit, offset } });