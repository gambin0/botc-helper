import { ql as Observable, ru as isFunction } from "./core-DUwRcsgK.js";
// node_modules/rxjs/dist/esm5/internal/util/isObservable.js
function isObservable(obj) {
	return !!obj && (obj instanceof Observable || isFunction(obj.lift) && isFunction(obj.subscribe));
}
export { isObservable as t };
