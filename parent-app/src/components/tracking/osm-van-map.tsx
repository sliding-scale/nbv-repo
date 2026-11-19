import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VanMapProps } from './van-map.types';
import { OSM_MAP_HTML } from './osm-map-html';

/** Leaflet map inside a web view. Used on Android when Google Maps is unavailable. */
export function OsmVanMap({ van, stops, loaded, stale, follow, onUserPan }: VanMapProps) {
  const webRef = useRef<WebView>(null);
  const payload = useMemo(
    () => JSON.stringify({ van, stops, loaded, stale, follow }),
    [van, stops, loaded, stale, follow],
  );

  useEffect(() => {
    webRef.current?.postMessage(payload);
  }, [payload]);

  return (
    <WebView
      ref={webRef}
      style={StyleSheet.absoluteFill}
      originWhitelist={['*']}
      source={{ html: OSM_MAP_HTML }}
      onLoad={() => webRef.current?.postMessage(payload)}
      onMessage={(event) => {
        if (event.nativeEvent.data === 'pan') onUserPan();
      }}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
    />
  );
}
