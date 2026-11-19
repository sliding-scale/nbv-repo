import type { MapStyleElement } from 'react-native-maps';

/**
 * Calm Google Maps styles for the phone map: businesses and transit hidden, soft colours, so
 * the van stands out. (The web map uses a Map ID with Google's light/dark scheme instead.)
 */
const hide: MapStyleElement[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export const lightMapStyle: MapStyleElement[] = [
  ...hide,
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e8e8e8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e7f2' }] },
];

export const darkMapStyle: MapStyleElement[] = [
  ...hide,
  { elementType: 'geometry', stylers: [{ color: '#1d2430' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b95a7' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2430' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3344' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#343e52' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d485c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1622' }] },
];
