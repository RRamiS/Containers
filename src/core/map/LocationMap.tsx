import { useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { DEFAULT_CENTER, DEFAULT_ZOOM, buildLeafletHtml } from './leafletHtml';
import type { LocationMapProps, MapLocation } from './types';

export function LocationMap({
  height = 280,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  selected,
  editable = false,
  lockCenter = true,
  onSelect,
}: LocationMapProps) {
  const html = useMemo(
    () => buildLeafletHtml({ center, zoom, markers, selected, editable, lockCenter }),
    [center, zoom, markers, selected, editable, lockCenter],
  );

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleMessage = (raw: string) => {
    try {
      const data = JSON.parse(raw) as MapLocation & { type?: string };
      if (data.type === 'select' && onSelect) {
        onSelect({ lat: data.lat, lng: data.lng, address: data.address });
      }
    } catch {
      // ignore
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, { height: height as any }]}>
        <iframe
          ref={iframeRef}
          title="map"
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={() => {
            const listener = (event: MessageEvent) => {
              if (typeof event.data === 'string') handleMessage(event.data);
            };
            window.addEventListener('message', listener);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height: height as any }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={(event) => handleMessage(event.nativeEvent.data)}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D5DED9',
    backgroundColor: '#E8EEE9',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
