import { addDays, format, parseISO } from 'date-fns';
import { createId, localDb, nowIso } from './localDb';
import { isSupabaseConfigured, supabase } from './supabase';
import type {
  Asset,
  ContainerStockConfig,
  CreateAssetInput,
  CreateFixedContainerInput,
  CreateOperatorInput,
  CreateRentalInput,
  FixedContainer,
  Operator,
  Rental,
  RentalWithRelations,
  StockSummary,
  UpdateAssetInput,
  UpdateFixedContainerInput,
  UpdateOperatorInput,
  UpdateRentalInput,
} from './types';

function computeEndDate(startDate: string, rentalDays: number): string {
  return format(addDays(parseISO(startDate), rentalDays), 'yyyy-MM-dd');
}

async function enrichRentals(rentals: Rental[]): Promise<RentalWithRelations[]> {
  const [assets, operators] = await Promise.all([assetsRepo.list(), operatorsRepo.list()]);
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const opMap = new Map(operators.map((o) => [o.id, o]));

  return rentals.map((rental) => ({
    ...rental,
    asset: rental.asset_id ? assetMap.get(rental.asset_id) ?? null : null,
    delivery_operator: rental.delivery_operator_id
      ? opMap.get(rental.delivery_operator_id) ?? null
      : null,
    pickup_operator: rental.pickup_operator_id
      ? opMap.get(rental.pickup_operator_id) ?? null
      : null,
  }));
}

export const fixedContainersRepo = {
  async list(): Promise<FixedContainer[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('fixed_containers').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as FixedContainer[];
    }
    const items = await localDb.fixedContainers.list();
    return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async create(input: CreateFixedContainerInput): Promise<FixedContainer> {
    const stamp = nowIso();
    const item: FixedContainer = { ...input, id: createId(), created_at: stamp, updated_at: stamp };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('fixed_containers').insert(item).select().single();
      if (!error && data) return data as FixedContainer;
    }

    const items = await localDb.fixedContainers.list();
    items.push(item);
    await localDb.fixedContainers.save(items);
    return item;
  },

  async update(id: string, input: UpdateFixedContainerInput): Promise<FixedContainer> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('fixed_containers')
        .update({ ...input, updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as FixedContainer;
    }

    const items = await localDb.fixedContainers.list();
    const index = items.findIndex((f) => f.id === id);
    if (index < 0) throw new Error('Contenedor fijo no encontrado');
    items[index] = { ...items[index], ...input, updated_at: nowIso() };
    await localDb.fixedContainers.save(items);
    return items[index];
  },

  async remove(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('fixed_containers').delete().eq('id', id);
      if (!error) return;
    }
    const items = await localDb.fixedContainers.list();
    await localDb.fixedContainers.save(items.filter((f) => f.id !== id));
  },
};

export const stockRepo = {
  async getConfig(): Promise<ContainerStockConfig> {
    return localDb.stockConfig.get();
  },

  async saveConfig(config: ContainerStockConfig): Promise<ContainerStockConfig> {
    await localDb.stockConfig.save(config);
    return config;
  },

  async getSummary(): Promise<StockSummary> {
    const config = await this.getConfig();
    const fixedList = await fixedContainersRepo.list();
    const rentals = await rentalsRepo.list();

    const in_client = rentals.filter((r) => r.status === 'activo').length;
    const in_transit = rentals.filter((r) => r.status === 'en_proceso').length;
    const fixed = fixedList.length;
    const total = config.total_units;
    const in_depot = Math.max(0, total - in_client - in_transit - fixed);

    return {
      total,
      in_depot,
      in_client,
      in_transit,
      fixed,
    };
  },
};

export const assetsRepo = {
  async list(): Promise<Asset[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Asset[];
    }
    const items = await localDb.assets.list();
    return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async create(input: CreateAssetInput): Promise<Asset> {
    const stamp = nowIso();
    const item: Asset = { ...input, id: createId(), created_at: stamp, updated_at: stamp };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('assets').insert(item).select().single();
      if (error) throw error;
      return data as Asset;
    }

    const items = await localDb.assets.list();
    items.push(item);
    await localDb.assets.save(items);
    return item;
  },

  async update(id: string, input: UpdateAssetInput): Promise<Asset> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('assets')
        .update({ ...input, updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    }

    const items = await localDb.assets.list();
    const index = items.findIndex((a) => a.id === id);
    if (index < 0) throw new Error('Asset not found');
    items[index] = { ...items[index], ...input, updated_at: nowIso() };
    await localDb.assets.save(items);
    return items[index];
  },

  async remove(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const items = await localDb.assets.list();
    await localDb.assets.save(items.filter((a) => a.id !== id));
  },
};

