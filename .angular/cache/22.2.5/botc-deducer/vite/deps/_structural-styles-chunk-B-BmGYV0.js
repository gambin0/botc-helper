import { Dr as ViewEncapsulation, Wi as setClassMetadata, cn as Component, ro as ɵɵdefineComponent } from "./core-DUwRcsgK.js";
// node_modules/@angular/material/fesm2022/_structural-styles-chunk.mjs
var _StructuralStylesLoader = class _StructuralStylesLoader {
	static ɵfac = function _StructuralStylesLoader_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || _StructuralStylesLoader)();
	};
	static ɵcmp = /*@__PURE__*/ ɵɵdefineComponent({
		type: _StructuralStylesLoader,
		selectors: [["structural-styles"]],
		decls: 0,
		vars: 0,
		template: function _StructuralStylesLoader_Template(rf, ctx) {},
		styles: [".mat-focus-indicator {\n  position: relative;\n}\n.mat-focus-indicator::before {\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  position: absolute;\n  box-sizing: border-box;\n  pointer-events: none;\n  display: var(--%NS%mat-focus-indicator-display, none);\n  border-width: var(--%NS%mat-focus-indicator-border-width, 3px);\n  border-style: var(--%NS%mat-focus-indicator-border-style, solid);\n  border-color: var(--%NS%mat-focus-indicator-border-color, transparent);\n  border-radius: var(--%NS%mat-focus-indicator-border-radius, 4px);\n}\n.mat-focus-indicator:focus-visible::before {\n  content: \"\";\n}\n\n@media (forced-colors: active) {\n  html {\n    --%NS%mat-focus-indicator-display: block;\n    --%NS%mat-focus-indicator-fallback-border-style: none;\n  }\n}\n"],
		encapsulation: 2
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(_StructuralStylesLoader, [{
		type: Component,
		args: [{
			selector: "structural-styles",
			encapsulation: ViewEncapsulation.None,
			template: "",
			styles: [".mat-focus-indicator {\n  position: relative;\n}\n.mat-focus-indicator::before {\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  position: absolute;\n  box-sizing: border-box;\n  pointer-events: none;\n  display: var(--mat-focus-indicator-display, none);\n  border-width: var(--mat-focus-indicator-border-width, 3px);\n  border-style: var(--mat-focus-indicator-border-style, solid);\n  border-color: var(--mat-focus-indicator-border-color, transparent);\n  border-radius: var(--mat-focus-indicator-border-radius, 4px);\n}\n.mat-focus-indicator:focus-visible::before {\n  content: \"\";\n}\n\n@media (forced-colors: active) {\n  html {\n    --mat-focus-indicator-display: block;\n    --mat-focus-indicator-fallback-border-style: none;\n  }\n}\n"]
		}]
	}], null, null);
})();
export { _StructuralStylesLoader as t };
