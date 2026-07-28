import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset, ContainerStockConfig, FixedContainer, Operator, Rental } from './types';

const KEYS = {
  assets: '@containers/assets',
  operators: '@containers/operators',
  rentals: '@containers/rentals',
  stockConfig: '@containers/stock_config',
  fixedContainers: '@containers/fixed_containers',
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
  fixedContainers: {
    list: () => read<FixedContainer>(KEYS.fixedContainers),
    save: (items: FixedContainer[]) => write(KEYS.fixedContainers, items),
  },
  stockConfig: {
    get: async (): Promise<ContainerStockConfig> => {
      const raw = await AsyncStorage.getItem(KEYS.stockConfig);
      if (!raw) return { total_units: 10 }; // Default initial stock
      try {
        return JSON.parse(raw) as ContainerStockConfig;
      } catch {
        return { total_units: 10 };
      }
    },
    save: async (config: ContainerStockConfig): Promise<void> => {
      await AsyncStorage.setItem(KEYS.stockConfig, JSON.stringify(config));
    },
  },
  operators: {
    list: async () => {
      const items = await read<Operator>(KEYS.operators);
      if (items.length === 0) {
        const initial: Operator[] = [
          {
            id: 'op-1',
            full_name: 'Carlos Chofer',
            phone: '2664001122',
            license: 'ABC-12345',
            username: 'chofer1',
            password: '123456',
            active: true,
            created_at: nowIso(),
            updated_at: nowIso(),
          },
        ];
        await write(KEYS.operators, initial);
        return initial;
      }
      return items;
    },
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
