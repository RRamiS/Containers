export type FieldType = 'text' | 'number' | 'date' | 'select' | 'file' | 'map' | 'relation';

export type FormFieldConfig = {
  key: string;
  labelKey: string;
  type: FieldType;
  required?: boolean;
  editable?: boolean;
  showOnCreate?: boolean;
  showOnEdit?: boolean;
  showOnClose?: boolean;
};

export type StatusOption = {
  value: string;
  label: string;
  color: string;
};

export type IndustryConfig = {
  id: string;
  appName: string;
  primaryColor: string;
  accentColor: string;
  labels: {
    asset: { singular: string; plural: string };
    operator: { singular: string; plural: string };
    rental: { singular: string; plural: string };
    client: string;
    receipt: string;
    deliveryOperator: string;
    pickupOperator: string;
    location: string;
    rentalDays: string;
    startDate: string;
  };
  assetStatuses: StatusOption[];
  rentalStatuses: StatusOption[];
  features: {
    map: boolean;
    receipt: boolean;
    deliveryOperator: boolean;
    pickupOperator: boolean;
    export: boolean;
    customFields: boolean;
  };
  rentalFields: FormFieldConfig[];
};
