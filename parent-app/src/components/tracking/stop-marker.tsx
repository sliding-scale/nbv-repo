import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import type { MapStop } from '@/lib/tracking';

export const STOP_ICON: Record<MapStop['kind'], keyof typeof Ionicons.glyphMap> = {
  pickup: 'school',
  dropoff: 'location',
};

const DEFAULT_LABEL: Record<MapStop['kind'], string> = { pickup: 'Pickup', dropoff: 'Drop-off' };

/** Name shown above the stop: the school's label for it ("Home", "Gate 2"), else Pickup / Drop-off. */
export const stopLabel = (stop: MapStop) => stop.label.trim() || DEFAULT_LABEL[stop.kind];

/**
 * A pickup or drop-off point: a small name tag above a round icon (school for pickup, pin for
 * drop-off). Anchored at the bottom centre, so the icon's base sits on the spot.
 */
export function StopMarker({ stop }: { stop: MapStop }) {
  const colors = useTheme();
  const color = stop.kind === 'pickup' ? colors.primary : colors.success;
  return (
    <View
      style={styles.wrap}
      pointerEvents="none"
      accessibilityLabel={`${stop.kind === 'pickup' ? 'Pickup' : 'Drop-off'}: ${stopLabel(stop)}`}
    >
      <View style={[styles.tag, { backgroundColor: colors.floating, borderColor: colors.border }]}>
        <Text style={[styles.tagText, { color: colors.text }]} numberOfLines={1}>
          {stopLabel(stop)}
        </Text>
      </View>
      <View style={[styles.icon, { backgroundColor: color, borderColor: colors.floating }]}>
        <Ionicons name={STOP_ICON[stop.kind]} size={15} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fixed width so native map snapshots never clip the tag; the content is centred inside.
  wrap: { width: 140, alignItems: 'center', gap: 4, paddingBottom: 2 },
  tag: {
    maxWidth: 136,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
