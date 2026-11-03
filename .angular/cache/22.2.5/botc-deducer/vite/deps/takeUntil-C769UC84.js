import { Kl as operate, Ql as noop, Wl as createOperatorSubscriber, Yl as identity } from "./core-DUwRcsgK.js";
import { t as innerFrom } from "./innerFrom-DBPaFs34.js";
import { a as popScheduler, t as from } from "./from-DJYomoXP.js";
import { r as mergeMap } from "./switchMap-BOt59wP1.js";
// node_modules/rxjs/dist/esm5/internal/operators/mergeAll.js
function mergeAll(concurrent) {
	if (concurrent === void 0) concurrent = Infinity;
	return mergeMap(identity, concurrent);
}
// node_modules/rxjs/dist/esm5/internal/operators/concatAll.js
function concatAll() {
	return mergeAll(1);
}
// node_modules/rxjs/dist/esm5/internal/observable/concat.js
function concat() {
	var args = [];
	for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
	return concatAll()(from(args, popScheduler(args)));
}
// node_modules/rxjs/dist/esm5/internal/operators/startWith.js
function startWith() {
	var values = [];
	for (var _i = 0; _i < arguments.length; _i++) values[_i] = arguments[_i];
	var scheduler = popScheduler(values);
	return operate(function(source, subscriber) {
		(scheduler ? concat(values, source, scheduler) : concat(values, source)).subscribe(subscriber);
	});
}
// node_modules/rxjs/dist/esm5/internal/operators/takeUntil.js
function takeUntil(notifier) {
	return operate(function(source, subscriber) {
		innerFrom(notifier).subscribe(createOperatorSubscriber(subscriber, function() {
			return subscriber.complete();
		}, noop));
		!subscriber.closed && source.subscribe(subscriber);
	});
}
export { mergeAll as i, startWith as n, concat as r, takeUntil as t };
