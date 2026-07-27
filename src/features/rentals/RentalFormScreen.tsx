import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
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
import { Screen } from '@/core/ui/Screen';
import { SelectField } from '@/core/ui/SelectField';
import { TextField } from '@/core/ui/TextField';
import { spacing, typography } from '@/core/theme';

function resolveId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function RentalFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = resolveId(params.id);
  const isNew = !id || id === 'new';

  const [assets, setAssets] = useState<Asset[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assetId, setAssetId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rentalDays, setRentalDays] = useState('7');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState('activo');
  const [deliveryOperatorId, setDeliveryOperatorId] = useState('');
  const [pickupOperatorId, setPickupOperatorId] = useState('');
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [address, setAddress] = useState('');
  const [receipt, setReceipt] = useState<AttachmentValue>(null);

  const activeOperators = useMemo(
    () => operators.filter((o) => o.active || o.id === deliveryOperatorId || o.id === pickupOperatorId),
    [operators, deliveryOperatorId, pickupOperatorId],
  );

  const availableAssets = useMemo(() => {
    if (isNew) return assets.filter((a) => a.status === 'disponible');
    return assets;
  }, [assets, isNew]);

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
          setAssetId(rental.asset_id);
          setStartDate(rental.start_date);
          setRentalDays(String(rental.rental_days));
          setClientName(rental.client_name);
          setStatus(rental.status);
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

  const onSelectLocation = (value: MapLocation) => {
    setLocation(value);
    if (value.address) setAddress(value.address);
  };

  const validate = (): string | null => {
    if (!assetId) return `Seleccioná un ${label('asset').toLowerCase()}`;
    if (!clientName.trim()) return 'Completá a nombre de quién';
    const days = Number(rentalDays);
    if (!Number.isFinite(days) || days <= 0) return 'Los días deben ser un número mayor a 0';
    if (industry.features.deliveryOperator && !deliveryOperatorId) {
      return `Seleccioná ${industry.labels.deliveryOperator.toLowerCase()}`;
    }
    if (industry.features.map && (!location || location.lat == null || location.lng == null)) {
      return 'Marcá la ubicación en el mapa';
    }
    if (status === 'finalizado' && industry.features.pickupOperator && !pickupOperatorId) {
      return `Para finalizar necesitás ${industry.labels.pickupOperator.toLowerCase()}`;
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
      const payload = {
        asset_id: assetId,
        start_date: startDate,
        rental_days: Number(rentalDays),
        client_name: clientName.trim(),
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        address: address.trim(),
        status,
        delivery_operator_id: deliveryOperatorId || null,
        pickup_operator_id: pickupOperatorId || null,
        receipt_uri: receipt?.uri ?? null,
        receipt_name: receipt?.name ?? null,
      };

      if (isNew) await rentalsRepo.create(payload);
      else if (id) await rentalsRepo.update(id, payload);
      router.back();
    } catch (err) {
      alertMessage('Error', err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const closeRental = async () => {
    if (!pickupOperatorId) {
      alertMessage(
        'Chofer de retiro',
        `Seleccioná ${industry.labels.pickupOperator.toLowerCase()} antes de finalizar.`,
      );
      return;
    }
    setStatus('finalizado');
    setSaving(true);
    try {
      if (id) {
        await rentalsRepo.update(id, {
          status: 'finalizado',
          pickup_operator_id: pickupOperatorId,
        });
      }
      router.back();
    } catch (err) {
      alertMessage('Error', err instanceof Error ? err.message : 'No se pudo finalizar');
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
      router.back();
    } catch (err) {
      alertMessage('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  return (
    <Screen
      title={isNew ? `Nuevo ${label('rental')}` : `Editar ${label('rental')}`}
      loading={loading}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <SelectField
          label={label('asset')}
          value={assetId}
          onChange={setAssetId}
          options={availableAssets.map((a) => ({ label: a.code, value: a.id }))}
        />
        <TextField
          label={industry.labels.startDate}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
        />
        <TextField
          label={industry.labels.rentalDays}
          value={rentalDays}
          onChangeText={setRentalDays}
          keyboardType="number-pad"
        />
        <TextField label={industry.labels.client} value={clientName} onChangeText={setClientName} />

        {industry.features.receipt ? (
          <AttachmentPicker label={industry.labels.receipt} value={receipt} onChange={setReceipt} />
        ) : null}

        {industry.features.deliveryOperator ? (
          <SelectField
            label={industry.labels.deliveryOperator}
            value={deliveryOperatorId}
            onChange={setDeliveryOperatorId}
            options={activeOperators.map((o) => ({ label: o.full_name, value: o.id }))}
          />
        ) : null}

        {!isNew && industry.features.pickupOperator ? (
          <SelectField
            label={industry.labels.pickupOperator}
            value={pickupOperatorId}
            onChange={setPickupOperatorId}
            options={activeOperators.map((o) => ({ label: o.full_name, value: o.id }))}
          />
        ) : null}

        {!isNew ? (
          <SelectField
            label="Estado"
            value={status}
            onChange={setStatus}
            options={industry.rentalStatuses.map((s) => ({ label: s.label, value: s.value }))}
          />
        ) : null}

        {industry.features.map ? (
          <View style={styles.mapBlock}>
            <Text style={styles.sectionTitle}>{industry.labels.location}</Text>
            <Text style={styles.hint}>Tocá el mapa para colocar el punto exacto.</Text>
            <LocationMap
              height={280}
              editable
              lockCenter={false}
              center={location ?? DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              selected={location}
              onSelect={onSelectLocation}
            />
            <TextField
              label="Dirección"
              value={address}
              onChangeText={setAddress}
              placeholder="Se completa al marcar el punto (editable)"
            />
            {location ? (
              <Text style={styles.coords}>
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button title="Guardar" loading={saving} onPress={() => void save()} />
          {!isNew && status !== 'finalizado' ? (
            <Button title="Finalizar / Coordinar retiro" variant="secondary" onPress={() => void closeRental()} />
          ) : null}
          {!isNew ? <Button title="Eliminar" variant="danger" onPress={() => void remove()} /> : null}
          <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  mapBlock: { marginBottom: spacing.md },
  sectionTitle: { ...typography.subtitle, marginBottom: spacing.xs },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  coords: { ...typography.caption, marginTop: -spacing.sm, marginBottom: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
