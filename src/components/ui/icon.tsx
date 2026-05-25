import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  icon: string;
  size?: number;
}

export function Icon({ icon, size = 18, className, ...props }: IconProps) {
  const IconSvg = ICON_MAP[icon] ?? ICON_MAP.circle;
  return <IconSvg width={size} height={size} className={className} aria-hidden="true" {...props} />;
}
Icon.displayName = 'Icon';

type IconComponent = (props: SVGProps<SVGSVGElement>) => JSX.Element;

function Svg(children: string): IconComponent {
  const Cmp = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={children} />
    </svg>
  );
  Cmp.displayName = 'SvgIcon';
  return Cmp;
}

const ICON_MAP: Record<string, IconComponent> = {
  circle: Svg('M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'),

  // Core admin
  settings: Svg('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'),
  user: Svg('M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z'),
  users: Svg('M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z'),
  shield: Svg('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
  lock: Svg('M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'),
  menu: Svg('M4 6h16M4 12h16M4 18h16'),
  folder: Svg('M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'),

  // Content
  'file-text': Svg('M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM16 2v6h6M16 13H8M16 17H8M10 9H8'),
  home: Svg('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z'),
  bell: Svg('M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0'),
  'help-circle': Svg('M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z'),

  // Ecommerce
  package: Svg('M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12'),
  'folder-tree': Svg('M13 10h3a3 3 0 013 3v5M13 10V4a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h4m8-5v5a3 3 0 01-3 3H9m0 0h1a3 3 0 013 3v1'),
  building: Svg('M3 21h18M3 7v14M21 7v14M6 11h2M10 11h2M14 11h2M6 15h2M10 15h2M14 15h2M6 19h2M10 19h2M14 19h2M9 3h6l2 4H7l2-4z'),
  palette: Svg('M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.16-.61-1.59-.38-.44-.61-1.01-.61-1.66 0-1.38 1.12-2.5 2.5-2.5H18c3.31 0 6-2.69 6-6 0-5.51-4.49-10-10-10zM6.5 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3-5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm3 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'),
  'shield-check': Svg('M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'),
  store: Svg('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 21V12h6v9'),
  percent: Svg('M19 5L5 19M5 5l14 14'),
  filter: Svg('M22 3H2l8 9.46V19l4 2v-8.54L22 3z'),
  truck: Svg('M1 17h2M3 17a3 3 0 106 0M9 17a3 3 0 106 0M15 17h2M13 3H1v11h16V5a2 2 0 00-2-2zM1 9h4m-4 4h12'),
  layers: Svg('M2 12l10-5 10 5-10 5-10-5zM2 17l10-5 10 5-10 5-10-5z'),
  layout: Svg('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10'),

  // Orders & Shipping
  'map-pin': Svg('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z'),
  clock: Svg('M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM13 6h-2v7h6v-2h-4V6z'),
  'shopping-cart': Svg('M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0'),
  'x-circle': Svg('M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM8 8l8 8M8 16l8-8'),

  // Finance
  'credit-card': Svg('M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2zM1 10h20M4 16h2m4 0h2'),
  'dollar-sign': Svg('M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'),

  // Reports
  'bar-chart': Svg('M12 20V10M18 20V4M6 20v-4'),
  'trending-up': Svg('M23 6l-9.5 9.5-5-5L1 18M17 6h6v6'),
  activity: Svg('M22 12h-4l-3 9L9 3l-3 9H2'),
  box: Svg('M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM12 22V12'),
  'message-square': Svg('M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'),
  'message-circle': Svg('M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z'),

  // Cafe & Restaurant
  coffee: Svg('M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm6-6v3m4-3v3'),
  list: Svg('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
  camera: Svg('M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l1.59-1.59A2 2 0 0110.17 4h3.66a2 2 0 011.41.59L17 6h4a2 2 0 012 2v11zM12 17a4 4 0 100-8 4 4 0 000 8z'),
  calendar: Svg('M3 7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM16 3v4M8 3v4m-5 4h18'),

  // Operations
  inbox: Svg('M22 12h-5.2a3 3 0 01-2.8-2 3 3 0 00-5.6 0 3 3 0 01-2.8 2H2M2 12l2.4-7.6A2 2 0 016.3 3h11.4a2 2 0 011.9 1.4L22 12M2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6'),
  wrench: Svg('M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z'),
  search: Svg('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'),
  eye: Svg('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z'),
  clipboard: Svg('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'),

  // Tag / Discount
  tag: Svg('M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01'),

  // Award / Reward
  award: Svg('M12 15l-2 5 2-1 2 1-2-5zM12 2a7 7 0 100 14 7 7 0 000-14z'),

  // File operations
  'file-plus': Svg('M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 18v-6M9 15h6'),

  // Upload
  upload: Svg('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12'),

  // Zootag specific
  cpu: Svg('M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 4h16M4 14h16M8 2v2M16 2v2M8 20v2M16 20v2'),
  'file-contract': Svg('M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8'),
  'paw-print': Svg('M14 11a4 4 0 118 0 4 4 0 01-8 0zM2 11a4 4 0 118 0 4 4 0 01-8 0zM8 20a4 4 0 118 0H8zM6 15a3 3 0 116 0H6zM12 15a3 3 0 116 0h-6z'),
  dna: Svg('M8 3h8M8 21h8M12 3v18M8 7.5h8M8 16.5h8M8 12h8'),
  database: Svg('M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3'),
};
