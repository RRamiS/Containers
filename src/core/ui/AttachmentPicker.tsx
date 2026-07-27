import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { colors, spacing, typography } from '../theme';

export type AttachmentValue = {
  uri: string;
  name: string;
} | null;

type Props = {
  label: string;
  value: AttachmentValue;
  onChange: (value: AttachmentValue) => void;
};

export function AttachmentPicker({ label, value, onChange }: Props) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para subir el recibo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange({
        uri: asset.uri,
        name: asset.fileName ?? `recibo-${Date.now()}.jpg`,
      });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange({
        uri: asset.uri,
        name: asset.name,
      });
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
