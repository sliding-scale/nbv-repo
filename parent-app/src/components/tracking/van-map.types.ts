import type { LatLng, MapStop } from '@/lib/tracking';

export type VanMapProps = {
  /** The van's last reported position, or null while it isn't known. */
  van: LatLng | null;
  /** The child's pickup/drop-off points (may be empty). */
  stops: MapStop[];
  /** False until the first answer from the backend, so the map frames everything once it's known. */
  loaded: boolean;
  /** The last report isn't recent: draw the van grey. */
  stale: boolean;
  /** Keep the camera on the van as new positions arrive. */
  follow: boolean;
  /** The parent dragged the map: stop following until they tap re-centre. */
  onUserPan: () => void;
  /** Space taken by controls drawn over the map, so the van is centred in what's visible. */
  insets: { top: number; right: number; bottom: number; left: number };
};
