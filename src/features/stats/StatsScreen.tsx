import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { industry } from '@/config/industry';
import { rentalsRepo } from '@/data/repositories';
import type { RentalWithRelations } from '@/data/types';
import { exportTransactionsCsv, formatOpId } from '@/features/exports/exportCsv';
import { RentalDetailsModal } from '@/features/rentals/RentalDetailsModal';
import { LocationViewerModal } from '@/core/map/LocationViewerModal';
import { handleOpenReceipt } from '@/features/rentals/openReceipt';
import { AnalyticsCharts } from './AnalyticsCharts';
import { formatDateOnly, formatRegistrationTimestamp } from '@/core/utils/formatDate';
import { radius, spacing } from '@/core/theme';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';
import { Screen } from '@/core/ui/Screen';
import { DropdownReveal, DropdownRevealItem } from '@/core/ui/Reveal';
import { PressableMotion } from '@/core/ui/PressableMotion';

// Paleta de colores para avatares circulares
const AVATAR_COLORS = [
  '#7C3AED',
  '#EC4899',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#06B6D4',
  '#8B5CF6',
];

function getClientAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    void navigator.clipboard.writeText(text);
  }
  Alert.alert('ID Copiado', `ID ${text} copiado al portapapeles`);
}

// ==========================================
// 1. Buscador Redondeado Pill (Sin Título Superior)
// ==========================================
function DarkSearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  return (
    <View
      style={[
        styles.darkSearchWrap,
        { backgroundColor: isDark ? '#1C2128' : '#FFFFFF', borderColor: theme.surfaceBorder },
      ]}
    >
      <Feather name="search" size={14} color={theme.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.darkSearchInput, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search...'}
        placeholderTextColor={theme.textMuted}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} style={styles.clearSearchBtn}>
          <Feather name="x" size={14} color={theme.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ==========================================
// 2. Select Dropdown Pill (Sin Título Superior)
// ==========================================
function DarkSelectDropdown({
  iconName,
  defaultLabel,
  value,
  onChange,
  options,
}: {
  iconName?: keyof typeof Feather.glyphMap;
  defaultLabel: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  const selectedOption = options.find((o) => o.value === value);

  const displayTitle = value === 'all' || !selectedOption ? defaultLabel : selectedOption.label;

  return (
    <View style={[styles.dropdownContainer, open && { zIndex: 10000 }]}>
      <PressableMotion
        pressScale={0.97}
        hoverScale={1.02}
        hoverShadow
        onPress={() => setOpen(!open)}
        contentStyle={[
          styles.dropdownPillTrigger,
          {
            backgroundColor: open ? (isDark ? '#2B333E' : '#E8EEF6') : isDark ? '#1C2128' : '#FFFFFF',
            borderColor: open ? (isDark ? '#3B4553' : '#CBD5E1') : theme.surfaceBorder,
          },
        ]}
      >
        {iconName ? <Feather name={iconName} size={14} color={theme.textMuted} style={{ marginRight: 6 }} /> : null}
        <Text style={[styles.dropdownTriggerText, { color: theme.text }]} numberOfLines={1}>
          {displayTitle}
        </Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={13}
          color={theme.textMuted}
          style={{ marginLeft: 6 }}
        />
      </PressableMotion>

      {open ? <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} /> : null}

      <DropdownReveal open={open} style={styles.dropdownPopoverWrap}>
        <View
          style={[
            styles.dropdownPopover,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              ...(Platform.OS === 'web'
                ? ({
                    boxShadow: isDark
                      ? '0 18px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,122,255,0.12)'
                      : '0 16px 40px rgba(15,23,42,0.16), 0 0 0 1px rgba(0,122,255,0.08)',
                  } as object)
                : {
                    shadowColor: '#000',
                    shadowOpacity: 0.35,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 12,
                  }),
            },
          ]}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            return (
              <DropdownRevealItem key={opt.value} index={index}>
                <PressableMotion
                  pressScale={0.97}
                  hoverScale={1.015}
                  hoverShadow
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  contentStyle={[
                    styles.dropdownOption,
                    isSelected && { backgroundColor: isDark ? '#2D333B' : '#EEF4FF' },
                  ]}
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
                  {isSelected ? <Feather name="check" size={14} color="#007AFF" /> : null}
                </PressableMotion>
              </DropdownRevealItem>
            );
          })}
        </View>
      </DropdownReveal>
    </View>
  );
}

