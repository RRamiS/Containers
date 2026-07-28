import type { MapMarker } from './types';

/** Centro por defecto: San Luis, Argentina */
export const DEFAULT_CENTER = { lat: -33.3017, lng: -66.3378 };
export const DEFAULT_ZOOM = 12;

export function buildLeafletHtml(options: {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  selected?: { lat: number; lng: number } | null;
  editable?: boolean;
  lockCenter?: boolean;
}): string {
  const center = options.center ?? DEFAULT_CENTER;
  const zoom = options.zoom ?? DEFAULT_ZOOM;
  const markers = options.markers ?? [];
  const editable = Boolean(options.editable);
  const lockCenter = options.lockCenter !== false;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    .leaflet-container { background: #e8eee9; }
    .status-pin {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const defaultCenter = [${DEFAULT_CENTER.lat}, ${DEFAULT_CENTER.lng}];
    const map = L.map('map').setView([${center.lat}, ${center.lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    function colorIcon(color, badgeText) {
      if (badgeText != null && badgeText !== '') {
        return L.divIcon({
          className: '',
          html: '<div style="background:' + (color || '#FFC107') + '; color: #000000; font-weight: bold; font-size: 11px; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">' + badgeText + '</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -14]
        });
      }
      return L.divIcon({
        className: '',
        html: '<div class="status-pin" style="background:' + (color || '#1565C0') + '"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10]
      });
    }

    const markers = ${JSON.stringify(markers)};
    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: colorIcon(m.color, m.badgeText) }).addTo(map);
      if (m.label) marker.bindPopup(m.label);
      if (markers.length === 1) {
        marker.openPopup();
      }
    });

    let selectedMarker = null;
    ${
      options.selected
        ? `selectedMarker = L.marker([${options.selected.lat}, ${options.selected.lng}], { icon: colorIcon('#0F3D2E') }).addTo(map);`
        : ''
    }

    function post(payload) {
      const data = JSON.stringify(payload);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(data);
      } else if (window.parent !== window) {
        window.parent.postMessage(data, '*');
      }
    }

    ${
      editable
        ? `
    map.on('click', async function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (selectedMarker) map.removeLayer(selectedMarker);
      selectedMarker = L.marker([lat, lng], { icon: colorIcon('#0F3D2E') }).addTo(map);
      let address = '';
      try {
        const res = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng, {
          headers: { 'Accept-Language': 'es' }
        });
        const json = await res.json();
        address = json.display_name || '';
      } catch (err) {}
      post({ type: 'select', lat, lng, address });
    });
    `
        : ''
    }

    ${
      lockCenter
        ? `map.setView(defaultCenter, ${zoom});`
        : `map.setView([${center.lat}, ${center.lng}], ${zoom});`
    }

    setTimeout(() => map.invalidateSize(), 200);
  </script>
</body>
</html>`;
}
