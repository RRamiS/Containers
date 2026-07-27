import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { industry, label } from '@/config/industry';
import { rentalsRepo } from '@/data/repositories';
import type { RentalWithRelations } from '@/data/types';
import { exportRentalsCsv } from '@/features/exports/exportCsv';
import { Button } from '@/core/ui/Button';
import { ListCard } from '@/core/ui/ListCard';
import { Screen } from '@/core/ui/Screen';
import { SelectField } from '@/core/ui/SelectField';
import { colors, spacing } from '@/core/theme';

export function RentalsListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RentalWithRelations[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rentalsRepo.list(status === 'all' ? undefined : status);
      setItems(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onExport = async () => {
    setExporting(true);
    try {
      await exportRentalsCsv(items, `alquileres-${status}.csv`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen
      title={label('rental', 'plural')}
      subtitle="Listado con filtros y exportación"
      loading={loading}
      right={
        <View style={styles.headerActions}>
          {industry.features.export ? (
            <Button title="Exportar" variant="secondary" loading={exporting} onPress={() => void onExport()} />
          ) : null}
          <Button title="Nuevo" onPress={() => router.push('/rentals/new')} />
        </View>
      }
    >
      <SelectField
        label="Estado"
        value={status}
        onChange={setStatus}
        options={[
          { label: 'Todos', value: 'all' },
          ...industry.rentalStatuses.map((s) => ({ label: s.label, value: s.value })),
        ]}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No hay {label('rental', 'plural').toLowerCase()}.</Text>}
        renderItem={({ item }) => {
          const st = industry.rentalStatuses.find((s) => s.value === item.status);
          return (
            <ListCard
              title={item.client_name}
              subtitle={`${label('asset')}: ${item.asset?.code ?? '—'} · ${item.start_date} → ${item.end_date}`}
              meta={`${item.rental_days} días · ${item.address || 'Sin dirección'}`}
              badge={st ? { label: st.label, color: st.color } : undefined}
              onPress={() => router.push(`/rentals/${item.id}`)}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'flex-end' },
  list: { paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
