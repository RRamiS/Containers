export type Asset = {
  id: string;
  code: string;
  notes: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FixedContainer = {
  id: string;
  client_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  notes: string;
  start_date: string;
  created_at: string;
  updated_at: string;
};

export type ContainerStockConfig = {
  total_units: number;
};

export type StockSummary = {
  total: number;
  in_depot: number;
  in_client: number;
  in_transit: number;
  fixed: number;
};

export type Operator = {
  id: string;
  full_name: string;
  phone: string;
  license: string;
  username?: string;
  password?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Rental = {
  id: string;
  asset_id: string | null;
  rental_type?: 'temporal' | 'fijo';
  start_date: string;
  rental_days: number;
  end_date: string;
  client_name: string;
  lat: number | null;
  lng: number | null;
  address: string;
  status: string;
  payment_status?: 'pendiente' | 'realizado';
  amount?: number | null;
  unit_amount?: number | null;
  delivery_operator_id: string | null;
  pickup_operator_id: string | null;
  receipt_uri: string | null;
  receipt_name: string | null;
  created_at: string;
  updated_at: string;
};

export type RentalWithRelations = Rental & {
  asset?: Asset | null;
  delivery_operator?: Operator | null;
  pickup_operator?: Operator | null;
};

export type CustomFieldDef = {
  id: string;
  entity: 'asset' | 'operator' | 'rental';
  key: string;
  label: string;
  field_type: string;
};

export type CreateAssetInput = Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAssetInput = Partial<CreateAssetInput>;

export type CreateFixedContainerInput = Omit<FixedContainer, 'id' | 'created_at' | 'updated_at'>;
export type UpdateFixedContainerInput = Partial<CreateFixedContainerInput>;

export type CreateOperatorInput = Omit<Operator, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOperatorInput = Partial<CreateOperatorInput>;

export type CreateRentalInput = Omit<Rental, 'id' | 'created_at' | 'updated_at' | 'end_date'> & {
  end_date?: string;
};
export type UpdateRentalInput = Partial<CreateRentalInput>;
