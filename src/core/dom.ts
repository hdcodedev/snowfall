import { PileType } from './piles';
import {
    ATTR_SNOWFALL, VAL_IGNORE, VAL_TOP, VAL_BOTTOM,
    TAG_HEADER, TAG_FOOTER, ROLE_BANNER, ROLE_CONTENTINFO
} from './constants';

// Headers: snow hangs from the BOTTOM edge. Everything else: snow piles on TOP.
// Use data-snowfall attributes to override this behavior.
const BOTTOM_TAGS = [TAG_HEADER];
const BOTTOM_ROLES = [ROLE_BANNER];

// Only semantic landmarks are auto-detected. Class-name heuristics (e.g. Tailwind's
// "bg-*") matched nearly every element on utility-CSS sites, which made the choice
// of surfaces arbitrary and forced a style recalc for each candidate.
const AUTO_DETECT_SELECTORS = [
    TAG_HEADER, TAG_FOOTER, 'article', 'aside', 'nav',
    `[role="${ROLE_BANNER}"]`, `[role="${ROLE_CONTENTINFO}"]`,
];

const MANUAL_SELECTOR = `[${ATTR_SNOWFALL}]`;
const AUTO_SELECTOR = [MANUAL_SELECTOR, ...AUTO_DETECT_SELECTORS].join(', ');

const getElementType = (el: Element): PileType => {
    const override = el.getAttribute(ATTR_SNOWFALL);
    if (override === VAL_BOTTOM) return VAL_BOTTOM;
    if (override === VAL_TOP) return VAL_TOP;

    if (BOTTOM_TAGS.includes(el.tagName.toLowerCase())) return VAL_BOTTOM;
    const role = el.getAttribute('role');
    if (role && BOTTOM_ROLES.includes(role)) return VAL_BOTTOM;

    return VAL_TOP;
};

const isTransparent = (color: string) => color === 'transparent' || color === 'rgba(0, 0, 0, 0)';

/** An auto-detected element only collects snow if it is visibly a "box". */
const hasVisibleBox = (styles: CSSStyleDeclaration): boolean => {
    const hasBackground = !isTransparent(styles.backgroundColor) || styles.backgroundImage !== 'none';
    const hasBorder = parseFloat(styles.borderTopWidth) > 0 &&
        styles.borderTopStyle !== 'none' &&
        !isTransparent(styles.borderTopColor);
    const hasBoxShadow = styles.boxShadow !== 'none';
    const hasBackdropFilter = !!styles.backdropFilter && styles.backdropFilter !== 'none';
    return hasBackground || hasBorder || hasBoxShadow || hasBackdropFilter;
};

export const getAccumulationSurfaces = (maxSurfaces: number): { el: Element; type: PileType }[] => {
    const surfaces: { el: Element; type: PileType }[] = [];
    if (maxSurfaces <= 0) return surfaces;

    const candidates = document.querySelectorAll(AUTO_SELECTOR);
    const viewportHeight = window.innerHeight;

    for (const el of candidates) {
        if (surfaces.length >= maxSurfaces) break;

        const override = el.getAttribute(ATTR_SNOWFALL);
        if (override === VAL_IGNORE) continue;
        // Anything inside an ignored subtree is ignored as well.
        if (el.parentElement?.closest(`[${ATTR_SNOWFALL}="${VAL_IGNORE}"]`)) continue;

        const isManual = override !== null;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;

        if (!isManual) {
            if (rect.width < 100 || rect.height < 40) continue;
            const type = getElementType(el);
            // Skip full-page wrappers: their top edge is the top of the page.
            if (type === VAL_TOP && rect.top + window.scrollY <= 10 && rect.height >= viewportHeight * 0.9) continue;
            const styles = window.getComputedStyle(el);
            if (styles.display === 'none' || styles.visibility === 'hidden') continue;
            if (parseFloat(styles.opacity) <= 0.1 || !hasVisibleBox(styles)) continue;
        }

        surfaces.push({ el, type: getElementType(el) });
    }

    return surfaces;
};
