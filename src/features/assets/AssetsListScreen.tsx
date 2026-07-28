import { useCallback, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fixedContainersRepo, stockRepo } from '@/data/repositories';
import type { FixedContainer, StockSummary } from '@/data/types';
import { Button } from '@/core/ui/Button';
import { ListCard } from '@/core/ui/ListCard';
import { Screen } from '@/core/ui/Screen';
import { TextField } from '@/core/ui/TextField';
import { colors, radius, spacing } from '@/core/theme';

import { EditFleetModal } from '@/features/assets/EditFleetModal';

export function AssetsListScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<StockSummary>({
    total: 0,
    in_depot: 0,
    in_client: 0,
    in_transit: 0,
    fixed: 0,
  });
  const [fixedList, setFixedList] = useState<FixedContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, fixed] = await Promise.all([
        stockRepo.getSummary(),
        fixedContainersRepo.list(),
      ]);
      setSummary(sum);
      setFixedList(fixed);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo cargar el stock');
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
      loading={loading}
      right={<Button title="+ Contenedor Fijo" onPress={() => router.push('/assets/new')} />}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Dashboard Resumen de Stock */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Flota Total de Contenedores ({summary.total} u.)</Text>
            <Button title="Editar Stock" variant="secondary" onPress={() => setEditModalVisible(true)} />
          </View>

          <View style={styles.grid}>
            <View style={[styles.statBox, { borderColor: '#2E7D32' }]}>
              <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{summary.in_depot}</Text>
              <Text style={styles.statLabel}>En Depósito</Text>
            </View>

            <View style={[styles.statBox, { borderColor: '#1565C0' }]}>
              <Text style={[styles.statNumber, { color: '#1565C0' }]}>{summary.in_client}</Text>
              <Text style={styles.statLabel}>En Cliente</Text>
            </View>

            <View style={[styles.statBox, { borderColor: '#F9A825' }]}>
              <Text style={[styles.statNumber, { color: '#F9A825' }]}>{summary.in_transit}</Text>
              <Text style={styles.statLabel}>En Tránsito</Text>
            </View>

            <View style={[styles.statBox, { borderColor: '#7B1FA2' }]}>
              <Text style={[styles.statNumber, { color: '#7B1FA2' }]}>{summary.fixed}</Text>
              <Text style={styles.statLabel}>Fijos</Text>
            </View>
          </View>

          <Text style={styles.totalText}>Stock total configurado: {summary.total} unidades</Text>
        </View>

        {/* Sección Contenedores Fijos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contenedores Fijos ({fixedList.length})</Text>
          <Text style={styles.sectionSubtitle}>Ubicaciones fijas permanentes por meses</Text>
        </View>

        {fixedList.length === 0 ? (
          <Text style={styles.emptyText}>No hay contenedores fijos registrados actualmente.</Text>
        ) : (
          fixedList.map((item) => (
            <ListCard
              key={item.id}
              title={item.client_name}
              subtitle={`${item.address || 'Sin dirección'} ${item.notes ? `• ${item.notes}` : ''}`}
              badge={{ label: 'Fijo', color: '#7B1FA2' }}
              onPress={() => router.push(`/assets/${item.id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal para Editar la Flota Total de Stock */}
      <EditFleetModal
        visible={editModalVisible}
        currentTotal={summary.total}
        onClose={() => setEditModalVisible(false)}
        onSaved={load}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xl },
  dashboardCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  editRow: {
    marginBottom: spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
});
