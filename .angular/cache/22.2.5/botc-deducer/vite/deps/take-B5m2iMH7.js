import { Kl as operate, Wl as createOperatorSubscriber } from "./core-DUwRcsgK.js";
import { t as EMPTY } from "./empty-DVSq1ukv.js";
// node_modules/rxjs/dist/esm5/internal/operators/take.js
function take(count) {
	return count <= 0 ? function() {
		return EMPTY;
	} : operate(function(source, subscriber) {
		var seen = 0;
		source.subscribe(createOperatorSubscriber(subscriber, function(value) {
			if (++seen <= count) {
				subscriber.next(value);
				if (count <= seen) subscriber.complete();
			}
		}));
	});
}
export { take as t };
