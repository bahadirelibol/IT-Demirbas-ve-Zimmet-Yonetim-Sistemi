import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('token');
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = 'İşlem başarısız';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(' ');
      else if (body.message) message = body.message;
    } catch {
      message = 'İşlem başarısız';
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export function codeFromScan(value: string) {
  const trimmed = value.trim();
  const parts = trimmed.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || trimmed);
}
