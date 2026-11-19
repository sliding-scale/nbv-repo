import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { DEFAULT_CENTER, distanceKm, FOLLOW_GLIDE_KM, GOOGLE_MAPS_API_KEY, type LatLng } from '@/lib/tracking';
import { darkMapStyle, lightMapStyle } from './map-style';
import { OsmVanMap } from './osm-van-map';
import { StopMarker } from './stop-marker';
import type { VanMapProps } from './van-map.types';
import { VanMarker } from './van-marker';

class MapCrash extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Roughly zoom 16: a few streets around the van.
const VAN_DELTA = 0.008;
const CITY_DELTA = 0.15;
// Extra room around everything when framing the van and the stops together.
const FRAME_PADDING = 56;

const region = ({ lat, lng }: LatLng, delta: number) => ({
  latitude: lat,
  longitude: lng,
  latitudeDelta: delta,
  longitudeDelta: delta,
});
const coord = ({ lat, lng }: LatLng) => ({ latitude: lat, longitude: lng });

// Google Maps on Android always; on iOS only when a key is built in (otherwise Apple Maps).
const provider = Platform.OS === 'android' || GOOGLE_MAPS_API_KEY ? PROVIDER_GOOGLE : undefined;

/**
 * Custom marker views are drawn as a snapshot. Redraw while one settles or its look changes
 * (colour, theme), then stop, so the map stays smooth.
 */
function useMarkerRedraw(look: string) {
  const [settled, setSettled] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setSettled(look), 600);
    return () => clearTimeout(id);
  }, [look]);
  return settled !== look;
}

/** Phone map (Android/iOS). The web version is van-map.web.tsx. */
function NativeMap({ van, stops, loaded, stale, follow, onUserPan, insets }: VanMapProps) {
  const scheme = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const redrawVan = useMarkerRedraw(`${stale}-${scheme}`);
  const redrawStops = useMarkerRedraw(`${scheme}-${stops.map((s) => s.label).join('|')}`);

  // Camera: once the first answer arrives, frame the van and the stops together. After that,
  // while following, keep the van centred at the parent's zoom; "re-centre" zooms back in on it.
  const framed = useRef(false);
  const lastVan = useRef<string | null>(null);
  const lastFollow = useRef(follow);
  const vanKey = van ? `${van.lat},${van.lng}` : null;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !loaded) return;

    if (!framed.current) {
      framed.current = true;
      lastVan.current = vanKey;
      lastFollow.current = follow;
      const points = [...(van ? [van] : []), ...stops];
      if (points.length === 1) map.animateToRegion(region(points[0], VAN_DELTA), 0);
      else if (points.length > 1) {
        map.fitToCoordinates(points.map(coord), {
          edgePadding: {
            top: insets.top + FRAME_PADDING,
            right: FRAME_PADDING,
            bottom: insets.bottom + FRAME_PADDING,
            left: FRAME_PADDING,
          },
          animated: false,
        });
      }
      return;
    }

    const recentred = follow && !lastFollow.current;
    const moved = vanKey !== lastVan.current;
    const previous = lastVan.current?.split(',').map(Number);
    const glide =
      van &&
      previous?.length === 2 &&
      Number.isFinite(previous[0]) &&
      Number.isFinite(previous[1]) &&
      distanceKm({ lat: previous[0], lng: previous[1] }, van) <= FOLLOW_GLIDE_KM;
    lastFollow.current = follow;
    lastVan.current = vanKey;
    if (!van || !follow) return;
    if (recentred) map.animateToRegion(region(van, VAN_DELTA), glide ? 500 : 0);
    else if (moved) map.animateCamera({ center: coord(van) }, { duration: glide ? 700 : 0 });
  }, [ready, loaded, vanKey, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={provider}
      initialRegion={region(DEFAULT_CENTER, CITY_DELTA)}
      onMapReady={() => setReady(true)}
      customMapStyle={provider ? (scheme === 'dark' ? darkMapStyle : lightMapStyle) : undefined}
      userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
      mapPadding={insets}
      onPanDrag={onUserPan}
      showsPointsOfInterests={false}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {stops.map((stop) => (
        <Marker
          key={stop.kind}
          coordinate={coord(stop)}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={redrawStops}
          tappable={false}
          zIndex={1}
        >
          <StopMarker stop={stop} />
        </Marker>
      ))}
      {van && (
        <Marker
          coordinate={coord(van)}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={redrawVan}
          tappable={false}
          zIndex={2}
        >
          <VanMarker stale={stale} />
        </Marker>
      )}
    </MapView>
  );
}

/** Google Maps on Android, Apple Maps on iPhone. OpenStreetMap only when Google cannot draw. */
export function VanMap(props: VanMapProps) {
  if (Platform.OS === 'android' && !GOOGLE_MAPS_API_KEY) return <OsmVanMap {...props} />;
  return (
    <MapCrash fallback={<OsmVanMap {...props} />}>
      <NativeMap {...props} />
    </MapCrash>
  );
}
