import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { stockRepo } from '@/data/repositories';
import { Button } from '@/core/ui/Button';
import { useTheme } from '@/core/theme/ThemeContext';
import { toast } from '@/core/ui/ToastContext';

export interface EditFleetModalProps {
  visible: boolean;
  currentTotal: number;
  onClose: () => void;
  onSaved: () => void;
}

export function EditFleetModal({ visible, currentTotal, onClose, onSaved }: EditFleetModalProps) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';
  const [totalInput, setTotalInput] = useState<string>(String(currentTotal || 50));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTotalInput(String(currentTotal || 50));
  }, [currentTotal, visible]);

  const handleIncrement = () => {
    const val = parseInt(totalInput, 10) || 0;
    setTotalInput(String(val + 1));
  };

  const handleDecrement = () => {
    const val = parseInt(totalInput, 10) || 0;
    if (val > 1) setTotalInput(String(val - 1));
  };

  const handleSave = async () => {
    const parsed = parseInt(totalInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Error', 'Ingresá una cantidad válida mayor o igual a 0');
      return;
    }

    setSaving(true);
    try {
      await stockRepo.saveConfig({ total_units: parsed });
      toast.success('Flota Total Actualizada', `Se configuró la flota total en ${parsed} contenedores.`);
      onSaved();
      onClose();
    } catch (error) {
      toast.error('Error al guardar', error instanceof Error ? error.message : 'No se pudo actualizar la flota');
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Editar Flota Total</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                Ajustá la cantidad total de contenedores registrados en la empresa
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

          {/* Cuerpo Modal */}
          <View style={styles.modalBody}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Cantidad Total de Unidades</Text>

            {/* Stepper + Input */}
            <View style={styles.stepperRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.stepperBtn,
                  { backgroundColor: pressed ? (isDark ? '#2B333E' : '#CBD5E1') : (isDark ? '#1C2128' : '#E2E8F0') },
                ]}
                onPress={handleDecrement}
              >
                <Feather name="minus" size={18} color={theme.text} />
              </Pressable>

              <View style={[styles.stepperInputBox, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: '#007AFF' }]}>
                <TextInput
                  style={[styles.stepperInputText, { color: theme.text }]}
                  value={totalInput}
                  onChangeText={setTotalInput}
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
                <Feather name="plus" size={18} color={theme.text} />
              </Pressable>
            </View>

            {/* Presets Rápidos */}
            <View style={styles.presetsRow}>
              {[20, 30, 50, 75, 100].map((num) => (
                <Pressable
                  key={num}
                  style={({ pressed }) => [
                    styles.presetChip,
                    {
                      backgroundColor: totalInput === String(num)
                        ? '#007AFF'
                        : (pressed ? (isDark ? '#2B333E' : '#CBD5E1') : (isDark ? '#1C2128' : '#E2E8F0')),
                    },
                  ]}
                  onPress={() => setTotalInput(String(num))}
                >
                  <Text style={[styles.presetText, { color: totalInput === String(num) ? '#FFFFFF' : theme.text }]}>
                    {num} u.
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Acciones Modal */}
            <View style={styles.actionsRow}>
              <Button title="Guardar Flota Total" loading={saving} onPress={() => void handleSave()} />
              <Button title="Cancelar" variant="ghost" onPress={onClose} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
    maxWidth: 440,
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
    marginLeft: 10,
  },
  modalBody: {
    padding: 20,
    gap: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
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
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stepperInputText: {
    fontSize: 18,
    fontWeight: 'bold',
    width: '100%',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  presetText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsRow: {
    gap: 10,
    marginTop: 8,
  },
});
