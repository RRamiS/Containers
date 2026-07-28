import { useCallback, useMemo, useState } from 'react';
import {
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
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { industry } from '@/config/industry';
import { operatorsRepo, rentalsRepo } from '@/data/repositories';
import type { Operator, RentalWithRelations } from '@/data/types';
import { exportRentalsCsv, formatOpId } from '@/features/exports/exportCsv';
import { RentalDetailsModal } from './RentalDetailsModal';
import { LocationViewerModal } from '@/core/map/LocationViewerModal';
import { formatDateOnly, formatRegistrationTimestamp } from '@/core/utils/formatDate';
import { Screen } from '@/core/ui/Screen';
import { spacing } from '@/core/theme';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';
import { confirmAction } from '@/core/ui/confirm';
import { PressableMotion } from '@/core/ui/PressableMotion';
import { DropdownReveal, DropdownRevealItem } from '@/core/ui/Reveal';

// Paleta de colores para avatares circulares
const AVATAR_COLORS = [
  '#7C3AED',
  '#EC4899',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#8B5CF6',
  '#14B8A6',
];

function getClientAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// ==========================================
// 1. Buscador Estilo Píldora Redondeada
// ==========================================
function DarkSearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
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
        styles.searchInputPill,
        {
          backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
          borderColor: theme.surfaceBorder,
        },
      ]}
    >
      <Feather name="search" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
      <TextInput
        style={[styles.searchInputText, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
      />
    </View>
  );
}

