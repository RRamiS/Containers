export type Asset = {
  id: string;
  code: string;
  notes: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Operator = {
  id: string;
  full_name: string;
  phone: string;
  license: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Rental = {
  id: string;
  asset_id: string;
  start_date: string;
  rental_days: number;
  end_date: string;
  client_name: string;
  lat: number | null;
  lng: number | null;
  address: string;
  status: string;
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

export type CreateOperatorInput = Omit<Operator, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOperatorInput = Partial<CreateOperatorInput>;

export type CreateRentalInput = Omit<Rental, 'id' | 'created_at' | 'updated_at' | 'end_date'> & {
  end_date?: string;
};
export type UpdateRentalInput = Partial<CreateRentalInput>;
