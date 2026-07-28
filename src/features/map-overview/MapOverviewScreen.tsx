import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { industry } from '@/config/industry';
import { assetsRepo, fixedContainersRepo, rentalsRepo, stockRepo } from '@/data/repositories';
import type { Asset, FixedContainer, RentalWithRelations, StockSummary } from '@/data/types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/core/map/leafletHtml';
import { LocationMap } from '@/core/map/LocationMap';
import type { MapLocation, MapMarker } from '@/core/map/types';
import { Button } from '@/core/ui/Button';
import { Screen } from '@/core/ui/Screen';
import { spacing } from '@/core/theme';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';
import { EditFleetModal } from '@/features/assets/EditFleetModal';

// Ubicación Fija del Depósito Principal (Av. Sarmiento, San Luis)
export const DEPOT_LOCATION = {
  id: 'depot-sarmiento',
  lat: -33.2982,
  lng: -66.3312,
  address: 'Av. Sarmiento, San Luis',
  label: '🏢 [DEPÓSITO SAN LUIS] Av. Sarmiento',
  color: '#F59E0B', // Amarillo Depósito
};

// ==========================================
// Componente 1: Modal para Agregar Nuevo Contenedor Fijo sobre la vista de Mapa
// ==========================================
function AddFixedModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast.error('Atención', 'Completá el nombre del cliente o empresa');
      return;
    }

    setSaving(true);
    try {
      await fixedContainersRepo.create({
        client_name: clientName.trim(),
        address: address.trim(),
        notes: notes.trim(),
        start_date: startDate || new Date().toISOString().split('T')[0],
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      });
      toast.success('Contenedor Fijo Registrado', `Se creó la ubicación para ${clientName.trim()}.`);
      onSaved();
      onClose();
      setClientName('');
      setAddress('');
      setNotes('');
      setLocation(null);
    } catch (error) {
      toast.error('Error al guardar', error instanceof Error ? error.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Header Modal */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nuevo Contenedor Fijo</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                Registrar ubicación fija permanente sobre el mapa
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: pressed ? (isDark ? '#262D37' : '#E2E8F0') : (isDark ? '#1C2128' : '#F1F5F9') },
              ]}
              onPress={onClose}
            >
              <Feather name="x" size={18} color={theme.text} />
            </Pressable>
          </View>

          {/* Cuerpo del Formulario */}
          <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Cliente / Empresa / Obra</Text>
              <View style={[styles.textInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder }]}>
                <Feather name="user" size={15} color={theme.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="Ej. Constructora San Luis / VEA..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Dirección / Referencia</Text>
              <View style={[styles.textInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder }]}>
                <Feather name="map-pin" size={15} color={theme.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Ej. Av. Illia 450, San Luis"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Notas Adicionales</Text>
              <View style={[styles.textInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder, height: 50 }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Detalles de acceso a la ubicación..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Selector de Posición en el Mapa */}
            <View style={styles.mapSection}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Fijar Posición Exacta</Text>
              <Text style={[styles.hintText, { color: theme.textMuted }]}>Tocá sobre el mapa para fijar el contenedor.</Text>
              <View style={[styles.mapBox, { borderColor: theme.surfaceBorder }]}>
                <LocationMap
                  height={190}
                  center={location ? { lat: location.lat, lng: location.lng } : DEFAULT_CENTER}
                  zoom={location ? 15 : DEFAULT_ZOOM}
                  editable
                  selected={location ?? undefined}
                  onSelect={(loc) => {
                    setLocation(loc);
                    if (loc.address && !address) setAddress(loc.address);
                  }}
                />
              </View>
            </View>

            {/* Acciones */}
            <View style={styles.modalFooterActions}>
              <Button title="Guardar Contenedor Fijo" loading={saving} onPress={() => void handleSave()} />
              <Button title="Cancelar" variant="ghost" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ==========================================
// Selector Dropdown Pill para el Mapa
// ==========================================
function MapSelectDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={[styles.dropdownContainer, open && { zIndex: 10000 }]}>
      <Pressable
        style={({ pressed }) => [
          styles.dropdownPillTrigger,
          {
            backgroundColor: pressed || open ? (isDark ? '#2B333E' : '#E2E8F0') : (isDark ? '#1C2128' : '#FFFFFF'),
            borderColor: theme.surfaceBorder,
          },
        ]}
        onPress={() => setOpen(!open)}
      >
        <Feather name="filter" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
        <Text style={[styles.dropdownTriggerText, { color: theme.text }]}>
          {selectedOption?.label ?? 'Filtrar mapa'}
        </Text>
        <Feather name="chevron-down" size={13} color={theme.textMuted} style={{ marginLeft: 8 }} />
      </Pressable>

      {open ? (
        <>
          <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} />
          <View style={[styles.dropdownPopover, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    (isSelected || pressed) && { backgroundColor: isDark ? '#2D333B' : '#E2E8F0' },
                  ]}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: isSelected ? theme.text : theme.textMuted },
                      isSelected && { fontWeight: 'bold' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

export function MapOverviewScreen() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [rentals, setRentals] = useState<RentalWithRelations[]>([]);
  const [fixedContainers, setFixedContainers] = useState<FixedContainer[]>([]);
  const [availableAssetsCount, setAvailableAssetsCount] = useState<number>(0);
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editFleetModalVisible, setEditFleetModalVisible] = useState(false);
  const [addFixedModalVisible, setAddFixedModalVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rentalsData, fixedData, assetsData, summaryData] = await Promise.all([
        rentalsRepo.list(),
        fixedContainersRepo.list(),
        assetsRepo.list(),
        stockRepo.getSummary(),
      ]);

      setRentals(rentalsData.filter((r) => r.status !== 'finalizado'));
      setFixedContainers(fixedData);
      setStockSummary(summaryData);

      // Usar summaryData.in_depot para que coincida exactamente con la cantidad de stock en depósito (23)
      setAvailableAssetsCount(summaryData.in_depot);
    } catch (error) {
      toast.error('Error al cargar el mapa', error instanceof Error ? error.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  // Clasificación de Alquileres en "En Tránsito" (Celeste) y "Entregados / Activos" (Verde)
  const inTransitRentals = useMemo(() => {
    return rentals.filter(
      (r) =>
        r.status === 'en_transito' ||
        r.status === 'en_proceso' ||
        r.status === 'pendiente_entrega' ||
        r.status === 'pendiente_retiro',
    );
  }, [rentals]);

  const deliveredRentals = useMemo(() => {
    return rentals.filter((r) => r.status === 'entregado' || r.status === 'activo');
  }, [rentals]);

  // Marcadores de Geolocalización para el Mapa con Paleta Unificada
  const markers: MapMarker[] = useMemo(() => {
    const showDepot = status === 'all' || status === 'deposito';
    const showFixed = status === 'all' || status === 'fijo';
    const showRentals = status === 'all' || status === 'activo' || status === 'entregado';

    // 1. Pin de Depósito Principal (Amarillo #F59E0B)
    const depotMarker: MapMarker | null = showDepot
      ? {
          id: DEPOT_LOCATION.id,
          lat: DEPOT_LOCATION.lat,
          lng: DEPOT_LOCATION.lng,
          label: `🏢 [DEPÓSITO SAN LUIS] Av. Sarmiento · ${availableAssetsCount} contenedores en depósito`,
          color: '#F59E0B',
          badgeText: String(availableAssetsCount),
        }
      : null;

    // 2. Alquileres Temporales con Coordenadas (Activos = Verde #16A34A | En tránsito = Celeste #0EA5E9)
    const rentalMarkers: MapMarker[] = showRentals
      ? rentals
          .filter((r) => r.lat != null && r.lng != null)
          .map((item) => {
            const isTransit =
              item.status === 'en_transito' ||
              item.status === 'en_proceso' ||
              item.status === 'pendiente_entrega' ||
              item.status === 'pendiente_retiro';
            const st = industry.rentalStatuses.find((s) => s.value === item.status);
            return {
              id: `rental-${item.id}`,
              lat: item.lat as number,
              lng: item.lng as number,
              label: `${item.client_name} · ${st?.label ?? item.status}`,
              color: isTransit ? '#0EA5E9' : '#16A34A', // Celeste para tránsito, Verde para activos/entregados
            };
          })
      : [];

    // 3. Contenedores Fijos (Azul #2563EB)
    const fixedMarkers: MapMarker[] = showFixed
      ? fixedContainers
          .filter((f) => f.lat != null && f.lng != null)
          .map((f) => ({
            id: `fixed-${f.id}`,
            lat: f.lat as number,
            lng: f.lng as number,
            label: `[FIJO] ${f.client_name} · ${f.address || 'Sin dirección'}`,
            color: '#2563EB', // Azul para fijos
          }))
      : [];

    return [
      ...(depotMarker ? [depotMarker] : []),
      ...rentalMarkers,
      ...fixedMarkers,
    ];
  }, [rentals, fixedContainers, availableAssetsCount, status]);

  return (
    <Screen loading={loading}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Barra Superior con Selector de Filtro Estilo Píldora y Botón Pantalla Completa */}
        <View style={styles.topToolbar}>
          <MapSelectDropdown
            value={status}
            onChange={setStatus}
            options={[
              { label: 'Todos los Puntos (Depósito + Fijos + Entregados)', value: 'all' },
              { label: 'Solo Contenedores Fijos', value: 'fijo' },
              { label: 'Solo Entregados / Activos en Sitio', value: 'entregado' },
            ]}
          />

          {/* Botón de Pantalla Completa / Minimizar Mapa */}
          <Pressable
            style={({ pressed }) => [
              styles.fullScreenPillBtn,
              {
                backgroundColor: isFullScreen ? '#007AFF' : (pressed ? (isDark ? '#2B333E' : '#E2E8F0') : (isDark ? '#1C2128' : '#FFFFFF')),
                borderColor: isFullScreen ? '#007AFF' : theme.surfaceBorder,
              },
            ]}
            onPress={() => setIsFullScreen(!isFullScreen)}
          >
            <Feather name={isFullScreen ? 'minimize-2' : 'maximize-2'} size={13} color={isFullScreen ? '#FFFFFF' : theme.text} style={{ marginRight: 6 }} />
            <Text style={[styles.fullScreenPillText, { color: isFullScreen ? '#FFFFFF' : theme.text }]}>
              {isFullScreen ? 'Minimizar Mapa' : 'Pantalla Completa'}
            </Text>
          </Pressable>

          {/* Leyenda de Pins del Mapa con Paleta Unificada */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dotBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.dotBadgeNum}>{availableAssetsCount}</Text>
              </View>
              <Text style={[styles.legendText, { color: theme.text }]}>Depósito ({availableAssetsCount} disp.)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
              <Text style={[styles.legendText, { color: theme.text }]}>Contenedores Fijos (Azul)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
              <Text style={[styles.legendText, { color: theme.text }]}>Entregados / Activos (Verde)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#0EA5E9' }]} />
              <Text style={[styles.legendText, { color: theme.text }]}>En Tránsito (Celeste)</Text>
            </View>
          </View>
        </View>

        {/* Mapa Operativo Fijo en Pantalla normal (520px) */}
        <View style={[styles.mapCardWrapper, { borderColor: theme.surfaceBorder }]}>
          <LocationMap
            height={520}
            markers={markers}
            center={{ lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng }}
            zoom={13}
            lockCenter
          />
        </View>

        {/* Divider Sutil Separador */}
        <View style={[styles.dividerSection, { borderTopColor: theme.border }]} />

        {/* Encabezado del Desglose con Números de Flota Total de Stock */}
        <View style={styles.columnsHeaderRow}>
          <View style={styles.titleWithMetricsRow}>
            <Text style={[styles.columnsHeaderTitle, { color: theme.text }]}>
              Desglose de Contenedores y Alquileres por Categoría
            </Text>

            {/* Badges de Métricas de Stock (Flota Total con Colores Unificados) */}
            {stockSummary ? (
              <View style={styles.stockSummaryPillsRow}>
                {/* Flota Total */}
                <View style={[styles.stockPill, { backgroundColor: isDark ? '#1C222B' : '#F1F5F9', borderColor: theme.surfaceBorder }]}>
                  <Text style={[styles.stockPillLabel, { color: theme.textMuted }]}>Flota Total: </Text>
                  <Text style={[styles.stockPillVal, { color: theme.text, marginRight: 6 }]}>{stockSummary.total}</Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.editFleetBtn,
                      { backgroundColor: isDark ? '#262D37' : '#E2E8F0' },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setEditFleetModalVisible(true)}
                    hitSlop={6}
                    accessibilityLabel="Editar Flota Total"
                  >
                    <Feather name="edit-2" size={11} color={theme.text} />
                  </Pressable>
                </View>

                {/* En Depósito (Amarillo #F59E0B) */}
                <View style={[styles.stockPill, { backgroundColor: isDark ? '#3B2A10' : '#FEF3C7', borderColor: '#F59E0B' }]}>
                  <Text style={[styles.stockPillLabel, { color: isDark ? '#FBBF24' : '#D97706' }]}>En Depósito: </Text>
                  <Text style={[styles.stockPillVal, { color: isDark ? '#FBBF24' : '#D97706' }]}>{stockSummary.in_depot}</Text>
                </View>

                {/* En Cliente / Activos (Verde #16A34A) */}
                <View style={[styles.stockPill, { backgroundColor: isDark ? '#143823' : '#DCFCE7', borderColor: '#16A34A' }]}>
                  <Text style={[styles.stockPillLabel, { color: isDark ? '#4ADE80' : '#15803D' }]}>En Cliente: </Text>
                  <Text style={[styles.stockPillVal, { color: isDark ? '#4ADE80' : '#15803D' }]}>{stockSummary.in_client}</Text>
                </View>

                {/* En Tránsito (Celeste #0EA5E9) */}
                <View style={[styles.stockPill, { backgroundColor: isDark ? '#0C344B' : '#E0F2FE', borderColor: '#0EA5E9' }]}>
                  <Text style={[styles.stockPillLabel, { color: isDark ? '#38BDF8' : '#0284C7' }]}>En Tránsito: </Text>
                  <Text style={[styles.stockPillVal, { color: isDark ? '#38BDF8' : '#0284C7' }]}>{stockSummary.in_transit}</Text>
                </View>

                {/* Fijos (Azul #2563EB) */}
                <View style={[styles.stockPill, { backgroundColor: isDark ? '#1E293B' : '#DBEAFE', borderColor: '#2563EB' }]}>
                  <Text style={[styles.stockPillLabel, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>Fijos: </Text>
                  <Text style={[styles.stockPillVal, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>{stockSummary.fixed}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <Text style={[styles.columnsHeaderSubtitle, { color: theme.textMuted }]}>
            Hacé clic en el ícono del ojo (👁️) para acceder a los detalles completos de cada ítem.
          </Text>
        </View>

        {/* Sección de 3 Columnas debajo del Mapa */}
        <View style={styles.threeColumnsGrid}>
          {/* Columna 1: Contenedores Fijos (Azul #2563EB) */}
          <View style={[styles.columnCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={styles.columnBadgeWithAddRow}>
              <View style={[styles.columnHeaderBadge, { backgroundColor: '#2563EB22', borderColor: '#2563EB' }]}>
                <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
                <Text style={[styles.columnHeaderText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
                  Contenedores Fijos ({fixedContainers.length})
                </Text>
              </View>

              {/* Botón + que abre el modal Nuevo Contenedor Fijo sobre el mapa */}
              <Pressable
                style={({ pressed }) => [
                  styles.addFixedBtnBadge,
                  { backgroundColor: '#2563EB22', borderColor: '#2563EB' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setAddFixedModalVisible(true)}
                hitSlop={6}
                accessibilityLabel="Agregar Contenedor Fijo"
              >
                <Feather name="plus" size={14} color={isDark ? '#60A5FA' : '#1D4ED8'} />
              </Pressable>
            </View>

            <View style={styles.columnList}>
              {fixedContainers.length === 0 ? (
                <Text style={[styles.emptyColText, { color: theme.textMuted }]}>No hay contenedores fijos registrados.</Text>
              ) : (
                fixedContainers.map((item) => (
                  <View
                    key={`fixed-col-${item.id}`}
                    style={[styles.itemCardRow, { backgroundColor: isDark ? '#1C2128' : '#F8FAFC', borderColor: theme.border }]}
                  >
                    <View style={styles.itemMainInfo}>
                      <Text style={[styles.itemTitleText, { color: theme.text }]} numberOfLines={1}>
                        {item.client_name}
                      </Text>
                      <Text style={[styles.itemSubText, { color: theme.textMuted }]} numberOfLines={1}>
                        📍 {item.address || 'Sin dirección registrada'}
                      </Text>
                    </View>

                    {/* Botón del Ojo (👁️) */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.eyeCircleBtn,
                        { backgroundColor: isDark ? '#2B333E' : '#E2E8F0' },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => router.push(`/assets/${item.id}`)}
                      hitSlop={6}
                    >
                      <Feather name="eye" size={14} color={theme.text} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Columna 2: En Tránsito (Celeste #0EA5E9) */}
          <View style={[styles.columnCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={[styles.columnHeaderBadge, { backgroundColor: '#0EA5E922', borderColor: '#0EA5E9' }]}>
              <View style={[styles.dot, { backgroundColor: '#0EA5E9' }]} />
              <Text style={[styles.columnHeaderText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                En Tránsito ({inTransitRentals.length})
              </Text>
            </View>

            <View style={styles.columnList}>
              {inTransitRentals.length === 0 ? (
                <Text style={[styles.emptyColText, { color: theme.textMuted }]}>No hay entregas o retiros en tránsito.</Text>
              ) : (
                inTransitRentals.map((item) => {
                  const operatorName = item.delivery_operator?.full_name || item.pickup_operator?.full_name || 'Sin chofer';
                  return (
                    <View
                      key={`transit-col-${item.id}`}
                      style={[styles.itemCardRow, { backgroundColor: isDark ? '#1C2128' : '#F8FAFC', borderColor: theme.border }]}
                    >
                      <View style={styles.itemMainInfo}>
                        <Text style={[styles.itemTitleText, { color: theme.text }]} numberOfLines={1}>
                          {item.client_name}
                        </Text>
                        <Text style={[styles.itemSubText, { color: theme.textMuted }]} numberOfLines={1}>
                          🚚 {operatorName} · {item.address || 'Sin dirección'}
                        </Text>
                      </View>

                      {/* Botón del Ojo (👁️) */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.eyeCircleBtn,
                          { backgroundColor: isDark ? '#2B333E' : '#E2E8F0' },
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => router.push(`/rentals/${item.id}`)}
                        hitSlop={6}
                      >
                        <Feather name="eye" size={14} color={theme.text} />
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* Columna 3: Entregados / Activos (Verde #16A34A) */}
          <View style={[styles.columnCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            <View style={[styles.columnHeaderBadge, { backgroundColor: '#16A34A22', borderColor: '#16A34A' }]}>
              <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
              <Text style={[styles.columnHeaderText, { color: isDark ? '#4ADE80' : '#15803D' }]}>
                Entregados / Activos ({deliveredRentals.length})
              </Text>
            </View>

            <View style={styles.columnList}>
              {deliveredRentals.length === 0 ? (
                <Text style={[styles.emptyColText, { color: theme.textMuted }]}>No hay contenedores activos en sitio.</Text>
              ) : (
                deliveredRentals.map((item) => (
                  <View
                    key={`delivered-col-${item.id}`}
                    style={[styles.itemCardRow, { backgroundColor: isDark ? '#1C2128' : '#F8FAFC', borderColor: theme.border }]}
                  >
                    <View style={styles.itemMainInfo}>
                      <Text style={[styles.itemTitleText, { color: theme.text }]} numberOfLines={1}>
                        {item.client_name}
                      </Text>
                      <Text style={[styles.itemSubText, { color: theme.textMuted }]} numberOfLines={1}>
                        ⏱️ {item.rental_days} días · {item.address || 'Sin dirección'}
                      </Text>
                    </View>

                    {/* Botón del Ojo (👁️) */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.eyeCircleBtn,
                        { backgroundColor: isDark ? '#2B333E' : '#E2E8F0' },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => router.push(`/rentals/${item.id}`)}
                      hitSlop={6}
                    >
                      <Feather name="eye" size={14} color={theme.text} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal para Editar la Flota Total de Contenedores */}
      <EditFleetModal
        visible={editFleetModalVisible}
        currentTotal={stockSummary?.total || 50}
        onClose={() => setEditFleetModalVisible(false)}
        onSaved={loadData}
      />

      {/* Modal para Registrar un Nuevo Contenedor Fijo sobre la vista de Mapa */}
      <AddFixedModal
        visible={addFixedModalVisible}
        onClose={() => setAddFixedModalVisible(false)}
        onSaved={loadData}
      />

      {/* Capa Modal Overlay de Mapa en PANTALLA COMPLETA (por delante de todo) */}
      {isFullScreen ? (
        <View style={[styles.fullScreenOverlay, { backgroundColor: isDark ? '#0D1117' : '#F8FAFC' }]}>
          {/* Header Superior del Mapa en Pantalla Completa */}
          <View style={[styles.fullScreenHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={styles.fullScreenHeaderLeft}>
              <Text style={[styles.fullScreenTitle, { color: theme.text }]}>🗺️ Mapa Operativo en Pantalla Completa</Text>
              <MapSelectDropdown
                value={status}
                onChange={setStatus}
                options={[
                  { label: 'Todos los Puntos (Depósito + Fijos + Entregados)', value: 'all' },
                  { label: 'Solo Contenedores Fijos', value: 'fijo' },
                  { label: 'Solo Entregados / Activos en Sitio', value: 'entregado' },
                ]}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.exitFullScreenBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setIsFullScreen(false)}
            >
              <Feather name="minimize-2" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.exitFullScreenText}>Volver al Tamaño Original</Text>
            </Pressable>
          </View>

          {/* Cuerpo del Mapa ocupando el 100% del espacio */}
          <View style={styles.fullScreenMapBody}>
            <LocationMap
              height="100%"
              markers={markers}
              center={{ lat: DEPOT_LOCATION.lat, lng: DEPOT_LOCATION.lng }}
              zoom={13}
              lockCenter
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    zIndex: 100,
  },

  /* Dropdown Select Pill */
  dropdownContainer: {
    position: 'relative',
  },
  dropdownPillTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fullScreenPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
  },
  fullScreenPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  popoverBackdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    zIndex: 9998,
  },
  dropdownPopover: {
    position: 'absolute',
    top: 42,
    left: 0,
    minWidth: 260,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 10001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownOptionText: {
    fontSize: 13,
  },

  /* Leyenda de Pins */
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotBadgeNum: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },

  /* Mapa Agrandado en Y */
  mapCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },

  /* Divider Sutil */
  dividerSection: {
    borderTopWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },

  /* Encabezado de Columnas y Métricas de Stock */
  columnsHeaderRow: {
    gap: 6,
    marginBottom: 8,
  },
  titleWithMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  columnsHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockSummaryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  stockPillLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockPillVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  editFleetBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  columnsHeaderSubtitle: {
    fontSize: 12,
  },

  /* Grilla de 3 Columnas */
  threeColumnsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  columnCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  columnBadgeWithAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  columnHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  addFixedBtnBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnList: {
    gap: 8,
  },
  emptyColText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  itemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  itemMainInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 11,
  },
  eyeCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Modal AddFixedModal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContent: {
    padding: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  hintText: {
    fontSize: 12,
    marginBottom: 4,
  },
  mapSection: {
    gap: 4,
  },
  mapBox: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  modalFooterActions: {
    marginTop: 8,
    gap: 10,
  },

  /* Pantalla Completa Overlay */
  fullScreenOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as any,
    height: '100vh' as any,
    zIndex: 999999,
    flexDirection: 'column',
  },
  fullScreenHeader: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    zIndex: 100,
  },
  fullScreenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fullScreenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exitFullScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  exitFullScreenText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  fullScreenMapBody: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

