export const build = (root, isCustomElement) => {
	customElements.define('custom-element', class extends HTMLElement {});
	const createElement = (tagName) => {
		const el = document.createElement(tagName);
		if (isCustomElement) {
			el.isCustomElement = tagName === 'custom-element';
		}
		return el;
	}
	const els = Array(10000).fill('').map(_ => [createElement('div'), createElement('not-custom'), createElement('custom-element')]);
	root.append(...(els.flat()));
}