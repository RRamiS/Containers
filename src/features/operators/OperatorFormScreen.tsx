import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { label } from '@/config/industry';
import { operatorsRepo } from '@/data/repositories';
import { Button } from '@/core/ui/Button';
import { alertMessage, confirmAction } from '@/core/ui/confirm';
import { Screen } from '@/core/ui/Screen';
import { TextField } from '@/core/ui/TextField';
import { colors, spacing } from '@/core/theme';

function resolveId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function OperatorFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = resolveId(params.id);
  const isNew = !id || id === 'new';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const items = await operatorsRepo.list();
        const item = items.find((o) => o.id === id);
        if (!item) {
          alertMessage('No encontrado');
          router.back();
          return;
        }
        setFullName(item.full_name);
        setPhone(item.phone);
        setLicense(item.license);
        setUsername(item.username || '');
        setPassword(item.password || '');
        setActive(item.active);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, router]);

  const save = async () => {
    if (!fullName.trim()) {
      alertMessage('Nombre requerido');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        license: license.trim(),
        username: username.trim(),
        password: password.trim(),
        active,
      };
      if (isNew) await operatorsRepo.create(payload);
      else if (id) await operatorsRepo.update(id, payload);
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
      message: `¿Eliminar este ${label('operator').toLowerCase()}?`,
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await operatorsRepo.remove(id);
      router.back();
    } catch (error) {
      alertMessage('Error', error instanceof Error ? error.message : 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen
      title={isNew ? `Nuevo ${label('operator')}` : `Editar ${label('operator')}`}
      loading={loading}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TextField label="Nombre completo" value={fullName} onChangeText={setFullName} />
        <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField label="Licencia" value={license} onChangeText={setLicense} />
        
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Credenciales de Acceso (Login)</Text>
        </View>

        <TextField
          label="Usuario (Login)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="ej: chofer1"
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Ingresá contraseña"
        />

        <Pressable style={styles.toggle} onPress={() => setActive((v) => !v)}>
          <Text style={styles.toggleLabel}>Estado</Text>
          <Text style={[styles.toggleValue, { color: active ? colors.success : colors.textMuted }]}>
            {active ? 'Activo' : 'Inactivo'}
          </Text>
        </Pressable>
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
  sectionDivider: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  toggleLabel: { fontWeight: '600', color: colors.text },
  toggleValue: { fontWeight: '600' },
});
