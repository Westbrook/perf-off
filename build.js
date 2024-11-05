export const build = (root) => {
	customElements.define('custom-element', class extends HTMLElement {});
	const els = Array(10000).fill('').map(_ => [document.createElement('div'), document.createElement('not-custom'), document.createElement('custom-element')]);
	root.append(...(els.flat()));
}