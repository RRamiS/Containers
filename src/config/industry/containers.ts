import type { IndustryConfig } from './types';

export const containersIndustry: IndustryConfig = {
  id: 'containers',
  appName: 'Containers',
  primaryColor: '#0F3D2E',
  accentColor: '#C4A35A',
  labels: {
    asset: { singular: 'Contenedor', plural: 'Contenedores' },
    operator: { singular: 'Chofer', plural: 'Choferes' },
    rental: { singular: 'Alquiler', plural: 'Alquileres' },
    client: 'A nombre de',
    receipt: 'Recibo / Comprobante',
    deliveryOperator: 'Chofer de entrega',
    pickupOperator: 'Chofer de retiro',
    location: 'Ubicación',
    rentalDays: 'Cantidad de días',
    startDate: 'Fecha',
  },
  assetStatuses: [
    { value: 'disponible', label: 'Disponible', color: '#2E7D32' },
    { value: 'alquilado', label: 'Alquilado', color: '#1565C0' },
    { value: 'mantenimiento', label: 'Mantenimiento', color: '#E65100' },
  ],
  rentalStatuses: [
    { value: 'activo', label: 'Activo', color: '#2E7D32' },
    { value: 'en_proceso', label: 'En proceso', color: '#F9A825' },
    { value: 'finalizado', label: 'Finalizado', color: '#616161' },
  ],
  features: {
    map: true,
    receipt: true,
    deliveryOperator: true,
    pickupOperator: true,
    export: true,
    customFields: true,
  },
  rentalFields: [
    { key: 'start_date', labelKey: 'startDate', type: 'date', required: true, showOnCreate: true, showOnEdit: true },
    { key: 'receipt_uri', labelKey: 'receipt', type: 'file', required: false, showOnCreate: true, showOnEdit: true },
    { key: 'rental_days', labelKey: 'rentalDays', type: 'number', required: true, showOnCreate: true, showOnEdit: true },
    { key: 'client_name', labelKey: 'client', type: 'text', required: true, showOnCreate: true, showOnEdit: true },
    { key: 'lat', labelKey: 'location', type: 'map', required: true, showOnCreate: true, showOnEdit: true },
    { key: 'delivery_operator_id', labelKey: 'deliveryOperator', type: 'relation', required: true, showOnCreate: true, showOnEdit: true },
    { key: 'pickup_operator_id', labelKey: 'pickupOperator', type: 'relation', required: true, showOnCreate: false, showOnEdit: true, showOnClose: true },
  ],
};
