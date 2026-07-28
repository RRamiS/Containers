import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { colors, spacing, typography } from '../theme';
import { toDataUri } from '@/features/rentals/openReceipt';

export type AttachmentValue = {
  uri: string;
  name: string;
} | null;

type Props = {
  label: string;
  value: AttachmentValue;
  onChange: (value: AttachmentValue) => void;
};

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function uriToDataUri(uri: string, mime: string): Promise<string> {
  if (uri.startsWith('data:')) return uri;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') resolve(result);
        else reject(new Error('No se pudo leer el archivo'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return toDataUri(uri, null, mime);
  }
}

export function AttachmentPicker({ label, value, onChange }: Props) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para subir el recibo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `recibo-${Date.now()}.jpg`;
      const mime = asset.mimeType || guessMimeFromName(name);
      let uri = asset.uri;
      if (asset.base64) {
        uri = `data:${mime};base64,${asset.base64}`;
      } else if (Platform.OS === 'web') {
        uri = await uriToDataUri(asset.uri, mime);
      }
      onChange({ uri, name });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      ...(Platform.OS === 'web' ? { base64: true } : {}),
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.name || `recibo-${Date.now()}`;
      const mime = asset.mimeType || guessMimeFromName(name);
      let uri = asset.uri;

      // En web, DocumentPicker puede devolver base64 en asset.base64 o en uri
      const base64 = (asset as { base64?: string }).base64;
      if (base64) {
        uri = `data:${mime};base64,${base64}`;
      } else if (uri.startsWith('data:')) {
        // ok
      } else if (Platform.OS === 'web') {
        uri = await uriToDataUri(uri, mime);
      }

      onChange({ uri: toDataUri(uri, name, mime), name });
    }
  };

  const choose = () => {
    if (Platform.OS === 'web') {
      void pickFile();
      return;
    }
    Alert.alert(label, 'Elegí el origen del archivo', [
      { text: 'Imagen', onPress: () => void pickImage() },
      { text: 'Archivo', onPress: () => void pickFile() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.fileName}>{value.name}</Text> : <Text style={styles.empty}>Sin archivo</Text>}
      <View style={styles.actions}>
        <Button title={value ? 'Cambiar archivo' : 'Subir archivo'} variant="secondary" onPress={choose} />
        {value ? (
          <Button title="Quitar" variant="ghost" onPress={() => onChange(null)} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
    color: colors.text,
  },
  fileName: { ...typography.body, marginBottom: spacing.sm },
  empty: { ...typography.caption, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
