import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { ParentError } from '@/components/parent-error';
import { ScreenLoader } from '@/components/screen-loader';
import { LastReportPill, MapIconButton, StatusCard } from '@/components/tracking/map-controls';
import { VanMap } from '@/components/tracking/van-map';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { formatReportTime, isStale, stopsForMap, useNow, type VanState } from '@/lib/tracking';

type Ionicon = ComponentProps<typeof Ionicons>['name'];

/** What to show instead of the van when its location can't be shown. */
const STATUS: Record<Exclude<VanState['state'], 'live'>, { icon: Ionicon; title: string; message: string }> = {
  no_child: {
    icon: 'people-outline',
    title: 'No child linked yet',
    message: "Your child's school hasn't linked your child to your account yet. Please contact the school.",
  },
  no_van: {
    icon: 'bus-outline',
    title: 'No van assigned yet',
    message: "Your child doesn't have a school van assigned yet. Please contact the school.",
  },
  tracking_off: {
    icon: 'eye-off-outline',
    title: 'Live location is turned off',
    message: "Your child's school has turned off live tracking for now. Please contact the school if you need it.",
  },
  outside_hours: {
    icon: 'time-outline',
    title: 'Tracking is outside school hours',
    message: "Live tracking is available during the school's pickup and drop-off times.",
  },
  out_of_service: {
    icon: 'construct-outline',
    title: 'Van not in service',
    message: "Your child's van is marked out of service right now. Please contact the school.",
  },
  no_location: {
    icon: 'time-outline',
    title: "Waiting for the van's location",
    message: "The van's location will appear here as soon as it reports.",
  },
};

const PILL_ROW_HEIGHT = 44;

function goHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/home');
}

/**
 * Full-screen map of the parent's child's van. Opened from the home tile.
 * Shows only where the van is and its Last Reporting time.
 */
export default function TrackScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const data = useQuery(api.parent.tracking.myVan);
  const van = data?.van;
  const stops = stopsForMap(data?.stops);
  const now = useNow();
  const [follow, setFollow] = useState(true);

  const live = van?.state === 'live' ? van : null;
  const stale = live ? isStale(live.reportedAt, now) : false;
  const status = van === undefined ? null : van.state === 'live' ? null : STATUS[van.state];

  const top = insets.top + spacing.md;
  const bottom = Math.max(insets.bottom, spacing.lg);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <VanMap
        van={live ? { lat: live.lat, lng: live.lng } : null}
        stops={stops}
        loaded={data !== undefined}
        stale={stale}
        follow={follow}
        onUserPan={() => setFollow(false)}
        insets={{ top: top + PILL_ROW_HEIGHT, right: 0, bottom: status ? 140 : bottom, left: 0 }}
      />

      <View style={[styles.topRow, { top, zIndex: 3 }]} pointerEvents="box-none">
        <MapIconButton icon="chevron-back" label="Back to home" onPress={goHome} />
        <View style={styles.pillSlot} pointerEvents="box-none">
          {live && (
            <Animated.View entering={FadeInDown.duration(400)} exiting={FadeOut}>
              <LastReportPill time={formatReportTime(live.reportedAt, now)} stale={stale} />
            </Animated.View>
          )}
        </View>
      </View>

      {van === undefined && (
        <View style={styles.loadingCover}>
          <ScreenLoader label="Opening the map…" />
        </View>
      )}

      <View style={[styles.bottom, { bottom: bottom + spacing.sm }]} pointerEvents="box-none">
        {live && !follow && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.recenter}>
            <MapIconButton icon="locate" label="Show the van" onPress={() => setFollow(true)} />
          </Animated.View>
        )}
        {status && (
          <Animated.View key={van?.state} entering={FadeInDown.duration(400)}>
            <StatusCard icon={status.icon} title={status.title} message={status.message} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ParentError retry={retry} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pillSlot: { flex: 1, alignItems: 'flex-start' },
  bottom: { position: 'absolute', left: spacing.lg, right: spacing.lg, gap: spacing.md },
  loadingCover: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  recenter: { alignSelf: 'flex-end' },
});
