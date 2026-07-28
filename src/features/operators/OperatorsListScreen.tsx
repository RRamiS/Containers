import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { label } from '@/config/industry';
import { operatorsRepo } from '@/data/repositories';
import type { Operator } from '@/data/types';
import { Screen } from '@/core/ui/Screen';
import { spacing } from '@/core/theme';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';
import { confirmAction } from '@/core/ui/confirm';

const AVATAR_COLORS = [
  '#0084FF',
  '#7C3AED',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#3B82F6',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash)];
}

export function OperatorsListScreen() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [items, setItems] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await operatorsRepo.list());
    } catch (error) {
      toast.error('Error', error instanceof Error ? error.message : 'No se pudo cargar la lista');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleDelete = async (op: Operator) => {
    const ok = await confirmAction({
      title: 'Eliminar Chofer',
      message: `¿Estás seguro de eliminar a ${op.full_name}?`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    try {
      await operatorsRepo.remove(op.id);
      toast.success('Chofer eliminado', `Se eliminó el chofer ${op.full_name}`);
      void loadData();
    } catch (err) {
      toast.error('Error', 'No se pudo eliminar el chofer');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Filtro por estado
      if (statusFilter === 'active' && !item.active) return false;
      if (statusFilter === 'inactive' && item.active) return false;

      // 2. Filtro por búsqueda
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (item.full_name || '').toLowerCase();
      const user = (item.username || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const lic = (item.license || '').toLowerCase();

      return name.includes(q) || user.includes(q) || phone.includes(q) || lic.includes(q);
    });
  }, [items, searchQuery, statusFilter]);

  return (
    <Screen loading={loading}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Barra Superior Flotante de Acciones y Filtros */}
        <View style={styles.topControlBar}>
          <View style={styles.filterGroupLeft}>
            {/* Filtro de Estado en Píldora */}
            <View
              style={[
                styles.segmentedPill,
                { backgroundColor: isDark ? '#1C2128' : '#EFF2F5', borderColor: theme.surfaceBorder },
              ]}
            >
              <Pressable
                style={[styles.pillOption, statusFilter === 'all' && styles.pillOptionActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.pillText, statusFilter === 'all' && styles.pillTextActive]}>
                  Todos ({items.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.pillOption, statusFilter === 'active' && styles.pillOptionActive]}
                onPress={() => setStatusFilter('active')}
              >
                <Text style={[styles.pillText, statusFilter === 'active' && styles.pillTextActive]}>
                  Activos
                </Text>
              </Pressable>

              <Pressable
                style={[styles.pillOption, statusFilter === 'inactive' && styles.pillOptionActive]}
                onPress={() => setStatusFilter('inactive')}
              >
                <Text style={[styles.pillText, statusFilter === 'inactive' && styles.pillTextActive]}>
                  Inactivos
                </Text>
              </Pressable>
            </View>

            {/* Botón Píldora Principal: Nuevo Chofer */}
            <Pressable
              style={({ pressed }) => [styles.primaryPillBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/operators/new')}
            >
              <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryPillText}>Nuevo Chofer</Text>
            </Pressable>
          </View>

          {/* Buscador Píldora a la Derecha */}
          <View style={styles.searchPillWrap}>
            <View
              style={[
                styles.searchInputContainer,
                { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: theme.surfaceBorder },
              ]}
            >
              <Feather name="search" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInputText, { color: theme.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar chofer..."
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Tabla Centrada Estilizada estilo Operaciones Diarias */}
        <View style={styles.tableOuterCenteredContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.tableScrollContainer}>
            <View style={[styles.tableWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              {/* Encabezado de la Tabla */}
              <View style={[styles.tableHeaderRow, { backgroundColor: theme.tableHeaderBg }]}>
                <Text style={[styles.headerCell, styles.colName, { color: theme.textMuted }]}>Nombre Completo</Text>
                <Text style={[styles.headerCell, styles.colUser, { color: theme.textMuted }]}>Usuario (Login)</Text>
                <Text style={[styles.headerCell, styles.colPhone, { color: theme.textMuted }]}>Teléfono</Text>
                <Text style={[styles.headerCell, styles.colLicense, { color: theme.textMuted }]}>Licencia</Text>
                <Text style={[styles.headerCell, styles.colStatus, { color: theme.textMuted }]}>Estado</Text>
                <Text style={[styles.headerCell, styles.colActions, { color: theme.textMuted }]}>Acciones</Text>
              </View>

              {/* Cuerpo de la Tabla */}
              {filteredItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No se encontraron {label('operator', 'plural').toLowerCase()} con los filtros aplicados.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const avatarColor = getAvatarColor(item.full_name);
                    const initialLetter = item.full_name ? item.full_name.charAt(0).toUpperCase() : 'C';

                    return (
                      <Pressable
                        style={({ pressed }) => [
                          styles.tableBodyRow,
                          {
                            backgroundColor: pressed ? (isDark ? '#1F2732' : '#F1F5F9') : theme.tableRowBg,
                            borderBottomColor: theme.border,
                          },
                        ]}
                        onPress={() => router.push(`/operators/${item.id}`)}
                      >
                        {/* 1. Nombre Completo con Avatar */}
                        <View style={styles.colName}>
                          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                            <Text style={styles.avatarInitialText}>{initialLetter}</Text>
                          </View>
                          <Text style={[styles.nameText, { color: theme.text }]} numberOfLines={1}>
                            {item.full_name}
                          </Text>
                        </View>

                        {/* 2. Usuario (Login) */}
                        <View style={styles.colUser}>
                          <Text style={[styles.userBadgeText, { color: item.username ? '#38BDF8' : theme.textMuted }]}>
                            {item.username ? `@${item.username}` : 'Sin asignación'}
                          </Text>
                        </View>

                        {/* 3. Teléfono */}
                        <View style={styles.colPhone}>
                          <Text style={[styles.cellText, { color: theme.text }]} numberOfLines={1}>
                            {item.phone || '-'}
                          </Text>
                        </View>

                        {/* 4. Licencia */}
                        <View style={styles.colLicense}>
                          <Text style={[styles.cellText, { color: theme.textMuted }]} numberOfLines={1}>
                            {item.license || '-'}
                          </Text>
                        </View>

                        {/* 5. Estado Badge */}
                        <View style={styles.colStatus}>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: item.active ? 'rgba(22, 163, 74, 0.15)' : 'rgba(100, 116, 139, 0.15)' },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: item.active ? '#16A34A' : '#64748B' },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: item.active ? '#16A34A' : '#64748B' },
                              ]}
                            >
                              {item.active ? 'Activo' : 'Inactivo'}
                            </Text>
                          </View>
                        </View>

                        {/* 6. Acciones */}
                        <View style={styles.colActions}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconBtn,
                              { backgroundColor: pressed ? (isDark ? '#2B333E' : '#E2E8F0') : 'transparent' },
                            ]}
                            onPress={() => router.push(`/operators/${item.id}`)}
                            hitSlop={6}
                          >
                            <Feather name="edit-2" size={15} color={theme.text} />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.iconBtn,
                              styles.dangerIconBtn,
                              { backgroundColor: pressed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)' },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              void handleDelete(item);
                            }}
                            hitSlop={6}
                          >
                            <Feather name="trash-2" size={15} color="#EF4444" />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filterGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  segmentedPill: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
  },
  pillOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillOptionActive: {
    backgroundColor: '#0084FF',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B949E',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0084FF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  primaryPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchPillWrap: {
    minWidth: 200,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  tableOuterCenteredContainer: {
    alignItems: 'center',
    width: '100%',
  },
  tableScrollContainer: {
    flexDirection: 'column',
  },
  tableWrapper: {
    minWidth: 840,
    maxWidth: 1040,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colName: { width: 220, flexDirection: 'row', alignItems: 'center' },
  colUser: { width: 150 },
  colPhone: { width: 140 },
  colLicense: { width: 130 },
  colStatus: { width: 120 },
  colActions: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  userBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cellText: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerIconBtn: {
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
