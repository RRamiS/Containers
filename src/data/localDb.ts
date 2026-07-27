import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset, Operator, Rental } from './types';

const KEYS = {
  assets: '@containers/assets',
  operators: '@containers/operators',
  rentals: '@containers/rentals',
} as const;

async function read<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function write<T>(key: string, value: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const localDb = {
  assets: {
    list: () => read<Asset>(KEYS.assets),
    save: (items: Asset[]) => write(KEYS.assets, items),
  },
  operators: {
    list: () => read<Operator>(KEYS.operators),
    save: (items: Operator[]) => write(KEYS.operators, items),
  },
  rentals: {
    list: () => read<Rental>(KEYS.rentals),
    save: (items: Rental[]) => write(KEYS.rentals, items),
  },
};

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
