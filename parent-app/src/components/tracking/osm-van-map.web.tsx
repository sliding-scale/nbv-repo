import { createElement, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { VanMapProps } from './van-map.types';
import { OSM_MAP_HTML } from './osm-map-html';

/** OpenStreetMap van map for the parent website, used when Google Maps cannot draw. */
export function OsmVanMap({ van, stops, loaded, stale, follow, onUserPan }: VanMapProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const payload = useMemo(
    () => JSON.stringify({ van, stops, loaded, stale, follow }),
    [van, stops, loaded, stale, follow],
  );

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(payload, '*');
  }, [payload]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data === 'pan') onUserPan();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onUserPan]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {createElement('iframe', {
        ref: frameRef,
        title: 'Van map',
        srcDoc: OSM_MAP_HTML,
        onLoad: () => frameRef.current?.contentWindow?.postMessage(payload, '*'),
        style: { border: 0, width: '100%', height: '100%', background: '#f1f5f9' },
      })}
    </View>
  );
}
