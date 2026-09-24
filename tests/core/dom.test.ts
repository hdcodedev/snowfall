// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { getAccumulationSurfaces } from '../../src/core/dom';

// jsdom does no layout: each fixture declares its box as data-rect="left,top,width,height".
beforeAll(() => {
    Element.prototype.getBoundingClientRect = function (this: Element) {
        const [left, top, width, height] = (this.getAttribute('data-rect') ?? '0,0,0,0').split(',').map(Number);
        return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} } as DOMRect;
    };
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
});

afterEach(() => {
    document.body.innerHTML = '';
});

// jsdom reports unset styles as '' where browsers say 'none', so "plain" boxes spell it out.
const PLAIN = 'background-color: transparent; background-image: none; box-shadow: none;';
const BOXED = 'background-color: rgb(20, 30, 40); background-image: none; box-shadow: none;';

const find = () => getAccumulationSurfaces(24).map(({ el, type }) => `${el.id}:${type}`);

describe('getAccumulationSurfaces', () => {
    it('auto-detects visible landmarks: snow hangs under headers, sits on footers', () => {
        document.body.innerHTML = `
            <header id="h" style="${BOXED}" data-rect="0,0,800,80"></header>
            <footer id="f" style="${BOXED}" data-rect="0,700,800,100"></footer>`;
        expect(find()).toEqual(['h:bottom', 'f:top']);
    });

    it('skips auto-detected elements that are transparent, hidden, faint or small', () => {
        document.body.innerHTML = `
            <article id="transparent" style="${PLAIN}" data-rect="0,100,400,200"></article>
            <article id="hidden" style="${BOXED} display: none;" data-rect="0,100,400,200"></article>
            <article id="faint" style="${BOXED} opacity: 0.05;" data-rect="0,100,400,200"></article>
            <article id="small" style="${BOXED}" data-rect="0,100,60,20"></article>
            <article id="card" style="${BOXED}" data-rect="0,400,400,200"></article>`;
        expect(find()).toEqual(['card:top']);
    });

    it('skips full-page wrappers, whose top edge is the top of the page', () => {
        document.body.innerHTML = `<article id="page" style="${BOXED}" data-rect="0,0,1200,3000"></article>`;
        expect(find()).toEqual([]);
    });

    it('data-snowfall includes any element and overrides the side', () => {
        document.body.innerHTML = `
            <div id="plain" data-snowfall="top" style="${PLAIN}" data-rect="0,100,40,10"></div>
            <header id="flipped" data-snowfall="top" style="${BOXED}" data-rect="0,0,800,80"></header>
            <div id="hanging" data-snowfall="bottom" style="${PLAIN}" data-rect="0,300,300,40"></div>`;
        expect(find()).toEqual(['plain:top', 'flipped:top', 'hanging:bottom']);
    });

    it('data-snowfall="ignore" excludes the element and everything inside it', () => {
        document.body.innerHTML = `
            <section data-snowfall="ignore" data-rect="0,0,800,600">
                <article id="inside" style="${BOXED}" data-rect="0,100,400,200"></article>
                <div id="marked" data-snowfall="top" data-rect="0,400,200,20"></div>
            </section>
            <footer id="ignored" data-snowfall="ignore" style="${BOXED}" data-rect="0,700,800,100"></footer>`;
        expect(find()).toEqual([]);
    });

    it('skips elements with no size, even when marked', () => {
        document.body.innerHTML = `<div id="empty" data-snowfall="top" data-rect="0,0,0,0"></div>`;
        expect(find()).toEqual([]);
    });

    it('respects the surface limit', () => {
        document.body.innerHTML = Array.from({ length: 6 }, (_, i) =>
            `<div id="s${i}" data-snowfall="top" data-rect="0,${i * 50},200,20"></div>`).join('');
        expect(getAccumulationSurfaces(3)).toHaveLength(3);
        expect(getAccumulationSurfaces(0)).toHaveLength(0);
    });
});
