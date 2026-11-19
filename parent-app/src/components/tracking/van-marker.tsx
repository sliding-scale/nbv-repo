import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Grey instead of blue: the last report isn't recent. */
  stale: boolean;
  /**
   * Pulse the halo. On Android/iOS, map markers are drawn as snapshots, so the native map
   * passes false and shows a still halo; the web map animates it.
   */
  pulse?: boolean;
};

export const VAN_MARKER_SIZE = 64;

/** The van on the map: a round badge with a van icon, inside a soft halo. */
export function VanMarker({ stale, pulse = false }: Props) {
  const colors = useTheme();
  const color = stale ? colors.stale : colors.primary;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!pulse || stale) return;
    progress.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse, stale, progress]);

  const haloStyle = useAnimatedStyle(() =>
    pulse && !stale
      ? { transform: [{ scale: 0.55 + progress.value * 0.45 }], opacity: 0.45 * (1 - progress.value) + 0.1 }
      : { transform: [{ scale: 1 }], opacity: 0.22 },
  );

  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLabel="Your child's van">
      <Animated.View style={[styles.halo, { backgroundColor: color }, haloStyle]} />
      <View style={[styles.badge, { backgroundColor: color, borderColor: colors.floating }]}>
        <Ionicons name="bus" size={18} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: VAN_MARKER_SIZE, height: VAN_MARKER_SIZE, alignItems: 'center', justifyContent: 'center' },
  halo: { ...StyleSheet.absoluteFill, borderRadius: VAN_MARKER_SIZE / 2 },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
});
