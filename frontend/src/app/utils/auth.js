import { setAuthToken } from './api';

export function logout() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  } catch (e) {
    // ignore
  }
  // redirect to login
  if (typeof window !== 'undefined') window.location.href = '/login';
}
