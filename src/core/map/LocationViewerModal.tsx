import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LocationMap } from './LocationMap';
import type { MapMarker } from './types';
import { useTheme } from '@/core/theme/ThemeContext';

export function LocationViewerModal({
  visible,
  clientName,
  address,
  lat,
  lng,
  markerColor = '#0084FF',
  onClose,
}: {
  visible: boolean;
  clientName: string;
  address: string;
  lat: number | null;
  lng: number | null;
  markerColor?: string;
  onClose: () => void;
}) {
  const { mode, theme } = useTheme();
  const isDark = mode === 'dark';

  if (!visible) return null;

  const validLat = lat ?? -33.3017;
  const validLng = lng ?? -66.3378;

  const markers: MapMarker[] = [
    {
      id: 'single-location-marker',
      lat: validLat,
      lng: validLng,
      label: `${clientName} · ${address || 'Sin dirección'}`,
      color: markerColor,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.surfaceBorder }]}>
          {/* Encabezado del Modal */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(0, 132, 255, 0.15)' }]}>
                <Feather name="map-pin" size={18} color="#0084FF" />
              </View>
              <View style={styles.headerTexts}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                  {clientName || 'Ubicación del Contenedor'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  Mapa Interactivo de Geolocalización
                </Text>
              </View>
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

          {/* Banner Infobar con Dirección Completa y Coordenadas */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? '#12161D' : '#F8FAFC', borderColor: theme.border }]}>
            <View style={styles.infoBannerRow}>
              <Feather name="navigation" size={14} color="#0084FF" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoBannerLabel, { color: theme.textMuted }]}>Dirección Completa:</Text>
                <Text style={[styles.infoBannerValue, { color: theme.text }]}>
                  {address || 'Sin dirección registrada'}
                </Text>
              </View>
            </View>

            <View style={[styles.infoBannerRow, { marginTop: 8 }]}>
              <Feather name="compass" size={14} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoBannerLabel, { color: theme.textMuted }]}>Coordenadas GPS:</Text>
                <Text style={[styles.infoBannerValue, { color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                  {lat != null && lng != null
                    ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                    : 'Ubicación aproximada en San Luis'}
                </Text>
              </View>
            </View>
          </View>

          {/* Mapa No Editable centrado exclusivamente en la ubicación exacta del contenedor */}
          <View style={styles.mapContainer}>
            <LocationMap
              height="100%"
              center={{ lat: validLat, lng: validLng }}
              zoom={15}
              lockCenter={false}
              markers={markers}
            />
          </View>

          {/* Pie del Modal */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Text style={[styles.footerCoordsText, { color: theme.textMuted }]}>
              San Luis, Argentina
            </Text>

            <Pressable style={styles.closePrimaryBtn} onPress={onClose}>
              <Text style={styles.closePrimaryBtnText}>Cerrar Mapa</Text>
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
    maxWidth: 620,
    height: 560,
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTexts: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBannerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBannerValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerCoordsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  closePrimaryBtn: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 12,
  },
  closePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
