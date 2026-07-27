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

export async function exportRentalsCsv(rentals: RentalWithRelations[], filename = 'alquileres.csv') {
  const csv = rentalsToCsv(rentals);

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: filename,
    message: csv,
  });
}
