import { t as ListKeyManager } from "./_list-key-manager-chunk-Dyvrf8C9.js";
// node_modules/@angular/cdk/fesm2022/_focus-key-manager-chunk.mjs
var FocusKeyManager = class extends ListKeyManager {
	_origin = "program";
	setFocusOrigin(origin) {
		this._origin = origin;
		return this;
	}
	setActiveItem(item) {
		super.setActiveItem(item);
		if (this.activeItem) this.activeItem.focus(this._origin);
	}
};
export { FocusKeyManager as t };
