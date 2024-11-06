export const build = (root) => {
	customElements.define("custom-element", class extends HTMLElement {});

	const makeDiv = () => {
		const el = document.createElement("div");
		el.isCustomElement = false;
		return el;
	};
	const makeNotCustom = () => {
		const el = document.createElement("not-custom");
		el.isCustomElement = false;
		return el;
	};
	const makeCustom = () => {
		const el = document.createElement("custom-element");
		el.isCustomElement = true;
		return el;
	};

	const els = Array(16000)
		.fill("")
		.map((_) => [makeDiv(), makeNotCustom(), makeCustom()]);
	root.append(...els.flat());
};
