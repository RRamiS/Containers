import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { label } from '@/config/industry';
import { operatorsRepo } from '@/data/repositories';
import type { Operator } from '@/data/types';
import { Button } from '@/core/ui/Button';
import { ListCard } from '@/core/ui/ListCard';
import { Screen } from '@/core/ui/Screen';
import { colors, spacing } from '@/core/theme';

export function OperatorsListScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await operatorsRepo.list());
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
      title={label('operator', 'plural')}
      subtitle="Registro de operadores"
      loading={loading}
      right={<Button title="Nuevo" onPress={() => router.push('/operators/new')} />}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No hay {label('operator', 'plural').toLowerCase()} aún.</Text>}
        renderItem={({ item }) => (
          <ListCard
            title={item.full_name}
            subtitle={[item.phone, item.license].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            badge={{
              label: item.active ? 'Activo' : 'Inactivo',
              color: item.active ? '#2E7D32' : '#616161',
            }}
            onPress={() => router.push(`/operators/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
