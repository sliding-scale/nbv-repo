import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APIProvider,
  ColorScheme,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import { DEFAULT_CENTER, distanceKm, FOLLOW_GLIDE_KM, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID, VAN_ZOOM } from '@/lib/tracking';
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

const FRAME_PADDING = 56;

/**
 * Camera: once the first answer arrives, frame the van and the stops together. After that,
 * while following, keep the van centred at the parent's zoom; "re-centre" zooms back in on it.
 */
function CameraController({ van, stops, loaded, follow, insets }: Omit<VanMapProps, 'stale' | 'onUserPan'>) {
  const map = useMap();
  const framed = useRef(false);
  const lastVan = useRef<string | null>(null);
  const lastFollow = useRef(follow);
  const vanKey = van ? `${van.lat},${van.lng}` : null;

  useEffect(() => {
    if (!map || !loaded) return;

    if (!framed.current) {
      framed.current = true;
      lastVan.current = vanKey;
      lastFollow.current = follow;
      const points = [...(van ? [van] : []), ...stops];
      if (points.length === 1) {
        map.setCenter(points[0]);
        map.setZoom(VAN_ZOOM);
      } else if (points.length > 1) {
        const lats = points.map((p) => p.lat);
        const lngs = points.map((p) => p.lng);
        const bounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs),
        };
        // Leave room for the controls drawn over the map.
        map.fitBounds(bounds, {
          top: insets.top + FRAME_PADDING,
          right: insets.right + FRAME_PADDING,
          bottom: insets.bottom + FRAME_PADDING,
          left: insets.left + FRAME_PADDING,
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
    if (recentred || moved) {
      if (glide) map.panTo(van);
      else map.setCenter(van);
    }
    if (recentred && (map.getZoom() ?? 0) < VAN_ZOOM) map.setZoom(VAN_ZOOM);
  }, [map, loaded, vanKey, follow]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Web version of the van map. Google Maps first, OpenStreetMap when Google cannot draw. */
export function VanMap(props: VanMapProps) {
  const scheme = useColorScheme();
  const [failed, setFailed] = useState(!GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return undefined;
    const page = window as Window & { gm_authFailure?: () => void };
    const previous = page.gm_authFailure;
    page.gm_authFailure = () => {
      setFailed(true);
      previous?.();
    };
    return () => {
      page.gm_authFailure = previous;
    };
  }, []);

  if (failed) return <OsmVanMap {...props} />;

  return (
    <View style={StyleSheet.absoluteFill}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onError={() => setFailed(true)}>
        <MapCrash fallback={<OsmVanMap {...props} />}>
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          colorScheme={scheme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          onDragstart={props.onUserPan}
          style={{ width: '100%', height: '100%' }}
        >
          {props.stops.map((stop) => (
            <AdvancedMarker
              key={stop.kind}
              position={stop}
              anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM_CENTER}
              clickable={false}
              zIndex={1}
            >
              <StopMarker stop={stop} />
            </AdvancedMarker>
          ))}
          {props.van && (
            <AdvancedMarker position={props.van} anchorPoint={AdvancedMarkerAnchorPoint.CENTER} clickable={false} zIndex={2}>
              <VanMarker stale={props.stale} pulse />
            </AdvancedMarker>
          )}
          <CameraController van={props.van} stops={props.stops} loaded={props.loaded} follow={props.follow} insets={props.insets} />
        </Map>
        </MapCrash>
      </APIProvider>
    </View>
  );
}
