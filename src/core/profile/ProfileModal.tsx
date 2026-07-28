import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

import { toast } from '../ui/ToastContext';

export function ProfileButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  const handleLogout = () => {
    setModalVisible(false);
    toast.info('Sesión cerrada', 'Has salido del sistema de contenedores correctamente.');
  };

  return (
    <>
      <Pressable
        style={[
          styles.profileBtn,
          {
            backgroundColor: isDark ? '#161C23' : '#E2E8F0',
            borderColor: isDark ? '#242C37' : '#CBD5E1',
          },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Perfil de usuario"
      >
        <Feather name="user" size={16} color={isDark ? '#FFFFFF' : '#475569'} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.surfaceBorder,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del Modal con Ícono Top Left y Cerrar Top Right (Imagen 3) */}
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.avatarBadge,
                  { backgroundColor: isDark ? '#242C37' : '#F1F5F9' },
                ]}
              >
                <Feather name="user" size={18} color={theme.text} />
              </View>

              <Pressable
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? '#242C37' : '#F1F5F9' },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={16} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Información del Usuario */}
            <View style={styles.userInfoSection}>
              <View style={styles.nameRow}>
                <Text style={[styles.userNameText, { color: theme.text }]}>
                  Emiliano Romero
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Administrador</Text>
                </View>
              </View>

              <Text style={[styles.userEmailText, { color: theme.textMuted }]}>
                Util Romero Containers · admin@utilromero.com
              </Text>
            </View>

            {/* Fila de Botones (Estilo Imagen 3: Close y Primary Action) */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: isDark ? '#242C37' : '#E2E8F0' },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                  Cerrar
                </Text>
              </Pressable>

              <Pressable style={styles.primaryBtn} onPress={handleLogout}>
                <Text style={styles.primaryBtnText}>Cerrar Sesión</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoSection: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleBadge: {
    backgroundColor: '#007AFF22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  userEmailText: {
    fontSize: 13,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