// ==========================================
// 3. Date Range Picker Pill (Sin Título Superior)
// ==========================================
function DarkDateRangePicker({
  startDate,
  endDate,
  onChangeRange,
}: {
  startDate: string | null;
  endDate: string | null;
  onChangeRange: (start: string | null, end: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const formattedDisplay = useMemo(() => {
    if (!startDate && !endDate) return 'Rango de Fechas';
    if (startDate && !endDate) return `${startDate} - ...`;
    if (!startDate && endDate) return `... - ${endDate}`;
    return `${startDate} - ${endDate}`;
  }, [startDate, endDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const emptyPrefixDays = Array.from({ length: startDayOfWeek });

  const handleDayPress = (dayStr: string) => {
    if (!startDate || (startDate && endDate)) {
      onChangeRange(dayStr, null);
    } else if (startDate && !endDate) {
      if (dayStr < startDate) {
        onChangeRange(dayStr, startDate);
      } else {
        onChangeRange(startDate, dayStr);
      }
    }
  };

  const applyPreset = (type: 'all' | 'this_month' | 'last_30') => {
    const today = new Date();
    if (type === 'all') {
      onChangeRange(null, null);
    } else if (type === 'this_month') {
      const s = format(startOfMonth(today), 'yyyy-MM-dd');
      const e = format(endOfMonth(today), 'yyyy-MM-dd');
      onChangeRange(s, e);
    } else if (type === 'last_30') {
      const s = format(subDays(today, 30), 'yyyy-MM-dd');
      const e = format(today, 'yyyy-MM-dd');
      onChangeRange(s, e);
    }
    setOpen(false);
  };

  return (
    <View style={[styles.datePickerContainer, open && { zIndex: 10000 }]}>
      <Pressable
        style={({ pressed }) => [
          styles.datePickerPillTrigger,
          {
            backgroundColor: pressed || open ? (isDark ? '#2B333E' : '#E2E8F0') : (isDark ? '#1C2128' : '#FFFFFF'),
            borderColor: theme.surfaceBorder,
          },
        ]}
        onPress={() => setOpen(!open)}
      >
        <Feather name="calendar" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
        <Text style={[styles.datePickerText, { color: theme.text }]}>{formattedDisplay}</Text>
      </Pressable>

      {open ? (
        <>
          {/* Backdrop para cerrar al hacer clic afuera */}
          <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} />
          <View style={[styles.calendarPopover, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
            {/* Presets Rápidos */}
            <View style={styles.presetsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.presetChip,
                  { backgroundColor: pressed ? (isDark ? '#3A4452' : '#CBD5E1') : (isDark ? '#262C36' : '#E2E8F0') },
                ]}
                onPress={() => applyPreset('all')}
              >
                <Text style={[styles.presetChipText, { color: theme.textMuted }]}>Todas</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.presetChip,
                  { backgroundColor: pressed ? (isDark ? '#3A4452' : '#CBD5E1') : (isDark ? '#262C36' : '#E2E8F0') },
                ]}
                onPress={() => applyPreset('this_month')}
              >
                <Text style={[styles.presetChipText, { color: theme.textMuted }]}>Este Mes</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.presetChip,
                  { backgroundColor: pressed ? (isDark ? '#3A4452' : '#CBD5E1') : (isDark ? '#262C36' : '#E2E8F0') },
                ]}
                onPress={() => applyPreset('last_30')}
              >
                <Text style={[styles.presetChipText, { color: theme.textMuted }]}>Últimos 30 días</Text>
              </Pressable>
            </View>

            {/* Navegación de Mes */}
            <View style={styles.monthHeader}>
              <Text style={[styles.monthTitle, { color: theme.text }]}>
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </Text>
              <View style={styles.monthNavBtns}>
                <Pressable
                  onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  style={styles.navBtn}
                >
                  <Feather name="chevron-left" size={16} color={theme.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  style={styles.navBtn}
                >
                  <Feather name="chevron-right" size={16} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Encabezado Días de la Semana */}
            <View style={styles.weekDaysRow}>
              {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((d) => (
                <Text key={d} style={styles.weekDayText}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grilla de Días */}
            <View style={styles.daysGrid}>
              {emptyPrefixDays.map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCellEmpty} />
              ))}

              {daysInMonth.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isStart = startDate === dayStr;
                const isEnd = endDate === dayStr;
                const inRange =
                  startDate &&
                  endDate &&
                  dayStr > startDate &&
                  dayStr < endDate;

                return (
                  <Pressable
                    key={dayStr}
                    style={[
                      styles.dayCell,
                      inRange && styles.dayCellInRange,
                      (isStart || isEnd) && styles.dayCellSelected,
                    ]}
                    onPress={() => handleDayPress(dayStr)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: (isStart || isEnd) ? '#FFFFFF' : theme.text },
                        inRange && styles.dayTextInRange,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.closeCalendarBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeCalendarText}>Aplicar Filtro</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

// ==========================================
// Componente Principal StatsScreen
// ==========================================
export function StatsScreen() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [rentals, setRentals] = useState<RentalWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Modales de Detalle y Ubicación de Mapa
  const [selectedDetailsRental, setSelectedDetailsRental] = useState<RentalWithRelations | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedLocationRental, setSelectedLocationRental] = useState<RentalWithRelations | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Orden ascendente de alquileres para IDs secuenciales (#0000, #0001, ...)
  const rentalsAscending = useMemo(() => {
    return [...rentals].sort(
      (a, b) => (a.created_at || '').localeCompare(b.created_at || '') || a.id.localeCompare(b.id)
    );
  }, [rentals]);

  // Estados de Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState<string | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rentalsRepo.list();
      setRentals(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudieron cargar las transacciones',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = (item: RentalWithRelations) => {
    const formattedId = formatOpId(item.id);
    Alert.alert(
      'Eliminar Operación',
      `¿Estás seguro de que deseas eliminar la operación ${formattedId} (${item.client_name})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await rentalsRepo.remove(item.id);
              await load();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'No se pudo eliminar la operación',
              );
            }
          },
        },
      ],
    );
  };

  // Filtrado compuesto
  const filteredRentals = useMemo(() => {
    return rentals.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const formattedId = formatOpId(item.id).toLowerCase();
        const matchesId = formattedId.includes(q);
        const matchesClient = item.client_name.toLowerCase().includes(q);
        const matchesAddress = item.address.toLowerCase().includes(q);
        if (!matchesId && !matchesClient && !matchesAddress) return false;
      }
      if (paymentFilter !== 'all') {
        const itemPayment = item.payment_status ?? 'pendiente';
        if (itemPayment !== paymentFilter) return false;
      }
      if (statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }
      if (startDateFilter && item.start_date < startDateFilter) return false;
      if (endDateFilter && item.start_date > endDateFilter) return false;

      return true;
    });
  }, [rentals, searchQuery, paymentFilter, statusFilter, startDateFilter, endDateFilter]);

  // Resumen métrico
  const metrics = useMemo(() => {
    let paidTotal = 0;
    let pendingTotal = 0;
    let activeCount = 0;
    let finishedCount = 0;

    rentals.forEach((r) => {
      const amt = r.amount ?? 0;
      if (r.payment_status === 'realizado') {
        paidTotal += amt;
      } else {
        pendingTotal += amt;
      }

      if (r.status === 'finalizado') {
        finishedCount++;
      } else {
        activeCount++;
      }
    });

    return {
      paidTotal,
      pendingTotal,
      activeCount,
      finishedCount,
      totalCount: rentals.length,
    };
  }, [rentals]);

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      toast.success('ID copiado', `Se copió ${text} al portapapeles.`);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTransactionsCsv(filteredRentals, 'reporte-transacciones.csv');
      toast.success('Exportación completada', `Se descargó el archivo CSV con ${filteredRentals.length} transacciones.`);
    } catch (error) {
      toast.error('Error al exportar', error instanceof Error ? error.message : 'No se pudo exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen loading={loading}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Dashboard de Analítica e Indicadores Financieros con Gráficos (Dark Mode) */}
        <AnalyticsCharts
          rentals={rentals}
          onRefresh={load}
          onDownloadReport={handleExport}
        />

        {/* Barra de Filtros Flotante (Fondo Transparente sobre theme.background) */}
        <View style={styles.filterFloatingToolbar}>
          {/* Grupo Izquierdo de Botones Píldora */}
          <View style={styles.filterPillsGroup}>
            <DarkSelectDropdown
              iconName="sliders"
              defaultLabel="Estado de Pago"
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { label: 'Todos los pagos', value: 'all' },
                { label: 'Pago Realizado', value: 'realizado' },
                { label: 'Pago Pendiente', value: 'pendiente' },
              ]}
            />

            <DarkSelectDropdown
              iconName="layers"
              defaultLabel="Estado Operativo"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Todos los estados', value: 'all' },
                ...industry.rentalStatuses.map((s) => ({ label: s.label, value: s.value })),
              ]}
            />

            <DarkDateRangePicker
              startDate={startDateFilter}
              endDate={endDateFilter}
              onChangeRange={(s, e) => {
                setStartDateFilter(s);
                setEndDateFilter(e);
              }}
            />

            <Pressable
              style={({ pressed }) => [
                styles.actionPillBtn,
                {
                  backgroundColor: pressed ? (isDark ? '#2B333E' : '#E2E8F0') : (isDark ? '#1C2128' : '#FFFFFF'),
                  borderColor: theme.surfaceBorder,
                },
              ]}
              onPress={() => void handleExport()}
            >
              <Feather name="download" size={13} color="#22C55E" style={{ marginRight: 5 }} />
              <Text style={[styles.actionPillText, { color: theme.text }]}>Exportar CSV</Text>
            </Pressable>
          </View>

          {/* Buscador Píldora a la Derecha (Top Right) */}
          <View style={styles.searchPillWrap}>
            <DarkSearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
            />
          </View>
        </View>

        {/* Tabla Centrada y Responsive con Ancho de la Aplicación */}
        <View style={styles.tableOuterCenteredContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.tableScrollContainer}
          >
            <View style={[styles.tableWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              {/* Header Redondeado (12 Columnas) */}
              <View style={[styles.tableHeaderRow, { backgroundColor: theme.tableHeaderBg }]}>
                <Text style={[styles.headerCell, styles.colOpId, { color: theme.textMuted }]}>ID Operación</Text>
                <Text style={[styles.headerCell, styles.colClient, { color: theme.textMuted }]}>Cliente</Text>
                <Text style={[styles.headerCell, styles.colLocation, { color: theme.textMuted }]}>Ubicación</Text>
                <Text style={[styles.headerCell, styles.colRegDate, { color: theme.textMuted }]}>Fecha Registro</Text>
                <Text style={[styles.headerCell, styles.colDeliveryDate, { color: theme.textMuted }]}>Fecha Entrega</Text>
                <Text style={[styles.headerCell, styles.colDays, { color: theme.textMuted }]}>Días Estac.</Text>
                <Text style={[styles.headerCell, styles.colUnitAmount, { color: theme.textMuted }]}>Monto Unit. ($)</Text>
                <Text style={[styles.headerCell, styles.colAmount, { color: theme.textMuted }]}>Monto Total ($)</Text>
                <Text style={[styles.headerCell, styles.colPayment, { color: theme.textMuted }]}>Estado Cobro</Text>
                <Text style={[styles.headerCell, styles.colReceipt, { color: theme.textMuted }]}>Comprobante</Text>
                <Text style={[styles.headerCell, styles.colStatus, { color: theme.textMuted }]}>Estado Operativo</Text>
                <Text style={[styles.headerCell, styles.colActions, { color: theme.textMuted }]}>Acciones</Text>
              </View>

              {/* Lista de Filas */}
              {filteredRentals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No se encontraron transacciones con los filtros aplicados.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredRentals}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const isPaid = item.payment_status === 'realizado';
                    const st = industry.rentalStatuses.find((s) => s.value === item.status);
                    const seqIndex = rentalsAscending.findIndex((r) => r.id === item.id);
                    const formattedId = formatOpId(item.id, seqIndex >= 0 ? seqIndex : undefined);
                    const avatarColor = getClientAvatarColor(item.client_name);
                    const initialLetter = item.client_name ? item.client_name.charAt(0).toUpperCase() : 'C';

                    const unitAmt =
                      item.unit_amount != null
                        ? item.unit_amount
                        : item.amount != null && item.rental_days > 0
                          ? Math.round(item.amount / item.rental_days)
                          : null;

                    return (
                      <Pressable
                        style={({ pressed, hovered }: any) => [
                          styles.tableBodyRow,
                          {
                            backgroundColor: (hovered || pressed) ? theme.tableRowHover : theme.tableRowBg,
                            borderBottomColor: theme.border,
                          },
                        ]}
                      >
                        {/* 1. ID Operación (#0000) + Copiar */}
                        <View style={styles.colOpId}>
                          <Text style={[styles.opIdText, { color: theme.text }]}>{formattedId}</Text>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              copyToClipboard(formattedId);
                            }}
                            style={styles.copyBtn}
                            hitSlop={8}
                          >
                            <Feather name="copy" size={13} color={theme.textMuted} />
                          </Pressable>
                        </View>

                        {/* 2. Cliente con Avatarcito Circular */}
                        <View style={styles.colClient}>
                          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                            <Text style={styles.avatarInitialText}>{initialLetter}</Text>
                          </View>
                          <Text style={[styles.clientNameText, { color: theme.text }]} numberOfLines={1}>
                            {item.client_name}
                          </Text>
                        </View>

                        {/* 3. Ubicación (ícono send azul) */}
                        <View style={styles.colLocation}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.locationPressableBtn,
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedLocationRental(item);
                              setLocationModalVisible(true);
                            }}
                          >
                            <Text style={[styles.cellText, { color: theme.text, flexShrink: 1 }]} numberOfLines={1}>
                              {item.address || 'Sin dirección'}
                            </Text>
                            <Feather name="send" size={13} color="#0084FF" style={{ marginLeft: 6 }} />
                          </Pressable>
                        </View>

                        {/* 4. Fecha Registro (Con hora completa: Dec 8, 2025 · 12:32 PM) */}
                        <View style={styles.colRegDate}>
                          <Text style={[styles.regDateText, { color: theme.text }]} numberOfLines={1}>
                            {formatRegistrationTimestamp(item.created_at)}
                          </Text>
                        </View>

                        {/* 5. Fecha Entrega (Sin hora) */}
                        <View style={styles.colDeliveryDate}>
                          <Text style={[styles.cellText, { color: theme.text }]} numberOfLines={1}>
                            {formatDateOnly(item.start_date)}
                          </Text>
                        </View>

                        {/* 5. Días Estacionamiento */}
                        <View style={styles.colDays}>
                          <Text style={[styles.cellTextBold, { color: theme.text }]}>{item.rental_days} días</Text>
                        </View>

                        {/* 6. Monto Unitario ($) */}
                        <View style={styles.colUnitAmount}>
                          <Text style={[styles.cellText, { color: theme.text }]}>
                            {unitAmt != null ? `$${unitAmt.toLocaleString('es-AR')}` : '—'}
                          </Text>
                        </View>

                        {/* 7. Monto Total ($) */}
                        <View style={styles.colAmount}>
                          <Text style={styles.amountText}>
                            {item.amount != null ? `$${item.amount.toLocaleString('es-AR')}` : '—'}
                          </Text>
                        </View>

                        {/* 8. Estado del Cobro */}
                        <View style={styles.colPayment}>
                          <View
                            style={[
                              styles.badgeContainer,
                              { backgroundColor: isPaid ? '#2E7D3222' : '#E6510022' },
                            ]}
                          >
                            <View
                              style={[
                                styles.badgeDot,
                                { backgroundColor: isPaid ? '#2E7D32' : '#E65100' },
                              ]}
                            />
                            <Text
                              style={[
                                styles.badgeText,
                                { color: isPaid ? '#2E7D32' : '#E65100' },
                              ]}
                            >
                              {isPaid ? 'Realizado' : 'Pendiente'}
                            </Text>
                          </View>
                        </View>

                        {/* 9. Comprobante (Abre o descarga de forma independiente) */}
                        <View style={styles.colReceipt}>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              void handleOpenReceipt(item.receipt_uri, item.receipt_name);
                            }}
                            hitSlop={4}
                            style={styles.receiptPressable}
                          >
                            {item.receipt_name ? (
                              <View style={styles.receiptBadgeRow}>
                                <Feather name="download" size={13} color="#22C55E" style={{ marginRight: 5 }} />
                                <Text style={[styles.receiptBadge, styles.receiptBadgeActive]} numberOfLines={1}>
                                  {item.receipt_name}
                                </Text>
                              </View>
                            ) : (
                              <Text style={[styles.receiptBadge, { color: theme.textMuted }]} numberOfLines={1}>
                                Sin archivo
                              </Text>
                            )}
                          </Pressable>
                        </View>

                        {/* 10. Estado Operativo */}
                        <View style={styles.colStatus}>
                          <View
                            style={[
                              styles.badgeContainer,
                              { backgroundColor: (st?.color ?? '#1565C0') + '22' },
                            ]}
                          >
                            <View
                              style={[
                                styles.badgeDot,
                                { backgroundColor: st?.color ?? '#1565C0' },
                              ]}
                            />
                            <Text style={[styles.badgeText, { color: st?.color ?? theme.text }]}>
                              {st?.label ?? item.status}
                            </Text>
                          </View>
                        </View>

                        {/* 11. Columna de Acciones con Íconos Circulares */}
                        <View style={styles.colActions}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionIconCircle,
                              { backgroundColor: isDark ? '#242C37' : '#F1F5F9' },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedDetailsRental(item);
                              setDetailsModalVisible(true);
                            }}
                            hitSlop={4}
                          >
                            <Feather name="eye" size={14} color={theme.text} />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.actionIconCircle,
                              { backgroundColor: isDark ? '#242C37' : '#F1F5F9' },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(`/rentals/${item.id}`);
                            }}
                            hitSlop={4}
                          >
                            <Feather name="edit-2" size={13} color={theme.text} />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.actionIconCircle,
                              styles.actionDeleteCircle,
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            hitSlop={4}
                          >
                            <Feather name="trash-2" size={13} color="#F85149" />
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

      {/* Modal exclusivo de Vista de Detalles de Transacción al clickear en el Ojo (👁️) */}
      <RentalDetailsModal
        visible={detailsModalVisible}
        rental={selectedDetailsRental}
        formattedId={
          selectedDetailsRental
            ? formatOpId(
                selectedDetailsRental.id,
                rentalsAscending.findIndex((r) => r.id === selectedDetailsRental.id)
              )
            : '#0000'
        }
        onClose={() => setDetailsModalVisible(false)}
        onEdit={(rentalToEdit) => router.push(`/rentals/${rentalToEdit.id}`)}
      />

      {/* Modal exclusivo de Ubicación de Mapa No Editable */}
      <LocationViewerModal
        visible={locationModalVisible}
        clientName={selectedLocationRental?.client_name || ''}
        address={selectedLocationRental?.address || ''}
        lat={selectedLocationRental?.lat ?? null}
        lng={selectedLocationRental?.lng ?? null}
        onClose={() => setLocationModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xl,
  },
  metricsCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  /* Barra de Filtros Flotante Directa (Mismo color de fondo de la app) */
  filterFloatingToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 10,
    zIndex: 10000,
    elevation: 10000,
  },
  filterPillsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  searchPillWrap: {
    minWidth: 180,
  },

  /* Buscador Píldora Redondeado */
  darkSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 6,
  },
  darkSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  clearSearchBtn: {
    padding: 3,
  },
  locationPressableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Dropdown Trigger Píldora */
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  dropdownPillTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
  },
  dropdownTriggerActive: {
    borderColor: '#007AFF',
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  /* Popover Backdrop para cerrar al hacer clic afuera */
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
  dropdownPopoverWrap: {
    position: 'absolute',
    top: 42,
    left: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  dropdownPopover: {
    minWidth: 180,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 13,
    flex: 1,
  },

  /* Date Range Picker Trigger Píldora */
  datePickerContainer: {
    position: 'relative',
    zIndex: 100,
  },
  datePickerPillTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
  },
  datePickerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarPopover: {
    position: 'absolute',
    top: 42,
    left: 0,
    width: 290,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    zIndex: 99999,
    elevation: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 11,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  monthNavBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    padding: 4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    color: '#8EA0B5',
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  dayCellEmpty: {
    width: 34,
    height: 32,
  },
  dayCell: {
    width: 34,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  dayCellSelected: {
    backgroundColor: '#007AFF',
  },
  dayCellInRange: {
    backgroundColor: '#007AFF33',
  },
  dayText: {
    fontSize: 12,
  },
  dayTextInRange: {
    color: '#70B5FF',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  closeCalendarBtn: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeCalendarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /* Botón Píldora de Acción */
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Tabla Centrada y Responsive con Ancho de Aplicación */
  tableOuterCenteredContainer: {
    width: '100%',
  },
  tableScrollContainer: {
    minWidth: '100%',
    paddingBottom: spacing.md,
  },
  tableWrapper: {
    width: '100%',
    minWidth: 980,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },

  /* Columnas Flex Responsivas Compactas */
  colOpId: {
    minWidth: 95,
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 6,
  },
  opIdText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  copyBtn: {
    padding: 2,
  },

  colClient: {
    minWidth: 110,
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  clientNameText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  colLocation: {
    minWidth: 130,
    flex: 1.3,
    paddingRight: 6,
  },
  colRegDate: {
    minWidth: 140,
    flex: 1.4,
    paddingRight: 6,
  },
  colDeliveryDate: {
    minWidth: 95,
    flex: 0.9,
    paddingRight: 6,
  },
  regDateText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  colDays: {
    minWidth: 70,
    flex: 0.7,
    paddingRight: 6,
  },
  colUnitAmount: {
    minWidth: 90,
    flex: 0.9,
    paddingRight: 6,
  },
  colAmount: {
    minWidth: 90,
    flex: 0.9,
    paddingRight: 6,
  },
  colPayment: {
    minWidth: 105,
    flex: 1,
    paddingRight: 6,
  },
  colReceipt: {
    minWidth: 105,
    flex: 1,
    paddingRight: 6,
  },
  colStatus: {
    minWidth: 110,
    flex: 1.1,
    paddingRight: 6,
  },
  colActions: {
    minWidth: 95,
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  /* Botones Circulares de Acciones */
  actionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDeleteCircle: {
    backgroundColor: '#F8514922',
  },

  cellText: {
    fontSize: 13,
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3FB950',
  },
  receiptBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  receiptPressable: {
    alignSelf: 'flex-start',
  },
  receiptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
  },
  receiptBadgeActive: {
    color: '#22C55E',
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexShrink: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