// ==========================================
// 2. Select Dropdown Pill
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
            backgroundColor: open
              ? isDark
                ? '#1E2A3A'
                : '#EEF4FF'
              : isDark
                ? '#1C2128'
                : '#FFFFFF',
            borderColor: open ? '#007AFF' : theme.surfaceBorder,
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
                    isSelected && { backgroundColor: isDark ? '#1E2A3A' : '#EEF4FF' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: isSelected ? theme.text : theme.textMuted },
                      isSelected && { fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#0B4EA2' },
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
// 3. Date Range Picker Pill
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
      <PressableMotion
        pressScale={0.97}
        hoverScale={1.02}
        hoverShadow
        onPress={() => setOpen(!open)}
        contentStyle={[
          styles.datePickerPillTrigger,
          {
            backgroundColor: open
              ? isDark
                ? '#1E2A3A'
                : '#EEF4FF'
              : isDark
                ? '#1C2128'
                : '#FFFFFF',
            borderColor: open ? '#007AFF' : theme.surfaceBorder,
          },
        ]}
      >
        <Feather name="calendar" size={14} color={theme.textMuted} style={{ marginRight: 6 }} />
        <Text style={[styles.datePickerText, { color: theme.text }]}>{formattedDisplay}</Text>
      </PressableMotion>

      {open ? <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} /> : null}

      <DropdownReveal open={open} style={styles.calendarPopoverWrap}>
        <View
          style={[
            styles.calendarPopover,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              ...(Platform.OS === 'web'
                ? ({
                    boxShadow: isDark
                      ? '0 14px 36px rgba(0,0,0,0.55)'
                      : '0 12px 28px rgba(15,23,42,0.14)',
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

            <View style={styles.weekDaysRow}>
              {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((d) => (
                <Text key={d} style={styles.weekDayText}>
                  {d}
                </Text>
              ))}
            </View>

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
      </DropdownReveal>
    </View>
  );
}

// ==========================================
// Calendario compacto para elegir un día fuera de los 3 chips
// ==========================================
function DayCalendarButton({
  selectedDate,
  onSelectDate,
  active,
}: {
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    selectedDate ? parseISO(selectedDate) : new Date(),
  );
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const emptyPrefixDays = Array.from({ length: startDayOfWeek });

  return (
    <View style={[styles.dayCalendarWrap, open && { zIndex: 10000 }]}>
      <PressableMotion
        pressScale={0.96}
        hoverScale={1.04}
        hoverShadow
        onPress={() => setOpen(!open)}
        contentStyle={[
          styles.dayCalendarBtn,
          {
            backgroundColor: active ? '#0084FF' : 'transparent',
            borderColor: 'transparent',
          },
        ]}
      >
        <Feather name="calendar" size={15} color={active ? '#FFFFFF' : theme.textMuted} />
        {active && selectedDate ? (
          <Text style={styles.dayCalendarBtnTextActive}>
            {format(parseISO(selectedDate), 'dd MMM', { locale: es })}
          </Text>
        ) : null}
      </PressableMotion>

      {open ? <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} /> : null}

      <DropdownReveal open={open} style={styles.dayCalendarPopoverWrap}>
        <View
          style={[
            styles.dayCalendarPopover,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              ...(Platform.OS === 'web'
                ? ({
                    boxShadow: isDark
                      ? '0 18px 48px rgba(0,0,0,0.65)'
                      : '0 16px 40px rgba(15,23,42,0.16)',
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
          <View style={styles.monthHeader}>
            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </Text>
            <View style={styles.monthNavBtns}>
              <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navBtn}>
                <Feather name="chevron-left" size={16} color={theme.textMuted} />
              </Pressable>
              <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navBtn}>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekDaysRow}>
            {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((d) => (
              <Text key={d} style={styles.weekDayText}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {emptyPrefixDays.map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCellEmpty} />
            ))}
            {daysInMonth.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelected = selectedDate === dayStr;
              return (
                <Pressable
                  key={dayStr}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => {
                    onSelectDate(dayStr);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.dayText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                    {format(day, 'd')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </DropdownReveal>
    </View>
  );
}

// ==========================================
// Pantalla Principal: RentalsListScreen (Operaciones Diarias)
// ==========================================
type OpsMode = 'entrega' | 'retiro' | 'recambio';

function getOpsDate(r: RentalWithRelations, mode: OpsMode): string {
  // Entrega → fecha de entrega (start_date)
  // Retiro / Recambio → fecha de retiro (end_date)
  if (mode === 'entrega') return r.start_date;
  return r.end_date;
}
export function RentalsListScreen() {
  const router = useRouter();
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [rentals, setRentals] = useState<RentalWithRelations[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Detalle y Mapa
  const [selectedDetailsRental, setSelectedDetailsRental] = useState<RentalWithRelations | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedLocationRental, setSelectedLocationRental] = useState<RentalWithRelations | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Orden ascendente de alquileres por fecha de creación para IDs secuenciales (#0000, #0001, ...)
  const rentalsAscending = useMemo(() => {
    return [...rentals].sort(
      (a, b) => (a.created_at || '').localeCompare(b.created_at || '') || a.id.localeCompare(b.id)
    );
  }, [rentals]);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState<string | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rentalList, operatorList] = await Promise.all([
        rentalsRepo.list(),
        operatorsRepo.list(),
      ]);
      setRentals(rentalList);
      setOperators(operatorList);
    } catch (error) {
      toast.error('Error al cargar operaciones', error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      toast.success('ID copiado', `Se copió ${text} al portapapeles.`);
    }
  };

  const handleExport = async () => {
    try {
      await exportRentalsCsv(filteredRentals, 'operaciones-diarias.csv');
      toast.success('Exportación completada', `Se descargaron ${filteredRentals.length} operaciones.`);
    } catch (error) {
      toast.error('Error al exportar', error instanceof Error ? error.message : 'No se pudo exportar');
    }
  };

  const handleDelete = async (id: string, client: string) => {
    const ok = await confirmAction({
      title: 'Eliminar Operación',
      message: `¿Estás seguro de eliminar el alquiler de ${client}?`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    try {
      await rentalsRepo.remove(id);
      toast.warning('Operación eliminada', `El registro de ${client} fue removido.`);
      void loadData();
    } catch (err) {
      toast.error('Error al eliminar', err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  // Modo de operación + pestañas por día (3 días + calendario)
  const [opsMode, setOpsMode] = useState<OpsMode>('entrega');
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');

  const quickDayKeys = useMemo(() => {
    const today = new Date();
    return [0, 1, 2].map((offset) => format(addDays(today, offset), 'yyyy-MM-dd'));
  }, [rentals.length]); // se refresca al cargar datos

  const dayTabOptions = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const counts = new Map<string, number>();
    rentals.forEach((r) => {
      const d = getOpsDate(r, opsMode);
      if (!d) return;
      counts.set(d, (counts.get(d) || 0) + 1);
    });

    const totalForMode = rentals.length;

    return [
      { value: 'all', label: `Todos (${totalForMode})` },
      ...quickDayKeys.map((d) => {
        const count = counts.get(d) || 0;
        const isToday = d === today;
        const dayLabel = isToday
          ? `Hoy (${format(parseISO(d), 'dd MMM', { locale: es })})`
          : format(parseISO(d), 'dd MMM', { locale: es });
        return { value: d, label: `${dayLabel} (${count})` };
      }),
    ];
  }, [rentals, opsMode, quickDayKeys]);

  const isCalendarDayActive =
    selectedDayTab !== 'all' && !quickDayKeys.includes(selectedDayTab);

  // Filtrado Multicriterio
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      if (selectedDayTab !== 'all') {
        if (getOpsDate(r, opsMode) !== selectedDayTab) return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && (r.payment_status || 'pendiente') !== paymentFilter) return false;
      if (operatorFilter !== 'all' && r.delivery_operator_id !== operatorFilter && r.pickup_operator_id !== operatorFilter) {
        return false;
      }
      if (startDateFilter && r.start_date < startDateFilter) return false;
      if (endDateFilter && r.start_date > endDateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const client = r.client_name.toLowerCase();
        const addr = (r.address || '').toLowerCase();
        const formattedId = formatOpId(r.id).toLowerCase();
        if (!client.includes(q) && !addr.includes(q) && !formattedId.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rentals, opsMode, selectedDayTab, statusFilter, paymentFilter, operatorFilter, startDateFilter, endDateFilter, searchQuery]);

  return (
    <Screen loading={loading}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Pestañas de operación: Entrega / Retiro / Recambio */}
        <View
          style={[
            styles.opsModePill,
            { backgroundColor: isDark ? '#161B22' : '#EFF2F5', borderColor: theme.surfaceBorder },
          ]}
        >
          {(
            [
              { value: 'entrega' as const, label: 'Entrega' },
              { value: 'retiro' as const, label: 'Retiro' },
              { value: 'recambio' as const, label: 'Recambio' },
            ] as const
          ).map((tab) => {
            const isActive = opsMode === tab.value;
            return (
              <PressableMotion
                key={tab.value}
                pressScale={0.97}
                hoverScale={1.03}
                hoverShadow={!isActive}
                onPress={() => {
                  setOpsMode(tab.value);
                  setSelectedDayTab('all');
                }}
                contentStyle={[styles.dayTabItem, isActive && styles.dayTabItemActive]}
              >
                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>{tab.label}</Text>
              </PressableMotion>
            );
          })}
        </View>

        {/* Pestañas por día (Hoy + 2 días) + calendario pegado a la derecha */}
        <View
          style={[
            styles.dayTabsSegmentedPill,
            styles.dayTabsRow,
            { backgroundColor: isDark ? '#161B22' : '#EFF2F5', borderColor: theme.surfaceBorder },
          ]}
        >
          {dayTabOptions.map((tab) => {
            const isActive = selectedDayTab === tab.value;
            return (
              <PressableMotion
                key={tab.value}
                pressScale={0.97}
                hoverScale={1.03}
                hoverShadow={!isActive}
                onPress={() => setSelectedDayTab(tab.value)}
                contentStyle={[
                  styles.dayTabItem,
                  isActive && styles.dayTabItemActive,
                  !isActive && Platform.OS === 'web'
                    ? ({ transition: 'background-color 140ms ease' } as object)
                    : null,
                ]}
              >
                <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                  {tab.label}
                </Text>
              </PressableMotion>
            );
          })}

          <DayCalendarButton
            selectedDate={isCalendarDayActive ? selectedDayTab : null}
            active={isCalendarDayActive}
            onSelectDate={(d) => setSelectedDayTab(d)}
          />
        </View>

        {/* Toolbar Superior: Filtros Flotantes y Buscador Pill */}
        <View style={styles.floatingToolbar}>
          <View style={styles.filterPillsRow}>
            {/* Filtro: Estado Operativo */}
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

            {/* Filtro: Estado de Pago */}
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

            {/* Filtro: Chofer */}
            <DarkSelectDropdown
              iconName="truck"
              defaultLabel="Chofer"
              value={operatorFilter}
              onChange={setOperatorFilter}
              options={[
                { label: 'Todos los choferes', value: 'all' },
                ...operators.map((o) => ({ label: o.full_name, value: o.id })),
              ]}
            />

            {/* Filtro: Rango de Fechas */}
            <DarkDateRangePicker
              startDate={startDateFilter}
              endDate={endDateFilter}
              onChangeRange={(s, e) => {
                setStartDateFilter(s);
                setEndDateFilter(e);
              }}
            />

            {/* Botón Píldora: Exportar CSV */}
            <PressableMotion
              pressScale={0.97}
              hoverScale={1.02}
              hoverShadow
              onPress={() => void handleExport()}
              contentStyle={[
                styles.actionPillBtn,
                {
                  backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
                  borderColor: theme.surfaceBorder,
                },
              ]}
            >
              <Feather name="download" size={13} color="#22C55E" style={{ marginRight: 5 }} />
              <Text style={[styles.actionPillText, { color: theme.text }]}>Exportar CSV</Text>
            </PressableMotion>

            {/* Botón Píldora Principal: Nuevo Alquiler */}
            <PressableMotion
              pressScale={0.97}
              hoverScale={1.02}
              hoverShadow
              onPress={() => router.push('/rentals/new')}
              contentStyle={styles.primaryPillBtn}
            >
              <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.primaryPillText}>Nuevo Alquiler</Text>
            </PressableMotion>
          </View>

          {/* Buscador Píldora a la Derecha */}
          <View style={styles.searchPillWrap}>
            <DarkSearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
            />
          </View>
        </View>

        {/* Tabla Centrada y Responsive con Ancho de Aplicación (minWidth 980) */}
        <View style={styles.tableOuterCenteredContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.tableScrollContainer}
          >
            <View style={[styles.tableWrapper, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
              {/* Encabezado de la Tabla */}
              <View style={[styles.tableHeaderRow, { backgroundColor: theme.tableHeaderBg }]}>
                <Text style={[styles.headerCell, styles.colOpId, { color: theme.textMuted }]}>ID Operación</Text>
                <Text style={[styles.headerCell, styles.colClient, { color: theme.textMuted }]}>Cliente</Text>
                <Text style={[styles.headerCell, styles.colLocation, { color: theme.textMuted }]}>Ubicación</Text>
                <Text style={[styles.headerCell, styles.colRegDate, { color: theme.textMuted }]}>Fecha Registro</Text>
                <Text style={[styles.headerCell, styles.colDeliveryDate, { color: theme.textMuted }]}>
                  {opsMode === 'entrega' ? 'Fecha Entrega' : 'Fecha Retiro'}
                </Text>
                <Text style={[styles.headerCell, styles.colDays, { color: theme.textMuted }]}>Días Alquiler</Text>
                <Text style={[styles.headerCell, styles.colOperator, { color: theme.textMuted }]}>Chofer</Text>
                <Text style={[styles.headerCell, styles.colAmount, { color: theme.textMuted }]}>Monto Total ($)</Text>
                <Text style={[styles.headerCell, styles.colPayment, { color: theme.textMuted }]}>Estado Cobro</Text>
                <Text style={[styles.headerCell, styles.colStatus, { color: theme.textMuted }]}>Estado Operativo</Text>
                <Text style={[styles.headerCell, styles.colActions, { color: theme.textMuted }]}>Acciones</Text>
              </View>

              {/* Cuerpo de la Tabla */}
              {filteredRentals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No se encontraron operaciones con los filtros aplicados.
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

                    const operatorName =
                      item.status === 'finalizado'
                        ? item.pickup_operator?.full_name
                        : item.delivery_operator?.full_name;

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
                        {/* 1. ID Operación (#4586936) + Copiar */}
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

                        {/* 2. Cliente con Avatar Circular */}
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

                        {/* 5. Fecha relevante según pestaña de operación */}
                        <View style={styles.colDeliveryDate}>
                          <Text style={[styles.cellText, { color: theme.text }]} numberOfLines={1}>
                            {formatDateOnly(getOpsDate(item, opsMode))}
                          </Text>
                        </View>

                        {/* 6. Días Alquiler */}
                        <View style={styles.colDays}>
                          <Text style={[styles.cellTextBold, { color: theme.text }]}>
                            {item.rental_days} días
                          </Text>
                        </View>

                        {/* 7. Chofer Asignado */}
                        <View style={styles.colOperator}>
                          <Text style={[styles.cellText, { color: theme.text }]} numberOfLines={1}>
                            {operatorName || 'Sin asignar'}
                          </Text>
                        </View>

                        {/* 6. Monto Total ($) */}
                        <View style={styles.colAmount}>
                          <Text style={[styles.amountText, { color: isPaid ? '#2E7D32' : theme.text }]}>
                            {item.amount != null ? `$${item.amount.toLocaleString('es-AR')}` : '—'}
                          </Text>
                        </View>

                        {/* 7. Estado del Cobro Badge */}
                        <View style={styles.colPayment}>
                          <View style={[styles.paymentBadge, { backgroundColor: isPaid ? '#1B382B' : '#3B2418' }]}>
                            <View style={[styles.badgeDot, { backgroundColor: isPaid ? '#22C55E' : '#F97316' }]} />
                            <Text style={[styles.paymentBadgeText, { color: isPaid ? '#4ADE80' : '#FB923C' }]}>
                              {isPaid ? 'Realizado' : 'Pendiente'}
                            </Text>
                          </View>
                        </View>

                        {/* 8. Estado Operativo Badge */}
                        <View style={styles.colStatus}>
                          <View style={[styles.statusBadge, { backgroundColor: (st?.color ?? '#1565C0') + '22' }]}>
                            <View style={[styles.badgeDot, { backgroundColor: st?.color ?? '#1565C0' }]} />
                            <Text style={[styles.statusBadgeText, { color: st?.color ?? theme.text }]}>
                              {st?.label ?? item.status}
                            </Text>
                          </View>
                        </View>

                        {/* 9. Botones Circulares de Acciones */}
                        <View style={styles.colActions}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.actionCircleBtn,
                              { backgroundColor: isDark ? '#262D37' : '#E2E8F0' },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedDetailsRental(item);
                              setDetailsModalVisible(true);
                            }}
                            hitSlop={6}
                          >
                            <Feather name="eye" size={14} color={theme.text} />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.actionCircleBtn,
                              { backgroundColor: isDark ? '#262D37' : '#E2E8F0' },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(`/rentals/${item.id}`);
                            }}
                            hitSlop={6}
                          >
                            <Feather name="edit-2" size={13} color={theme.text} />
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.actionCircleBtn,
                              { backgroundColor: isDark ? '#3B1E1E' : '#FEE2E2' },
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={(e) => {
                              e.stopPropagation();
                              void handleDelete(item.id, item.client_name);
                            }}
                            hitSlop={6}
                          >
                            <Feather name="trash-2" size={13} color="#EF4444" />
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

      {/* Modal exclusivo de Vista de Detalles al clickear en el Ojo (👁️) */}
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

// ==========================================
// Estilos del Contenedor y Tabla
// ==========================================
const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  /* Toolbar Superior Flotante */
  floatingToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    zIndex: 100,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    zIndex: 100,
  },

  /* Buscador Píldora Redondeada */
  searchInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
    minWidth: 160,
  },
  searchInputText: {
    fontSize: 13,
    flex: 1,
  },
  searchPillWrap: {
    alignSelf: 'flex-end',
  },

  /* Select Píldora Trigger */
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
  locationPressableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dropdownPopoverWrap: {
    position: 'absolute',
    top: 42,
    left: 0,
    zIndex: 10001,
    elevation: 10001,
  },
  dropdownPopover: {
    minWidth: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 13,
  },

  /* Date Range Picker */
  datePickerContainer: {
    position: 'relative',
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
  calendarPopoverWrap: {
    position: 'absolute',
    top: 42,
    left: 0,
    zIndex: 10001,
    elevation: 10001,
  },
  calendarPopover: {
    width: 290,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  monthNavBtns: {
    flexDirection: 'row',
    gap: 4,
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
    textTransform: 'capitalize',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 32,
  },
  dayCell: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  dayCellInRange: {
    backgroundColor: '#007AFF22',
    borderRadius: 0,
  },
  dayCellSelected: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextInRange: {
    color: '#70B5FF',
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

  /* Botón Píldora de Acción y Nuevo */
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
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 36,
    backgroundColor: '#007AFF',
  },
  primaryPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  /* Tabla Responsiva (minWidth 980) */
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

  /* Columnas Flex Responsivas */
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
  },

  /* Pestañas de operación + días */
  opsModePill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    marginBottom: 10,
  },
  dayTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
    zIndex: 120,
  },
  dayTabsSegmentedPill: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
  },
  dayCalendarWrap: {
    position: 'relative',
  },
  dayCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    minWidth: 32,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 0,
    justifyContent: 'center',
  },
  dayCalendarBtnTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dayCalendarPopoverWrap: {
    position: 'absolute',
    top: 42,
    left: 0,
    zIndex: 10001,
    elevation: 10001,
  },
  dayCalendarPopover: {
    width: 290,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  dayTabItem: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dayTabItemActive: {
    backgroundColor: '#0084FF',
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B949E',
  },
  dayTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  colLocation: {
    minWidth: 140,
    flex: 1.4,
    paddingRight: 6,
  },
  colRegDate: {
    minWidth: 140,
    flex: 1.4,
    paddingRight: 6,
  },
  colDeliveryDate: {
    minWidth: 100,
    flex: 1,
    paddingRight: 6,
  },
  colDays: {
    minWidth: 85,
    flex: 0.8,
    paddingRight: 6,
  },
  regDateText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  colOperator: {
    minWidth: 110,
    flex: 1.1,
    paddingRight: 6,
  },
  colAmount: {
    minWidth: 100,
    flex: 1,
    paddingRight: 6,
  },
  colPayment: {
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

  /* Textos de Celdas y Badges */
  cellText: {
    fontSize: 12,
  },
  cellTextBold: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cellSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  amountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Botones Circulares de Acciones */
  actionCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});

