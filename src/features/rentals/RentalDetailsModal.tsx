import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { industry } from '@/config/industry';
import type { RentalWithRelations } from '@/data/types';
import { useTheme } from '@/core/theme/ThemeContext';

export function RentalDetailsModal({
  visible,
  rental,
  formattedId,
  onClose,
  onEdit,
}: {
  visible: boolean;
  rental: RentalWithRelations | null;
  formattedId: string;
  onClose: () => void;
  onEdit?: (rental: RentalWithRelations) => void;
}) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  if (!rental) return null;

  const isPaid = rental.payment_status === 'realizado';
  const st = industry.rentalStatuses.find((s) => s.value === rental.status);
  const statusColor =
    rental.status === 'activo'
      ? '#16A34A'
      : rental.status === 'en_proceso'
        ? '#0EA5E9'
        : '#64748B';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Header del Modal */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.idBadgeContainer}>
                <Text style={styles.idBadgeText}>{formattedId}</Text>
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                {rental.client_name}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: pressed ? (isDark ? '#262D37' : '#E2E8F0') : (isDark ? '#1C2128' : '#F1F5F9') },
              ]}
              onPress={onClose}
            >
              <Feather name="x" size={18} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Contenido del Modal */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Badges de Estado Operativo y Cobro */}
            <View style={styles.badgesRow}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {st?.label ?? rental.status}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isPaid ? 'rgba(22, 163, 74, 0.18)' : 'rgba(245, 158, 11, 0.18)' },
                ]}
              >
                <Feather
                  name={isPaid ? 'check-circle' : 'clock'}
                  size={12}
                  color={isPaid ? '#16A34A' : '#F59E0B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.statusBadgeText, { color: isPaid ? '#16A34A' : '#F59E0B' }]}>
                  {isPaid ? 'Cobro Realizado' : 'Cobro Pendiente'}
                </Text>
              </View>
            </View>

            {/* Grid de Secciones Informativas */}
            <View style={styles.infoSection}>
              {/* Sección 1: Ubicación */}
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.border }]}>
                <View style={styles.infoCardHeader}>
                  <Feather name="map-pin" size={16} color="#0084FF" style={{ marginRight: 8 }} />
                  <Text style={[styles.infoCardTitle, { color: theme.text }]}>Ubicación y Dirección</Text>
                </View>
                <Text style={[styles.infoCardValue, { color: theme.text }]}>
                  {rental.address || 'Sin dirección registrada'}
                </Text>
                {rental.lat != null && rental.lng != null ? (
                  <Text style={[styles.infoCardSubvalue, { color: theme.textMuted }]}>
                    Coordenadas: {rental.lat.toFixed(4)}, {rental.lng.toFixed(4)}
                  </Text>
                ) : null}
              </View>

              {/* Sección 2: Fechas y Período */}
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.border }]}>
                <View style={styles.infoCardHeader}>
                  <Feather name="calendar" size={16} color="#7C3AED" style={{ marginRight: 8 }} />
                  <Text style={[styles.infoCardTitle, { color: theme.text }]}>Fechas de Alquiler</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Inicio / Entrega:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{rental.start_date || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Duración estimada:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{rental.rental_days} días</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Fecha de Fin:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{rental.end_date || '-'}</Text>
                </View>
              </View>

              {/* Sección 3: Choferes asignados */}
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.border }]}>
                <View style={styles.infoCardHeader}>
                  <Feather name="truck" size={16} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={[styles.infoCardTitle, { color: theme.text }]}>Operadores Asignados</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Chofer Entrega:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {rental.delivery_operator?.full_name || 'No asignado'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Chofer Retiro:</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {rental.pickup_operator?.full_name || 'No asignado'}
                  </Text>
                </View>
              </View>

              {/* Sección 4: Importes y Comprobante */}
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#161B22' : '#F8FAFC', borderColor: theme.border }]}>
                <View style={styles.infoCardHeader}>
                  <Feather name="dollar-sign" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                  <Text style={[styles.infoCardTitle, { color: theme.text }]}>Importes de Operación</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Monto Total:</Text>
                  <Text style={[styles.detailValue, { color: '#16A34A', fontWeight: '800' }]}>
                    ${rental.amount != null ? rental.amount.toLocaleString() : '0'}
                  </Text>
                </View>

                {rental.receipt_uri ? (
                  <View style={styles.receiptContainer}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted, marginBottom: 6 }]}>
                      Comprobante de Recibo:
                    </Text>
                    {rental.receipt_uri.startsWith('data:image') ||
                    rental.receipt_uri.startsWith('http') ||
                    rental.receipt_uri.startsWith('file') ? (
                      <Image source={{ uri: rental.receipt_uri }} style={styles.receiptPreviewImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.receiptFileBadge}>
                        <Feather name="paperclip" size={14} color="#0084FF" style={{ marginRight: 6 }} />
                        <Text style={styles.receiptFileName}>{rental.receipt_name || 'Comprobante adjunto'}</Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* Footer de Acciones del Modal */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            {onEdit ? (
              <Pressable
                style={[styles.editBtn, { backgroundColor: isDark ? '#262D37' : '#E2E8F0' }]}
                onPress={() => {
                  onClose();
                  onEdit(rental);
                }}
              >
                <Feather name="edit-2" size={15} color={theme.text} style={{ marginRight: 6 }} />
                <Text style={[styles.editBtnText, { color: theme.text }]}>Editar Operación</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.closePrimaryBtn} onPress={onClose}>
              <Text style={styles.closePrimaryBtnText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  idBadgeContainer: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  idBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCardSubvalue: {
    fontSize: 12,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  receiptContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  receiptPreviewImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 6,
  },
  receiptFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  receiptFileName: {
    color: '#0084FF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closePrimaryBtn: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  closePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
