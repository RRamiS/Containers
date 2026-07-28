import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { industry, label } from '@/config/industry';
import { assetsRepo, operatorsRepo, rentalsRepo } from '@/data/repositories';
import type { Asset, Operator } from '@/data/types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/core/map/leafletHtml';
import { LocationMap } from '@/core/map/LocationMap';
import type { MapLocation } from '@/core/map/types';
import { AttachmentPicker, type AttachmentValue } from '@/core/ui/AttachmentPicker';
import { Button } from '@/core/ui/Button';
import { alertMessage, confirmAction } from '@/core/ui/confirm';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';
import { spacing } from '@/core/theme';

function resolveId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

// ==========================================
// Componente 1: Selector de Fecha Unica (Calendario Estilo Estadísticas)
// ==========================================
function SingleDatePickerField({
  label: fieldLabelText,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const emptyPrefixDays = Array.from({ length: startDayOfWeek });

  const formattedDisplay = value ? format(parsedDate, 'dd / MM / yyyy') : 'Seleccionar fecha';

  return (
    <View style={[styles.fieldGroupFlex, { position: 'relative', zIndex: open ? 10000 : 1 }]}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{fieldLabelText}</Text>
      <View style={{ position: 'relative', zIndex: open ? 10000 : 1 }}>
        <Pressable
          style={({ pressed }) => [
            styles.datePickerInput,
            {
              backgroundColor: pressed || open ? (isDark ? '#262D37' : '#E2E8F0') : (isDark ? '#161B22' : '#F8FAFC'),
              borderColor: open ? '#007AFF' : theme.surfaceBorder,
            },
          ]}
          onPress={() => setOpen(!open)}
        >
          <Text style={[styles.dateInputText, { color: theme.text }]}>{formattedDisplay}</Text>
          <Feather name="calendar" size={16} color={theme.textMuted} />
        </Pressable>

        {open ? (
          <>
            <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} />
            <View
              style={[
                styles.singleCalendarPopover,
                { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              ]}
            >
              <View style={styles.calendarMonthHeader}>
                <Text style={[styles.calendarMonthTitle, { color: theme.text }]}>
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </Text>
                <View style={styles.calendarNavRow}>
                  <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.calendarNavBtn}>
                    <Feather name="chevron-left" size={16} color={theme.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.calendarNavBtn}>
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
                  const isSelected = value === dayStr;
                  return (
                    <Pressable
                      key={dayStr}
                      style={[
                        styles.dayCell,
                        isSelected && styles.singleDayCellSelected,
                      ]}
                      onPress={() => {
                        onChange(dayStr);
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
          </>
        ) : null}
      </View>
    </View>
  );
}

// ==========================================
// Componente 2: Stepper Input de Días (+ / -)
// ==========================================
function DaysStepperField({
  label: fieldLabelText,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <View style={styles.fieldGroupFlex}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{fieldLabelText}</Text>
      <View style={styles.stepperContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.stepperBtn,
            { backgroundColor: pressed ? (isDark ? '#2B333E' : '#CBD5E1') : (isDark ? '#1C2128' : '#E2E8F0') },
          ]}
          onPress={handleDecrement}
        >
          <Feather name="minus" size={16} color={theme.text} />
        </Pressable>

        <View style={[styles.stepperInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: '#007AFF' }]}>
          <TextInput
            style={[styles.stepperInputText, { color: theme.text }]}
            value={String(value)}
            onChangeText={(txt) => {
              const num = parseInt(txt, 10);
              if (!isNaN(num) && num > 0) onChange(num);
              else if (txt === '') onChange(1);
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.stepperBtn,
            { backgroundColor: pressed ? (isDark ? '#2B333E' : '#CBD5E1') : (isDark ? '#1C2128' : '#E2E8F0') },
          ]}
          onPress={handleIncrement}
        >
          <Feather name="plus" size={16} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

// ==========================================
// Componente 3: Select Personalizado (Estilo Estadísticas)
// ==========================================
function FormSelectField({
  label: fieldLabelText,
  value,
  onChange,
  options,
  iconName,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  iconName?: keyof typeof Feather.glyphMap;
}) {
  const [open, setOpen] = useState(false);
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.fieldGroup, { position: 'relative', zIndex: open ? 10000 : 1 }]}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{fieldLabelText}</Text>
      <View style={{ position: 'relative', zIndex: open ? 10000 : 1 }}>
        <Pressable
          style={({ pressed }) => [
            styles.selectTrigger,
            {
              backgroundColor: pressed || open ? (isDark ? '#262D37' : '#E2E8F0') : (isDark ? '#161B22' : '#F8FAFC'),
              borderColor: open ? '#007AFF' : theme.surfaceBorder,
            },
          ]}
          onPress={() => setOpen(!open)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {iconName ? <Feather name={iconName} size={15} color={theme.textMuted} style={{ marginRight: 8 }} /> : null}
            <Text style={[styles.selectTriggerText, { color: theme.text }]}>
              {selected?.label ?? 'Seleccionar...'}
            </Text>
          </View>
          <Feather name="chevron-down" size={16} color={theme.textMuted} />
        </Pressable>

        {open ? (
          <>
            <Pressable style={styles.popoverBackdrop} onPress={() => setOpen(false)} />
            <View
              style={[
                styles.selectPopover,
                { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              ]}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    style={({ pressed }) => [
                      styles.selectOption,
                      (isSelected || pressed) && { backgroundColor: isDark ? '#262D37' : '#E2E8F0' },
                    ]}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
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
    </View>
  );
}

// ==========================================
// Componente Principal: RentalFormScreen (Modal)
// ==========================================
export function RentalFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = resolveId(params.id);
  const isNew = !id || id === 'new';

  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assetId, setAssetId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rentalDays, setRentalDays] = useState(3); // Seted en 3 por defecto
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState('activo');
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'realizado'>('pendiente');
  const [amount, setAmount] = useState('');
  const [unitAmount, setUnitAmount] = useState('');
  const [deliveryOperatorId, setDeliveryOperatorId] = useState('');
  const [pickupOperatorId, setPickupOperatorId] = useState('');
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [address, setAddress] = useState('');
  const [receipt, setReceipt] = useState<AttachmentValue>(null);

  const registrationTimestamp = useMemo(() => {
    return format(new Date(), 'dd/MM/yyyy - HH:mm');
  }, []);

  const activeOperators = useMemo(
    () => operators.filter((o) => o.active || o.id === deliveryOperatorId || o.id === pickupOperatorId),
    [operators, deliveryOperatorId, pickupOperatorId],
  );

  useEffect(() => {
    void (async () => {
      try {
        const [assetList, operatorList] = await Promise.all([assetsRepo.list(), operatorsRepo.list()]);
        setAssets(assetList);
        setOperators(operatorList);

        if (!isNew && id) {
          const rental = await rentalsRepo.get(id);
          if (!rental) {
            alertMessage('No encontrado');
            router.back();
            return;
          }
          setAssetId(rental.asset_id ?? '');
          setStartDate(rental.start_date);
          setRentalDays(rental.rental_days || 3);
          setClientName(rental.client_name);
          setStatus(rental.status);
          setPaymentStatus(rental.payment_status ?? 'pendiente');
          setAmount(rental.amount != null ? String(rental.amount) : '');
          setUnitAmount(rental.unit_amount != null ? String(rental.unit_amount) : '');
          setDeliveryOperatorId(rental.delivery_operator_id ?? '');
          setPickupOperatorId(rental.pickup_operator_id ?? '');
          setAddress(rental.address);
          if (rental.lat != null && rental.lng != null) {
            setLocation({ lat: rental.lat, lng: rental.lng, address: rental.address });
          }
          if (rental.receipt_uri) {
            setReceipt({ uri: rental.receipt_uri, name: rental.receipt_name ?? 'recibo' });
          }
        } else if (assetList.length) {
          const firstAvailable = assetList.find((a) => a.status === 'disponible');
          if (firstAvailable) setAssetId(firstAvailable.id);
        }
        if (operatorList.length) {
          const firstActive = operatorList.find((o) => o.active);
          if (firstActive && isNew) setDeliveryOperatorId(firstActive.id);
        }
      } catch (error) {
        alertMessage('Error', error instanceof Error ? error.message : 'No se pudo cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, router]);

  const handleDaysChange = (newDays: number) => {
    setRentalDays(newDays);
    const parsedUnit = parseFloat(unitAmount);
    if (!isNaN(parsedUnit) && newDays > 0) {
      setAmount(String(Math.round(parsedUnit * newDays)));
    }
  };

  const handleUnitAmountChange = (text: string) => {
    setUnitAmount(text);
    const parsedUnit = parseFloat(text);
    if (!isNaN(parsedUnit) && rentalDays > 0) {
      setAmount(String(Math.round(parsedUnit * rentalDays)));
    }
  };

  const handleAmountChange = (text: string) => {
    setAmount(text);
    const parsedTotal = parseFloat(text);
    if (!isNaN(parsedTotal) && rentalDays > 0) {
      setUnitAmount(String(Math.round(parsedTotal / rentalDays)));
    }
  };

  const onSelectLocation = (value: MapLocation) => {
    setLocation(value);
    if (value.address) setAddress(value.address);
  };

  const validate = (): string | null => {
    if (!clientName.trim()) return 'Completá el nombre del cliente';
    if (!rentalDays || rentalDays <= 0) return 'Los días deben ser mayor a 0';
    if (industry.features.deliveryOperator && !deliveryOperatorId) {
      return `Seleccioná un chofer de entrega`;
    }
    return null;
  };

  const save = async () => {
    const error = validate();
    if (error) {
      alertMessage('Revisá el formulario', error);
      return;
    }

    setSaving(true);
    try {
      const parsedAmount = amount.trim() ? parseFloat(amount) : null;
      const parsedUnitAmount = unitAmount.trim() ? parseFloat(unitAmount) : null;
      const payload = {
        asset_id: assetId || null,
        rental_type: 'temporal' as const,
        start_date: startDate,
        rental_days: rentalDays,
        client_name: clientName.trim(),
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        address: address.trim(),
        status,
        payment_status: paymentStatus,
        amount: parsedAmount,
        unit_amount: parsedUnitAmount,
        delivery_operator_id: deliveryOperatorId || null,
        pickup_operator_id: pickupOperatorId || null,
        receipt_uri: receipt?.uri ?? null,
        receipt_name: receipt?.name ?? null,
      };

      if (isNew) {
        await rentalsRepo.create(payload);
        toast.success('Alquiler creado con éxito', `Se registraron los datos para ${clientName.trim()}.`);
      } else if (id) {
        await rentalsRepo.update(id, payload);
        toast.success('Alquiler actualizado', `Se guardaron los cambios para ${clientName.trim()}.`);
      }
      router.back();
    } catch (err) {
      toast.error('Error al guardar', err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || isNew) return;
    const ok = await confirmAction({
      title: 'Eliminar',
      message: `¿Eliminar este ${label('rental').toLowerCase()}?`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    try {
      await rentalsRepo.remove(id);
      toast.warning('Alquiler eliminado', 'La operación fue removida del registro.');
      router.back();
    } catch (err) {
      toast.error('Error al eliminar', err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  if (loading) {
    return (
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, padding: 40 }]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
      <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        {/* Header del Modal */}
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isNew ? `Nuevo ${label('rental')}` : `Editar ${label('rental')}`}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Completá la información del servicio de contenedor
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: pressed ? (isDark ? '#262D37' : '#E2E8F0') : (isDark ? '#1C2128' : '#F1F5F9') },
            ]}
            onPress={() => router.back()}
          >
            <Feather name="x" size={18} color={theme.text} />
          </Pressable>
        </View>

        {/* Cuerpo del Formulario con Scroll */}
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          {/* Badge 1: Fecha de Registro (Automática con hora) */}
          <View style={[styles.registrationBadge, { backgroundColor: isDark ? '#1C222B' : '#F1F5F9', borderColor: theme.surfaceBorder }]}>
            <Feather name="clock" size={14} color={theme.textMuted} style={{ marginRight: 8 }} />
            <Text style={[styles.registrationLabel, { color: theme.textMuted }]}>Fecha de Registro: </Text>
            <Text style={[styles.registrationValue, { color: theme.text }]}>{registrationTimestamp}</Text>
          </View>

          {/* Campo: Cliente */}
          <View style={[styles.fieldGroup, { position: 'relative', zIndex: 50 }]}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Cliente / Empresa</Text>
            <View style={[styles.textInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder }]}>
              <Feather name="user" size={15} color={theme.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                value={clientName}
                onChangeText={setClientName}
                placeholder="Nombre del cliente..."
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Fila Doble: Fecha de Entrega y Cantidad de Días (Stepper +/-) */}
          <View style={[styles.twoColumnRow, { position: 'relative', zIndex: 40 }]}>
            {/* Fecha 2: Fecha de Entrega deseada con Calendario Estilo Estadísticas */}
            <SingleDatePickerField
              label="Fecha de Entrega"
              value={startDate}
              onChange={setStartDate}
            />

            {/* Stepper de Días (Input con botones + y -) */}
            <DaysStepperField
              label="Cantidad de Días"
              value={rentalDays}
              onChange={handleDaysChange}
            />
          </View>

          {/* Select: Estado del Pago */}
          <View style={{ position: 'relative', zIndex: 30, gap: 10 }}>
            <FormSelectField
              label="Estado del Pago"
              value={paymentStatus}
              onChange={(val) => setPaymentStatus(val as 'pendiente' | 'realizado')}
              options={[
                { label: 'Pago Pendiente', value: 'pendiente' },
                { label: 'Pago Realizado', value: 'realizado' },
              ]}
              iconName="credit-card"
            />

            {/* Adjunto de Comprobante (Aparece únicamente al seleccionar Pago Realizado) */}
            {paymentStatus === 'realizado' && industry.features.receipt ? (
              <View style={{ marginTop: 4 }}>
                <AttachmentPicker label={industry.labels.receipt} value={receipt} onChange={setReceipt} />
              </View>
            ) : null}
          </View>

          {/* Fila Doble: Monto Unitario y Monto Total Lado a Lado */}
          <View style={[styles.twoColumnRow, { position: 'relative', zIndex: 20 }]}>
            <View style={styles.fieldGroupFlex}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Monto Unit. ($ / día)</Text>
              <View style={[styles.amountInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder }]}>
                <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.amountInputText, { color: theme.text }]}
                  value={unitAmount}
                  onChangeText={handleUnitAmountChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroupFlex}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Monto Total ($)</Text>
              <View style={[styles.amountInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder }]}>
                <Text style={[styles.currencyPrefix, { color: theme.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.amountInputText, { color: theme.text }]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Select: Chofer de Entrega */}
          <View style={{ position: 'relative', zIndex: 10 }}>
            <FormSelectField
              label="Chofer Asignado (Entrega)"
              value={deliveryOperatorId}
              onChange={setDeliveryOperatorId}
              options={activeOperators.map((o) => ({ label: o.full_name, value: o.id }))}
              iconName="truck"
            />
          </View>

          {/* Ubicación y Mapa */}
          {industry.features.map ? (
            <View style={styles.mapSection}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{industry.labels.location}</Text>
              <Text style={[styles.hintText, { color: theme.textMuted }]}>Tocá el mapa para ubicar la entrega exactos.</Text>
              <LocationMap
                height={220}
                editable
                lockCenter={false}
                center={location ?? DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                selected={location}
                onSelect={onSelectLocation}
              />
              <View style={[styles.textInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder, marginTop: 10 }]}>
                <Feather name="map-pin" size={15} color={theme.textMuted} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Dirección o punto de referencia..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Footer del Modal con Acciones */}
        <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
          <Button title="Guardar Alquiler" loading={saving} onPress={() => void save()} />
          {!isNew ? (
            <Button title="Eliminar" variant="danger" onPress={() => void remove()} />
          ) : null}
          <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </View>
  );
}

// ==========================================
// Estilos del Modal
// ==========================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    zIndex: 1,
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
    gap: 16,
  },
  registrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  registrationLabel: {
    fontSize: 12,
  },
  registrationValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldGroupFlex: {
    flex: 1,
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
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 14,
  },

  /* Stepper Input */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInputBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInputText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: '100%',
  },

  /* Single Date Picker Input */
  datePickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  dateInputText: {
    fontSize: 14,
    fontWeight: '500',
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
  singleCalendarPopover: {
    position: 'absolute',
    top: 48,
    left: 0,
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    zIndex: 10001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarMonthTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  calendarNavRow: {
    flexDirection: 'row',
    gap: 4,
  },
  calendarNavBtn: {
    padding: 4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekDayText: {
    width: 30,
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
  singleDayCellSelected: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Select Popover */
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  selectTriggerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectPopover: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 10001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectOptionText: {
    fontSize: 13,
  },

  /* Amounts Side by Side */
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 6,
  },
  amountInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  /* Map Section */
  mapSection: {
    gap: 8,
  },
  hintText: {
    fontSize: 11,
  },

  /* Modal Footer */
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});

