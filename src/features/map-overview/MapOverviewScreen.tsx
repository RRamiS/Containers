import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { industry, label } from '@/config/industry';
import { rentalsRepo } from '@/data/repositories';
import type { RentalWithRelations } from '@/data/types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/core/map/leafletHtml';
import { LocationMap } from '@/core/map/LocationMap';
import type { MapMarker } from '@/core/map/types';
import { alertMessage } from '@/core/ui/confirm';
import { Screen } from '@/core/ui/Screen';
import { SelectField } from '@/core/ui/SelectField';
import { colors, spacing, typography } from '@/core/theme';

export function MapOverviewScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RentalWithRelations[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rentalsRepo.list(status === 'all' ? undefined : status);
      setItems(
        data.filter((r) => r.lat != null && r.lng != null && r.status !== 'finalizado'),
      );
    } catch (error) {
      alertMessage('Error', error instanceof Error ? error.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const markers: MapMarker[] = useMemo(
    () =>
      items.map((item) => {
        const st = industry.rentalStatuses.find((s) => s.value === item.status);
        return {
          id: item.id,
          lat: item.lat as number,
          lng: item.lng as number,
          label: `${item.client_name} · ${item.asset?.code ?? ''} · ${st?.label ?? item.status}`,
          color: st?.color ?? colors.primary,
        };
      }),
    [items],
  );

  return (
    <Screen
      title="Mapa"
      subtitle={`San Luis · ${label('rental', 'plural').toLowerCase()}`}
      loading={loading}
    >
      <SelectField
        label="Filtrar por estado"
        value={status}
        onChange={setStatus}
        options={[
          { label: 'Todos (activos)', value: 'all' },
          ...industry.rentalStatuses
            .filter((s) => s.value !== 'finalizado')
            .map((s) => ({ label: s.label, value: s.value })),
        ]}
      />

      <View style={styles.legend}>
        {industry.rentalStatuses
          .filter((s) => s.value !== 'finalizado')
          .map((s) => (
          <View key={s.value} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>

      <LocationMap
        height={360}
        markers={markers}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        lockCenter
      />
      <Text style={styles.count}>{markers.length} ubicaciones en el mapa</Text>
      <View style={styles.list}>
        {items.slice(0, 8).map((item) => {
          const st = industry.rentalStatuses.find((s) => s.value === item.status);
          return (
            <Pressable
              key={item.id}
              style={[styles.row, selectedId === item.id && styles.rowSelected]}
              onPress={() => {
                setSelectedId(item.id);
                router.push(`/rentals/${item.id}`);
              }}
            >
              <View style={[styles.dot, { backgroundColor: st?.color ?? colors.primary }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.client_name}</Text>
                <Text style={styles.rowMeta}>
                  {item.asset?.code ?? '—'} · {st?.label ?? item.status}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { ...typography.caption, color: colors.text },
  count: { ...typography.caption, marginVertical: spacing.sm },
  list: { gap: spacing.xs, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 999 },
  rowText: { flex: 1 },
  rowTitle: { fontWeight: '600', color: colors.text },
  rowMeta: { ...typography.caption },
});