export const operatorsRepo = {
  async list(): Promise<Operator[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('operators').select('*').order('full_name');
      if (error) throw error;
      return (data ?? []) as Operator[];
    }
    const items = await localDb.operators.list();
    return items.sort((a, b) => a.full_name.localeCompare(b.full_name));
  },

  async create(input: CreateOperatorInput): Promise<Operator> {
    const stamp = nowIso();
    const item: Operator = { ...input, id: createId(), created_at: stamp, updated_at: stamp };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('operators').insert(item).select().single();
      if (error) throw error;
      return data as Operator;
    }

    const items = await localDb.operators.list();
    items.push(item);
    await localDb.operators.save(items);
    return item;
  },

  async update(id: string, input: UpdateOperatorInput): Promise<Operator> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('operators')
        .update({ ...input, updated_at: nowIso() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Operator;
    }

    const items = await localDb.operators.list();
    const index = items.findIndex((o) => o.id === id);
    if (index < 0) throw new Error('Operator not found');
    items[index] = { ...items[index], ...input, updated_at: nowIso() };
    await localDb.operators.save(items);
    return items[index];
  },

  async remove(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('operators').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const items = await localDb.operators.list();
    await localDb.operators.save(items.filter((o) => o.id !== id));
  },
};

export const rentalsRepo = {
  async list(status?: string): Promise<RentalWithRelations[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('rentals')
        .select('*, delivery_operator:operators!rentals_delivery_operator_id_fkey(*), pickup_operator:operators!rentals_pickup_operator_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RentalWithRelations[];
    }

    let items = await localDb.rentals.list();
    if (status) items = items.filter((r) => r.status === status);
    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return enrichRentals(items);
  },

  async get(id: string): Promise<RentalWithRelations | null> {
    const all = await this.list();
    return all.find((r) => r.id === id) ?? null;
  },

  async create(input: CreateRentalInput): Promise<Rental> {
    const stamp = nowIso();
    const end_date = input.end_date ?? computeEndDate(input.start_date, input.rental_days);
    const item: Rental = {
      ...input,
      asset_id: input.asset_id ?? null,
      rental_type: input.rental_type ?? 'temporal',
      end_date,
      id: createId(),
      created_at: stamp,
      updated_at: stamp,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('rentals').insert(item).select().single();
      if (error) throw error;
      return data as Rental;
    }

    const items = await localDb.rentals.list();
    items.push(item);
    await localDb.rentals.save(items);

    return item;
  },

  async update(id: string, input: UpdateRentalInput): Promise<Rental> {
    const stamp = nowIso();

    if (isSupabaseConfigured && supabase) {
      const patch: UpdateRentalInput & { end_date?: string; updated_at: string } = {
        ...input,
        updated_at: stamp,
      };
      if (input.start_date || input.rental_days) {
        const current = await this.get(id);
        if (current) {
          const start = input.start_date ?? current.start_date;
          const days = input.rental_days ?? current.rental_days;
          patch.end_date = computeEndDate(start, days);
        }
      }
      const { data, error } = await supabase.from('rentals').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data as Rental;
    }

    const items = await localDb.rentals.list();
    const index = items.findIndex((r) => r.id === id);
    if (index < 0) throw new Error('Rental not found');

    const current = items[index];
    const start = input.start_date ?? current.start_date;
    const days = input.rental_days ?? current.rental_days;
    const end_date =
      input.end_date ??
      (input.start_date || input.rental_days ? computeEndDate(start, days) : current.end_date);

    items[index] = { ...current, ...input, end_date, updated_at: stamp };
    await localDb.rentals.save(items);

    return items[index];
  },

  async remove(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('rentals').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    const items = await localDb.rentals.list();
    await localDb.rentals.save(items.filter((r) => r.id !== id));
  },
};
