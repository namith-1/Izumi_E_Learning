import { apiClient } from './instructorAuthApi';

export const sendMessage = async (data) => {
  const response = await apiClient.post('/contact-admin/send-message', data);
  return response.data;
};

export const getMessages = async () => {
  const response = await apiClient.get('/contact-admin/messages');
  return response.data;
};
