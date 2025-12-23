import { SnowAccumulation, ElementSurface, SnowfallSurface } from './types';
import {
    ATTR_SNOWFALL, VAL_IGNORE, VAL_TOP, VAL_BOTTOM,
    TAG_HEADER, TAG_FOOTER, ROLE_BANNER, ROLE_CONTENTINFO
} from './constants';

// Headers: snow accumulates on BOTTOM edge
// Footers: default to TOP surface (snow piles on top)
// Use data-snowfall attributes to override this behavior
const BOTTOM_TAGS = [TAG_HEADER];
const BOTTOM_ROLES = [ROLE_BANNER];

const AUTO_DETECT_TAGS = ['header', 'footer', 'article', 'section', 'aside', 'nav'];
const AUTO_DETECT_ROLES = ['[role="banner"]', '[role="contentinfo"]', '[role="main"]'];
const AUTO_DETECT_CLASSES = [
    '.card', '[class*="card"]', '[class*="Card"]',
    '[class*="bg-"]', '[class*="shadow-"]', '[class*="rounded-"]'
];

// Performance optimization: Cache computed styles to avoid repeated getComputedStyle calls
// Using Map instead of WeakMap to allow cache invalidation when styles change
// Cache is cleared on each surface scan to prevent stale data after dynamic changes
let styleCache = new Map<Element, CSSStyleDeclaration>();

const getCachedStyle = (el: Element): CSSStyleDeclaration => {
    let cached = styleCache.get(el);
    if (!cached) {
        cached = window.getComputedStyle(el);
        styleCache.set(el, cached);
    }
    return cached;
};

/**
 * Clear the computed style cache. Called before re-scanning surfaces
 * to ensure fresh style data after dynamic changes (e.g., CSS class changes, media queries).
 */
export const clearStyleCache = (): void => {
    styleCache.clear();
};

export const getElementType = (el: Element): SnowfallSurface => {
    const tagName = el.tagName.toLowerCase();
    if (BOTTOM_TAGS.includes(tagName)) return VAL_BOTTOM;

    const role = el.getAttribute('role');
    if (role && BOTTOM_ROLES.includes(role)) return VAL_BOTTOM;

    // Default: snow accumulates on top of elements (natural physics)
    return VAL_TOP;
};

const shouldAccumulate = (el: Element): boolean => {
    // Explicit opt-out
    if (el.getAttribute(ATTR_SNOWFALL) === VAL_IGNORE) return false;

    // Explicit opt-in
    if (el.hasAttribute(ATTR_SNOWFALL)) return true;

    // Heuristics
    const styles = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const isVisible = styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        parseFloat(styles.opacity) > 0.1;
    if (!isVisible) return false;

    // Check for visual prominence
    const bgColor = styles.backgroundColor;
    const hasBackground = bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
    const hasBorder = parseFloat(styles.borderWidth) > 0 || styles.borderStyle !== 'none';
    const hasBoxShadow = styles.boxShadow !== 'none';
    const hasBorderRadius = parseFloat(styles.borderRadius) > 0;

    return hasBackground || hasBorder || hasBoxShadow || hasBorderRadius;
};

export const getAccumulationSurfaces = (): { el: Element; type: SnowfallSurface; isFixed: boolean }[] => {
    // Clear style cache to ensure fresh computed styles after any dynamic changes
    clearStyleCache();

    const surfaces: { el: Element; type: SnowfallSurface; isFixed: boolean }[] = [];
    const seen = new Set<Element>();

    const candidates = document.querySelectorAll(
        [
            `[${ATTR_SNOWFALL}]`,
            ...AUTO_DETECT_TAGS,
            ...AUTO_DETECT_ROLES,
            ...AUTO_DETECT_CLASSES
        ].join(', ')
    );

    candidates.forEach(el => {
        if (seen.has(el)) return;

        // Manual override check first
        const manualOverride = el.getAttribute(ATTR_SNOWFALL);
        if (manualOverride === VAL_IGNORE) return;

        // If manually opted in, skip some heuristic checks but keep basic visibility/size sanity
        const isManuallyIncluded = manualOverride !== null;

        // OPTIMIZATION: Use cached styles and check visibility FIRST before expensive operations
        const styles = getCachedStyle(el);
        const isVisible = styles.display !== 'none' &&
            styles.visibility !== 'hidden' &&
            parseFloat(styles.opacity) > 0.1;

        if (!isVisible && !isManuallyIncluded) return;

        // Now get rect only if element is visible
        const rect = el.getBoundingClientRect();

        // Skip really small elements unless manually forced
        const hasSize = rect.width >= 100 && rect.height >= 50;
        if (!hasSize && !isManuallyIncluded) return;

        // HEURISTIC: Skip full-page wrappers
        const isFullPageWrapper = rect.top <= 10 && rect.height >= window.innerHeight * 0.9;

        const isBottomTag = BOTTOM_TAGS.includes(el.tagName.toLowerCase());
        const isBottomRole = BOTTOM_ROLES.includes(el.getAttribute('role') || '');
        const isBottomSurface = isBottomTag || isBottomRole ||
            manualOverride === VAL_BOTTOM;

        if (isFullPageWrapper && !isBottomSurface && !isManuallyIncluded) return;

        // OPTIMIZATION: Check position using cached styles
        let isFixed = false;
        let currentEl: Element | null = el;
        while (currentEl && currentEl !== document.body) {
            const style = getCachedStyle(currentEl);
            if (style.position === 'fixed' || style.position === 'sticky') {
                isFixed = true;
                break;
            }
            currentEl = currentEl.parentElement;
        }

        if (shouldAccumulate(el)) {
            // Determine type: manual override takes precedence
            let type: SnowfallSurface = getElementType(el);

            if (manualOverride === VAL_BOTTOM) {
                type = VAL_BOTTOM;
            } else if (manualOverride === VAL_TOP) {
                type = VAL_TOP;
            }

            surfaces.push({ el, type, isFixed });
            seen.add(el);
        }
    });

    console.log(`[Snowfall] Auto-detection found ${surfaces.length} surfaces`);
    console.log('[Snowfall] ✅ Using OPTIMIZED version with Map-based caching & 5s intervals');
    return surfaces;
};

export const getElementRects = (accumulationMap: Map<Element, SnowAccumulation>): ElementSurface[] => {
    const elementRects: ElementSurface[] = [];

    for (const [el, acc] of accumulationMap.entries()) {
        if (!el.isConnected) continue;
        const rect = el.getBoundingClientRect();
        // Convert viewport coordinates to absolute page coordinates
        const absoluteRect = {
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX,
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            width: rect.width,
            height: rect.height,
            x: rect.x, // Note: these are strictly viewport relative in DOMRect usually, 
            // but we just need consistent absolute coords for physics
            y: rect.y,
            toJSON: rect.toJSON
        };
        // We cast because we constructed a compatible object, though strictly DOMRect has readonly properties
        elementRects.push({ el, rect: absoluteRect as unknown as DOMRect, acc });
    }
    return elementRects;
};
