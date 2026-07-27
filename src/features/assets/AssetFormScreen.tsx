import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { industry, label } from '@/config/industry';
import { assetsRepo } from '@/data/repositories';
import { Button } from '@/core/ui/Button';
import { alertMessage, confirmAction } from '@/core/ui/confirm';
import { Screen } from '@/core/ui/Screen';
import { SelectField } from '@/core/ui/SelectField';
import { TextField } from '@/core/ui/TextField';
import { spacing } from '@/core/theme';

function resolveId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function AssetFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = resolveId(params.id);
  const isNew = !id || id === 'new';

  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(industry.assetStatuses[0]?.value ?? 'disponible');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const items = await assetsRepo.list();
        const item = items.find((a) => a.id === id);
        if (!item) {
          alertMessage('No encontrado');
          router.back();
          return;
        }
        setCode(item.code);
        setNotes(item.notes);
        setStatus(item.status);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, router]);

  const save = async () => {
    if (!code.trim()) {
      alertMessage('Código requerido');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await assetsRepo.create({
          code: code.trim(),
          notes: notes.trim(),
          status,
          metadata: {},
        });
      } else if (id) {
        await assetsRepo.update(id, {
          code: code.trim(),
          notes: notes.trim(),
          status,
        });
      }
      router.back();
    } catch (error) {
      alertMessage('Error', error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id || isNew) return;
    const ok = await confirmAction({
      title: 'Eliminar',
      message: `¿Eliminar este ${label('asset').toLowerCase()}?`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await assetsRepo.remove(id);
      router.back();
    } catch (error) {
      alertMessage('Error', error instanceof Error ? error.message : 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen
      title={isNew ? `Nuevo ${label('asset')}` : `Editar ${label('asset')}`}
      loading={loading}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TextField label="Código" value={code} onChangeText={setCode} autoCapitalize="characters" />
        <TextField label="Notas" value={notes} onChangeText={setNotes} multiline />
        <SelectField
          label="Estado"
          value={status}
          onChange={setStatus}
          options={industry.assetStatuses.map((s) => ({ label: s.label, value: s.value }))}
        />
        <View style={styles.actions}>
          <Button title="Guardar" loading={saving} onPress={() => void save()} />
          {!isNew ? (
            <Button title="Eliminar" variant="danger" loading={deleting} onPress={() => void remove()} />
          ) : null}
          <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
