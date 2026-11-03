import { t as EMPTY } from "./empty-DVSq1ukv.js";
import { t as innerFrom } from "./innerFrom-DBPaFs34.js";
import { a as popScheduler, r as popNumber, t as from } from "./from-DJYomoXP.js";
import { i as mergeAll } from "./takeUntil-C769UC84.js";
// node_modules/rxjs/dist/esm5/internal/observable/merge.js
function merge() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	var scheduler = popScheduler(args);
	var concurrent = popNumber(args, Infinity);
	var sources = args;
	return !sources.length ? EMPTY : sources.length === 1 ? innerFrom(sources[0]) : mergeAll(concurrent)(from(sources, scheduler));
}
// node_modules/@angular/cdk/fesm2022/coercion.mjs
function coerceBooleanProperty(value) {
	return value != null && `${value}` !== "false";
}
export { merge as n, coerceBooleanProperty as t };
