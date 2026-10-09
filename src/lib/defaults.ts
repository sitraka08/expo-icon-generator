import type { Project, Ui } from './types';

export const defaultProject = (): Project => ({
  project: { name: 'my-expo-app', sdk: '54' },
  icon: { image: null, scale: 100, x: 0, y: 0, bg: '#FFFFFF', darkEnabled: false, darkBg: '#111111' },
  adaptive: {
    fg: { image: null, scale: 61, x: 0, y: 0 },
    bgMode: 'color', bgColor: '#FFCD00', bgImage: null,
    mono: { enabled: false, source: 'foreground', image: null },
  },
  splash: { image: null, size: 40, x: 0, y: 0, bg: '#FFFFFF', resizeMode: 'contain', darkEnabled: false, darkBg: '#0F0F0E' },
  paths: {},
});

export const defaultUi = (): Ui => ({
  asset: 'icon', platform: 'android', appearance: 'light', view: 'preview', mask: 'circle',
  adaptiveMode: 'masks', safe: true, zoom: 'fit', mobile: 'config', configScope: 'fragment', configOnly: 'all',
});
