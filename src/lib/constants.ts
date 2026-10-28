// Constantes de geometría y tiempos (handoff §B.7), derivadas de goey-toast

// Geometría de la píldora y del cuerpo (px)
export const PILL_HEIGHT = 34;
export const PILL_RADIUS = PILL_HEIGHT / 2;
export const NECK_CURVE_MAX = 14;
export const BODY_CORNER_MAX = 16;
export const PILL_THRESHOLD = 8;
// Padding horizontal total de la píldora (10 px por lado): ancho = cabecera + padding
export const PILL_PADDING_X = 20;

// Tiempos (ms)
export const EXPAND_DELAY_MS = 330;
export const MORPH_DURATION_MS = 900;
export const DISMISS_AFTER_COLLAPSE_MS = 800;
export const SUCCESS_LABEL_DISMISS_MS = 1200;
export const DEFAULT_DISPLAY_MS = 4000;
export const DEFAULT_DURATION_MS = 4000;
export const SQUISH_DEBOUNCE_MS = 300;
export const MOUNT_SQUISH_DELAY_MS = 45;
export const EXPAND_SQUISH_DELAY_MS = 80;
export const ANNOUNCER_CLEAR_MS = 7000;
export const ICON_SWAP_MS = 200;
export const FADE_MS = 350;
export const REMEASURE_MS = 100;
// Duración que sustituye a fundidos y cambios de icono con prefers-reduced-motion
export const REDUCED_MOTION_MS = 10;
// Sacudida de error (s, formato de motion)
export const SHAKE_DURATION_S = 0.4;

// Deslizamiento para descartar (px)
export const SWIPE_THRESHOLD_PX = 100;
// Zona muerta antes de empezar a seguir el dedo y distancia en la que la opacidad llega a 0
export const SWIPE_DEAD_ZONE_PX = 10;
export const SWIPE_FADE_DISTANCE_PX = 150;

// Curva de easing compartida por las transiciones tipo tween
export const SMOOTH_EASE: readonly [number, number, number, number] = [0.4, 0, 0.2, 1];
