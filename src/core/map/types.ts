export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  badgeText?: string;
};

export type MapLocation = {
  lat: number;
  lng: number;
  address?: string;
};

export type LocationMapProps = {
  height?: number | string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  selected?: MapLocation | null;
  editable?: boolean;
  /** Si es true (default en overview), fuerza centro San Luis */
  lockCenter?: boolean;
  onSelect?: (location: MapLocation) => void;
};
