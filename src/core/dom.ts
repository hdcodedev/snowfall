import { SnowAccumulation, ElementSurface, SnowfallSurface } from './types';

export type { ElementSurface };
import {
    ATTR_SNOWFALL, VAL_IGNORE, VAL_TOP, VAL_BOTTOM,
    TAG_HEADER, TAG_FOOTER, ROLE_BANNER, ROLE_CONTENTINFO
} from './constants';

// Headers: snow accumulates on BOTTOM edge
// Footers: default to TOP surface (snow piles on top)
// Use data-snowfall attributes to override this behavior
const BOTTOM_TAGS = [TAG_HEADER];
const BOTTOM_ROLES = [ROLE_BANNER];

const AUTO_DETECT_TAGS = [TAG_HEADER, TAG_FOOTER, 'article', 'section', 'aside', 'nav'];
const AUTO_DETECT_ROLES = [`[role="${ROLE_BANNER}"]`, `[role="${ROLE_CONTENTINFO}"]`, '[role="main"]'];
const AUTO_DETECT_CLASSES = [
    '.card', '[class*="card"]', '[class*="Card"]',
    '[class*="bg-"]', '[class*="shadow-"]', '[class*="rounded-"]'
];

// Helper to get element type (Top vs Bottom surface) based on tags/roles
// This is used to determine if snow should sit ON TOP or hang from the BOTTOM.

export const getElementType = (el: Element): SnowfallSurface => {
    const tagName = el.tagName.toLowerCase();
    if (BOTTOM_TAGS.includes(tagName)) return VAL_BOTTOM;

    const role = el.getAttribute('role');
    if (role && BOTTOM_ROLES.includes(role)) return VAL_BOTTOM;

    // Default: snow accumulates on top of elements (natural physics)
    return VAL_TOP;
};

const shouldAccumulate = (el: Element, precomputedStyle?: CSSStyleDeclaration): boolean => {
    if (el.getAttribute(ATTR_SNOWFALL) === VAL_IGNORE) return false;
    // Explicit opt-in
    if (el.hasAttribute(ATTR_SNOWFALL)) return true;

    const styles = precomputedStyle || window.getComputedStyle(el);
    const isVisible = styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        parseFloat(styles.opacity) > 0.1;
    if (!isVisible) return false;

    // Check for visual prominence
    const bgColor = styles.backgroundColor;
    const hasBackground = bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
    const hasBorder = (parseFloat(styles.borderWidth) > 0 && styles.borderColor !== 'transparent' && styles.borderColor !== 'rgba(0, 0, 0, 0)') && styles.borderStyle !== 'none';
    const hasBoxShadow = styles.boxShadow !== 'none';
    const hasFilter = styles.filter !== 'none' && styles.filter.includes('drop-shadow');
    const hasBackdropFilter = styles.backdropFilter !== 'none';

    return hasBackground || hasBorder || hasBoxShadow || hasFilter || hasBackdropFilter;
};

export const getAccumulationSurfaces = (maxSurfaces: number = 5): { el: Element; type: SnowfallSurface }[] => {
    // No explicit clearing needed as we don't cache styles persistently anymore.
    const surfaces: { el: Element; type: SnowfallSurface }[] = [];
    const seen = new Set<Element>();

    const candidates = document.querySelectorAll(
        [
            `[${ATTR_SNOWFALL}]`,
            ...AUTO_DETECT_TAGS,
            ...AUTO_DETECT_ROLES,
            ...AUTO_DETECT_CLASSES
        ].join(', ')
    );

    for (const el of candidates) {
        if (surfaces.length >= maxSurfaces) break;
        if (seen.has(el)) continue;

        // Manual override check first
        const manualOverride = el.getAttribute(ATTR_SNOWFALL);
        if (manualOverride === VAL_IGNORE) continue;

        // If manually opted in, skip some heuristic checks but keep basic visibility/size sanity
        const isManuallyIncluded = manualOverride !== null;
        const styles = window.getComputedStyle(el);

        // Visibility Check: Must be visible and opaque enough
        const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0.1;

        if (!isVisible && !isManuallyIncluded) continue;

        const rect = el.getBoundingClientRect();
        const hasSize = rect.width >= 100 && rect.height >= 50;
        if (!hasSize && !isManuallyIncluded) continue;

        const isFullPageWrapper = rect.top <= 10 && rect.height >= window.innerHeight * 0.9;
        const isBottomTag = BOTTOM_TAGS.includes(el.tagName.toLowerCase());
        const isBottomRole = BOTTOM_ROLES.includes(el.getAttribute('role') || '');
        const isBottomSurface = isBottomTag || isBottomRole || manualOverride === VAL_BOTTOM;

        if (isFullPageWrapper && !isBottomSurface && !isManuallyIncluded) continue;

        if (shouldAccumulate(el, styles)) {
            let type: SnowfallSurface = getElementType(el);
            if (manualOverride === VAL_BOTTOM) type = VAL_BOTTOM;
            else if (manualOverride === VAL_TOP) type = VAL_TOP;

            surfaces.push({ el, type });
            seen.add(el);
        }
    }

    return surfaces;
};

export const getElementRects = (accumulationMap: Map<Element, SnowAccumulation>): ElementSurface[] => {
    const elementRects: ElementSurface[] = [];
    for (const [el, acc] of accumulationMap.entries()) {
        if (!el.isConnected) continue;
        // PURE VIEWPORT RECT. No scroll math.
        const rect = el.getBoundingClientRect();
        elementRects.push({ el, rect, acc });
    }
    return elementRects;
};
