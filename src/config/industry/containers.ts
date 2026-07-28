import type { IndustryConfig } from './types';

export const containersIndustry: IndustryConfig = {
  id: 'containers',
  appName: 'Containers',
  primaryColor: '#0F1216',
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
    { value: 'en_deposito', label: 'En Depósito', color: '#F59E0B' }, // Amarillo
    { value: 'en_cliente', label: 'En Cliente / Colocado', color: '#16A34A' }, // Verde
    { value: 'en_transito', label: 'En Tránsito / Camión', color: '#0EA5E9' }, // Celeste
    { value: 'fijo', label: 'Fijo', color: '#2563EB' }, // Azul
  ],
  rentalStatuses: [
    { value: 'activo', label: 'Activo (En cliente)', color: '#16A34A' }, // Verde
    { value: 'entregado', label: 'Entregado / Activo', color: '#16A34A' }, // Verde
    { value: 'en_proceso', label: 'En tránsito', color: '#0EA5E9' }, // Celeste
    { value: 'en_transito', label: 'En tránsito', color: '#0EA5E9' }, // Celeste
    { value: 'finalizado', label: 'Finalizado (En depósito)', color: '#F59E0B' }, // Amarillo
  ],
  paymentStatuses: [
    { value: 'realizado', label: 'Pago Realizado', color: '#2E7D32' },
    { value: 'pendiente', label: 'Pago Pendiente', color: '#E65100' },
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
