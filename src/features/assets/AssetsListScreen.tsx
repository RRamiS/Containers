import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { industry, label } from '@/config/industry';
import { assetsRepo } from '@/data/repositories';
import type { Asset } from '@/data/types';
import { Button } from '@/core/ui/Button';
import { ListCard } from '@/core/ui/ListCard';
import { Screen } from '@/core/ui/Screen';
import { colors, spacing } from '@/core/theme';

export function AssetsListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await assetsRepo.list());
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen
      title={label('asset', 'plural')}
      subtitle="Inventario de activos"
      loading={loading}
      right={<Button title="Nuevo" onPress={() => router.push('/assets/new')} />}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No hay {label('asset', 'plural').toLowerCase()} aún.</Text>}
        renderItem={({ item }) => {
          const status = industry.assetStatuses.find((s) => s.value === item.status);
          return (
            <ListCard
              title={item.code}
              subtitle={item.notes || 'Sin notas'}
              badge={status ? { label: status.label, color: status.color } : undefined}
              onPress={() => router.push(`/assets/${item.id}`)}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
