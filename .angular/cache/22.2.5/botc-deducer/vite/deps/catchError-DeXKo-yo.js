import { Kl as operate, Wl as createOperatorSubscriber, ql as Observable, ru as isFunction } from "./core-DUwRcsgK.js";
import { t as innerFrom } from "./innerFrom-DBPaFs34.js";
// node_modules/rxjs/dist/esm5/internal/observable/throwError.js
function throwError(errorOrErrorFactory, scheduler) {
	var errorFactory = isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function() {
		return errorOrErrorFactory;
	};
	var init = function(subscriber) {
		return subscriber.error(errorFactory());
	};
	return new Observable(scheduler ? function(subscriber) {
		return scheduler.schedule(init, 0, subscriber);
	} : init);
}
// node_modules/rxjs/dist/esm5/internal/operators/catchError.js
function catchError(selector) {
	return operate(function(source, subscriber) {
		var innerSub = null;
		var syncUnsub = false;
		var handledResult;
		innerSub = source.subscribe(createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
			handledResult = innerFrom(selector(err, catchError(selector)(source)));
			if (innerSub) {
				innerSub.unsubscribe();
				innerSub = null;
				handledResult.subscribe(subscriber);
			} else syncUnsub = true;
		}));
		if (syncUnsub) {
			innerSub.unsubscribe();
			innerSub = null;
			handledResult.subscribe(subscriber);
		}
	});
}
export { throwError as n, catchError as t };
