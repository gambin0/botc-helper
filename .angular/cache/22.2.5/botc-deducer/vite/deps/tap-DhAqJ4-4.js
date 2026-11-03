import { Kl as operate, Wl as createOperatorSubscriber, Yl as identity, ru as isFunction } from "./core-DUwRcsgK.js";
// node_modules/rxjs/dist/esm5/internal/operators/tap.js
function tap(observerOrNext, error, complete) {
	var tapObserver = isFunction(observerOrNext) || error || complete ? {
		next: observerOrNext,
		error,
		complete
	} : observerOrNext;
	return tapObserver ? operate(function(source, subscriber) {
		var _a;
		(_a = tapObserver.subscribe) === null || _a === void 0 || _a.call(tapObserver);
		var isUnsub = true;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			var _a;
			(_a = tapObserver.next) === null || _a === void 0 || _a.call(tapObserver, value);
			subscriber.next(value);
		}, function() {
			var _a;
			isUnsub = false;
			(_a = tapObserver.complete) === null || _a === void 0 || _a.call(tapObserver);
			subscriber.complete();
		}, function(err) {
			var _a;
			isUnsub = false;
			(_a = tapObserver.error) === null || _a === void 0 || _a.call(tapObserver, err);
			subscriber.error(err);
		}, function() {
			var _a, _b;
			if (isUnsub) (_a = tapObserver.unsubscribe) === null || _a === void 0 || _a.call(tapObserver);
			(_b = tapObserver.finalize) === null || _b === void 0 || _b.call(tapObserver);
		}));
	}) : identity;
}
export { tap as t };
