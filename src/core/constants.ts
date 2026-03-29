export const ATTR_SNOWFALL = 'data-snowfall';

export const VAL_IGNORE = 'ignore';
export const VAL_TOP = 'top';
export const VAL_BOTTOM = 'bottom';

export const TAG_HEADER = 'header';
export const TAG_FOOTER = 'footer';

export const ROLE_BANNER = 'banner';
export const ROLE_CONTENTINFO = 'contentinfo';

// Mathematical constants
export const TAU = Math.PI * 2; // Full circle in radians

// Accumulation bucket size in pixels — reduces per-pixel array iterations.
// Each bucket represents BUCKET_SIZE screen pixels. Drawing interpolates between buckets.
export const BUCKET_SIZE = 4;
