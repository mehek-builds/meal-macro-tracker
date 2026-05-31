// ============================================================
// "Nourish" design tokens - single source of color, spacing,
// type, and shape. No component may contain a raw hex value;
// every color references tokens.* (PRD Section 3.1 / 21.3).
// ============================================================

export const tokens = {
  // --- Surfaces (warm, not gray) ---
  bg:          '#FBF7F1', // warm off-white app background
  surface:     '#FFFFFF', // cards
  surfaceWarm: '#F4E4D4', // luteal badge, subtle warm fills

  // --- Ink ---
  ink:         '#2B2622', // primary text (warm near-black)
  inkMuted:    '#8A7E72', // secondary text (>=13pt only)
  inkFaint:    '#B0A496', // tertiary / captions

  // --- Brand accent ---
  accent:      '#C2410C', // terracotta - FAB, active tab, primary actions, ring number
  accentSoft:  '#F4E4D4', // accent tint backgrounds

  // --- Semantic STATE colors (the inverted ring logic) ---
  stateUnder:  '#DC2626', // red - significantly under target (eat more!)
  stateClose:  '#EAB308', // amber - getting close
  stateOnTrack:'#22C55E', // green - on track
  stateHit:    '#3B82F6', // blue - target hit / surplus achieved (the only blue, = success)

  // --- Cycle ---
  luteal:      '#BE185D', // luteal phase accent
  lutealBg:    '#FDF2F8',

  // --- Lines ---
  border:      '#EDE3D7',
  track:       '#EBE1D5', // empty progress track

  // --- Camera viewport (intentionally dark - a viewfinder should be dark) ---
  cameraBg:       '#000000',
  cameraInk:      '#FFFFFF',
  cameraInkMuted: '#A8A29E',
} as const;

export const space = { xs: 4, sm: 8, md: 14, lg: 20, xl: 26, xxl: 32 } as const;

export const radius = { chip: 12, card: 16, fab: 19, badge: 20 } as const;

export const font = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'HankenGrotesk_500Medium',
  bodyBold: 'HankenGrotesk_700Bold',
  numeric: 'SpaceGrotesk_500Medium',
} as const;

export const type = {
  ringNumber: 58, screenTitle: 26, statValue: 17, sectionTitle: 20,
  body: 14, label: 12.5, caption: 11,
} as const;

export const shadow = {
  card: {
    shadowColor: '#785A3C', shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
} as const;
