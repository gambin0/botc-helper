import { ql as Observable } from "./core-DUwRcsgK.js";
import { t as innerFrom } from "./innerFrom-DBPaFs34.js";
// node_modules/rxjs/dist/esm5/internal/observable/defer.js
function defer(observableFactory) {
	return new Observable(function(subscriber) {
		innerFrom(observableFactory()).subscribe(subscriber);
	});
}
export { defer as t };
