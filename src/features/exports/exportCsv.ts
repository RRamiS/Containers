import { Platform, Share } from 'react-native';
import type { RentalWithRelations } from '@/data/types';
import { industry } from '@/config/industry';

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rentalsToCsv(rentals: RentalWithRelations[]): string {
  const headers = [
    'ID',
    industry.labels.asset.singular,
    industry.labels.client,
    industry.labels.startDate,
    industry.labels.rentalDays,
    'Fecha fin',
    'Estado',
    industry.labels.deliveryOperator,
    industry.labels.pickupOperator,
    'Lat',
    'Lng',
    'Dirección',
  ];

  const rows = rentals.map((r) =>
    [
      r.id,
      r.asset?.code ?? r.asset_id,
      r.client_name,
      r.start_date,
      r.rental_days,
      r.end_date,
      r.status,
      r.delivery_operator?.full_name ?? '',
      r.pickup_operator?.full_name ?? '',
      r.lat ?? '',
      r.lng ?? '',
      r.address,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

function downloadCsvWeb(csvContent: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
}

export async function exportRentalsCsv(rentals: RentalWithRelations[], filename = 'alquileres.csv') {
  const csv = rentalsToCsv(rentals);

  if (Platform.OS === 'web' || typeof document !== 'undefined') {
    downloadCsvWeb(csv, filename);
    return;
  }

  await Share.share({
    title: filename,
    message: csv,
  });
}

export function formatOpId(id: string, index?: number): string {
  if (index != null && index >= 0) {
    return `#${String(index).padStart(4, '0')}`;
  }
  if (!id) return '#0000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  }
  const numericCode = Math.abs(hash);
  return `#${String(numericCode).padStart(4, '0')}`;
}

export function transactionsToCsv(rentals: RentalWithRelations[]): string {
  const headers = [
    'ID Operación',
    'Cliente',
    'Ubicación',
    'Fecha de Entrega',
    'Días de Estacionamiento',
    'Monto Unitario ($)',
    'Monto Total ($)',
    'Estado del Cobro',
    'Comprobante',
    'Estado Operativo',
  ];

  const rows = rentals.map((r) => {
    const unitAmt =
      r.unit_amount != null
        ? r.unit_amount
        : r.amount != null && r.rental_days > 0
          ? Math.round(r.amount / r.rental_days)
          : '';

    return [
      formatOpId(r.id),
      r.client_name,
      r.address || 'Sin dirección',
      r.start_date,
      r.rental_days,
      unitAmt,
      r.amount != null ? r.amount : '',
      r.payment_status === 'realizado' ? 'Pago Realizado' : 'Pago Pendiente',
      r.receipt_name ? r.receipt_name : 'Sin comprobante',
      r.status,
    ]
      .map(escapeCsv)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function exportTransactionsCsv(rentals: RentalWithRelations[], filename = 'transacciones-estadisticas.csv') {
  const csv = transactionsToCsv(rentals);

  if (Platform.OS === 'web' || typeof document !== 'undefined') {
    downloadCsvWeb(csv, filename);
    return;
  }

  await Share.share({
    title: filename,
    message: csv,
  });
}
