import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fixedContainersRepo } from '@/data/repositories';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/core/map/leafletHtml';
import { LocationMap } from '@/core/map/LocationMap';
import type { MapLocation } from '@/core/map/types';
import { Button } from '@/core/ui/Button';
import { confirmAction } from '@/core/ui/confirm';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';

function resolveId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function AssetFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = resolveId(params.id);
  const isNew = !id || id === 'new';
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState<MapLocation | null>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const items = await fixedContainersRepo.list();
        const item = items.find((a) => a.id === id);
        if (!item) {
          toast.error('No encontrado');
          router.back();
          return;
        }
        setClientName(item.client_name);
        setAddress(item.address);
        setNotes(item.notes);
        setStartDate(item.start_date);
        if (item.lat != null && item.lng != null) {
          setLocation({ lat: item.lat, lng: item.lng, address: item.address });
        }
      } catch (error) {
        toast.error('Error', error instanceof Error ? error.message : 'No se pudo cargar');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, router]);

  const save = async () => {
    if (!clientName.trim()) {
      toast.error('Atención', 'Completá el nombre del cliente o empresa');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await fixedContainersRepo.create({
          client_name: clientName.trim(),
          address: address.trim(),
          notes: notes.trim(),
          start_date: startDate,
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
        });
        toast.success('Contenedor Fijo Registrado', `Se creó la ubicación para ${clientName.trim()}.`);
      } else if (id) {
        await fixedContainersRepo.update(id, {
          client_name: clientName.trim(),
          address: address.trim(),
          notes: notes.trim(),
          start_date: startDate,
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
        });
        toast.success('Contenedor Fijo Actualizado', `Se guardaron los cambios para ${clientName.trim()}.`);
      }
      router.back();
    } catch (error) {
      toast.error('Error al guardar', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || isNew) return;
    const ok = await confirmAction({
      title: 'Eliminar Contenedor Fijo',
      message: '¿Estás seguro de eliminar esta ubicación de contenedor fijo?',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await fixedContainersRepo.remove(id);
      toast.warning('Contenedor Fijo Eliminado', 'La ubicación fue removida del registro.');
      router.back();
    } catch (error) {
      toast.error('Error al eliminar', error instanceof Error ? error.message : 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder, padding: 40 }]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={styles.backdropPressable} onPress={() => router.back()} />

      <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
        {/* Header Modal */}
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isNew ? 'Nuevo Contenedor Fijo' : 'Editar Contenedor Fijo'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Ubicaciones fijas permanentes por período mensual
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
                placeholder="Ej. Constructora San Luis"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Dirección / Ubicación</Text>
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
            <View style={[styles.textInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.surfaceBorder, height: 60 }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Detalles sobre la ubicación o acceso..."
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Mapa para Fijar Posición */}
          <View style={styles.mapSection}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Posición en el Mapa</Text>
            <Text style={[styles.hintText, { color: theme.textMuted }]}>Hacé clic en el mapa para ubicar el contenedor fijo.</Text>
            <View style={[styles.mapBox, { borderColor: theme.surfaceBorder }]}>
              <LocationMap
                height={200}
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
            <Button title={isNew ? 'Guardar Contenedor Fijo' : 'Guardar Cambios'} loading={saving} onPress={() => void save()} />
            {!isNew ? (
              <Button title="Eliminar" variant="danger" loading={deleting} onPress={() => void remove()} />
            ) : null}
            <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: 580,
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
    height: 44,
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
    marginBottom: 6,
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
    marginTop: 10,
    gap: 10,
  },
});
