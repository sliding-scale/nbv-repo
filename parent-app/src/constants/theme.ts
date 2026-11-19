// VanTrack colours, matching the admin dashboard (Tailwind blue-600 / slate palette).
export const palette = {
  light: {
    background: '#ffffff',
    surface: '#f1f5f9', // slate-100
    border: '#e2e8f0', // slate-200
    text: '#0f172a', // slate-900
    textMuted: '#64748b', // slate-500
    primary: '#2563eb', // blue-600
    primaryPressed: '#1d4ed8', // blue-700
    primarySoft: '#dbeafe', // blue-100
    onPrimary: '#ffffff',
    success: '#16a34a', // green-600
    successSoft: '#dcfce7', // green-100
    danger: '#dc2626', // red-600
    dangerSoft: '#fee2e2', // red-100
    stale: '#94a3b8', // slate-400: van location that hasn't been updated recently
    floating: '#ffffff', // pills and buttons floating over the map
    backdrop: 'rgba(15, 23, 42, 0.45)', // dims the map behind the settings sheet
  },
  dark: {
    background: '#0f172a', // slate-900
    surface: '#1e293b', // slate-800
    border: '#334155', // slate-700
    text: '#f8fafc', // slate-50
    textMuted: '#94a3b8', // slate-400
    primary: '#3b82f6', // blue-500
    primaryPressed: '#2563eb', // blue-600
    primarySoft: '#1e3a8a', // blue-900
    onPrimary: '#ffffff',
    success: '#22c55e', // green-500
    successSoft: '#14532d', // green-900
    danger: '#f87171', // red-400
    dangerSoft: '#450a0a', // red-950
    stale: '#64748b', // slate-500
    floating: '#1e293b', // slate-800
    backdrop: 'rgba(2, 6, 23, 0.6)',
  },
} as const;

export type ThemeColors = { [K in keyof typeof palette.light]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Soft drop shadow for controls floating over the map (iOS, Android and web). */
export const floatingShadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;
