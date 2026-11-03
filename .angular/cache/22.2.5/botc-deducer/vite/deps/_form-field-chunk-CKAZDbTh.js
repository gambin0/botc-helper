import { $o as ɵɵloadQuery, A as contentChild, Ac as Injector, Al as ɵɵdefineInjectable, Bt as computed, Ca as ɵɵclassProp, Co as ɵɵelementStart, Cs as ɵɵreference, Da as ɵɵconditionalCreate, Dr as ViewEncapsulation, En as ElementRef, Fn as Injectable, Gs as ɵɵtemplate, In as Input, Js as ɵɵtextInterpolate, Kc as RuntimeError, Ks as ɵɵtemplateRefExtractor, Oa as ɵɵcontentQuery, Qo as ɵɵlistener, Rc as NgZone, S as ViewChild, So as ɵɵelementEnd, T as afterRenderEffect, Ta as ɵɵconditional, Tl as signal, Ul as Subject, Vl as map, Wi as setClassMetadata, Wt as linkedSignal, X as input, _c as DOCUMENT, a as ContentChildren, aa as ɵɵControlFeature, al as formatRuntimeError, ar as RendererFactory2, bs as ɵɵqueryAdvance, cn as Component, cs as ɵɵprojectionDef, da as ɵɵadvance, dc as ɵɵviewQuerySignal, dl as inject, dr as Service, es as ɵɵnextContext, eu as Subscription, go as ɵɵdomProperty, gt as viewChild, hc as CSP_NONCE, i as ContentChild, il as effect, io as ɵɵdefineDirective, ir as Renderer2, jo as ɵɵgetInheritedFactory, ka as ɵɵcontentQuerySignal, kc as InjectionToken, lo as ɵɵdomElement, ls as ɵɵproperty, ml as isSignal, mo as ɵɵdomElementStart, ol as forwardRef, po as ɵɵdomElementEnd, ql as Observable, qs as ɵɵtext, qt as untracked, r as ChangeDetectorRef, ro as ɵɵdefineComponent, so as ɵɵdefineService, ss as ɵɵprojection, ua as ɵɵProvidersFeature, uc as ɵɵviewQuery, vc as DestroyRef, vo as ɵɵelement, wn as Directive, xs as ɵɵqueryRefresh, ya as ɵɵattribute } from "./core-DUwRcsgK.js";
import { r as Platform } from "./_element-chunk-CAnu8Tp9.js";
import { n as pairwise, t as shareReplay } from "./shareReplay-B6ey4Jsf.js";
import { n as filter } from "./switchMap-BOt59wP1.js";
import { n as startWith, t as takeUntil } from "./takeUntil-C769UC84.js";
import { t as merge } from "./merge-G1CFkgR3.js";
import "./platform-browser-uXLWW3yx.js";
import { t as _animationsDisabled } from "./_animation-chunk-BSRSnsxC.js";
import { t as _IdGenerator } from "./_id-generator-chunk-CqjeokZS.js";
import { Z as NgTemplateOutlet } from "./common-DFmsAV2A.js";
import { i as Directionality } from "./bidi-DfOrtKt2.js";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, Validators, ɵFORM_CONTROL_INTEGRATION, ɵelementAcceptsMinMax as elementAcceptsMinMax, ɵisNativeFormElement as isNativeFormElement, ɵisTextualFormElement as isTextualFormElement, ɵselectValueAccessor as selectValueAccessor, ɵsetNativeDomProperty as setNativeDomProperty } from "./@angular_forms.js";
import "./platform-FcODWz2l.js";
import { t as coerceBooleanProperty } from "./coercion-jtlG8Yt7.js";
// node_modules/@angular/forms/fesm2022/_validation_errors-chunk.mjs
/**
* @license Angular v22.2.4
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var FIELD_TREE = /* @__PURE__ */ Symbol("FIELD_TREE");
function isArray(value) {
	return Array.isArray(value);
}
var MetadataReducer = {
	list() {
		return {
			reduce: (acc, item) => item === void 0 ? acc : [...acc, item],
			getInitial: () => []
		};
	},
	min() {
		return {
			reduce: (acc, item) => {
				if (acc === void 0 || item === void 0) return acc ?? item;
				return item < acc ? item : acc;
			},
			getInitial: () => void 0
		};
	},
	max() {
		return {
			reduce: (acc, item) => {
				if (acc === void 0 || item === void 0) return acc ?? item;
				return item > acc ? item : acc;
			},
			getInitial: () => void 0
		};
	},
	or() {
		return {
			reduce: (prev, next) => prev || next,
			getInitial: () => false
		};
	},
	and() {
		return {
			reduce: (prev, next) => prev && next,
			getInitial: () => true
		};
	},
	override
};
function override(getInitial) {
	return {
		reduce: (_, item) => item,
		getInitial: () => getInitial?.()
	};
}
var IS_ASYNC_VALIDATION_RESOURCE = Symbol("IS_ASYNC_VALIDATION_RESOURCE");
var MetadataKey = class {
	reducer;
	create;
	brand;
	[IS_ASYNC_VALIDATION_RESOURCE];
	constructor(reducer, create) {
		this.reducer = reducer;
		this.create = create;
	}
};
function createMetadataKey(reducer) {
	return new MetadataKey(reducer ?? MetadataReducer.override());
}
function createLimitSelectionKey() {
	return createMetadataKey();
}
createMetadataKey(MetadataReducer.or());
createLimitSelectionKey();
createMetadataKey(MetadataReducer.max());
createMetadataKey(MetadataReducer.max());
createLimitSelectionKey();
createMetadataKey(MetadataReducer.min());
createMetadataKey(MetadataReducer.min());
createMetadataKey(MetadataReducer.max());
createMetadataKey(MetadataReducer.min());
createMetadataKey(MetadataReducer.list());
function shallowArrayEquals(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
	return true;
}
function addDefaultField(errors, fieldTree) {
	if (isArray(errors)) for (const error of errors) error.fieldTree ??= fieldTree;
	else if (errors) errors.fieldTree ??= fieldTree;
	return errors;
}
createMetadataKey();
computed(() => false, ...ngDevMode ? [{ debugName: "FALSE_SIGNAL" }] : []);
computed(() => [], ...ngDevMode ? [{ debugName: "ROOT_PATH_KEYS" }] : []);
computed(() => {
	throw new RuntimeError(1905, ngDevMode && "The top-level field in the form has no parent.");
}, ...ngDevMode ? [{ debugName: "ROOT_KEY_IN_PARENT" }] : []);
computed(() => [], ...ngDevMode ? [{ debugName: "EMPTY" }] : []);
computed(() => false, ...ngDevMode ? [{ debugName: "FALSE" }] : []);
new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "REGISTER_WEBMCP_FORM" : "");
async function submit(form, options) {
	const node = untracked(form);
	if (untracked(node.submitState.submitting)) return false;
	const field = options === void 0 ? node.structure.root.fieldProxy : form;
	const detail = {
		root: node.structure.root.fieldProxy,
		submitted: form
	};
	options = typeof options === "function" ? { action: options } : options ?? node.structure.fieldManager.submitOptions;
	const action = options?.action;
	if (!action) throw new RuntimeError(1915, (typeof ngDevMode === "undefined" || ngDevMode) && "Cannot submit form with no submit action. Specify the action when creating the form, or as an additional argument to `submit()`.");
	node.markAsTouched();
	const onInvalid = options?.onInvalid;
	const shouldRun = shouldRunAction(node, options?.ignoreValidators);
	try {
		if (shouldRun) {
			node.submitState.selfSubmitting.set(true);
			const errors = await untracked(() => action?.(field, detail));
			errors && setSubmissionErrors(node, errors);
			return !errors || isArray(errors) && errors.length === 0;
		} else untracked(() => onInvalid?.(field, detail));
		return false;
	} finally {
		node.submitState.selfSubmitting.set(false);
	}
}
function shouldRunAction(node, ignoreValidators) {
	switch (ignoreValidators) {
		case "all": return true;
		case "none": return untracked(node.valid);
		default: return !untracked(node.invalid);
	}
}
function setSubmissionErrors(submittedField, errors) {
	if (!isArray(errors)) errors = [errors];
	const errorsByField = /* @__PURE__ */ new Map();
	for (const error of errors) {
		const errorWithField = addDefaultField(error, submittedField.fieldTree);
		const field = errorWithField.fieldTree();
		let fieldErrors = errorsByField.get(field);
		if (!fieldErrors) {
			fieldErrors = [];
			errorsByField.set(field, fieldErrors);
		}
		fieldErrors.push(errorWithField);
	}
	for (const [field, fieldErrors] of errorsByField) field.submitState.submissionErrors.set(fieldErrors);
}
var CompatValidationError = class {
	kind = "compat";
	control;
	fieldTree;
	context;
	message;
	constructor({ context, kind, control }) {
		this.context = context;
		this.kind = kind;
		this.control = control;
	}
};
function signalErrorsToValidationErrors(errors) {
	if (errors.length === 0) return null;
	const errObj = {};
	for (const error of errors) errObj[error.kind] = error instanceof CompatValidationError ? error.context : error;
	return errObj;
}
function reactiveErrorsToSignalErrors(errors, control) {
	if (errors === null) return [];
	return Object.entries(errors).map(([kind, context]) => {
		return new CompatValidationError({
			context,
			kind,
			control
		});
	});
}
// node_modules/@angular/forms/fesm2022/signals.mjs
/**
* @license Angular v22.2.4
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
function isFieldTree(value) {
	return typeof value === "function" && value[FIELD_TREE] === true;
}
var SIGNAL_FORMS_CONFIG = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "SIGNAL_FORMS_CONFIG" : "");
function normalizeErrors(error) {
	if (error === void 0) return [];
	if (Array.isArray(error)) return error;
	return [error];
}
var BaseNgValidationError = class {
	__brand = void 0;
	kind = "";
	fieldTree;
	message;
	constructor(options) {
		if (options) Object.assign(this, options);
	}
};
var NativeInputParseError = class extends BaseNgValidationError {
	kind = "parse";
};
function createParser(getValue, setValue, parse) {
	const errors = linkedSignal({
		...ngDevMode ? { debugName: "errors" } : {},
		source: getValue,
		computation: () => [],
		equal: shallowArrayEquals
	});
	const setRawValue = (rawValue) => {
		const result = parse(rawValue);
		errors.set(normalizeErrors(result.error));
		if (result.value !== void 0) setValue(result.value);
		errors.set(normalizeErrors(result.error));
	};
	const reset = () => {
		errors.set([]);
	};
	return {
		errors: errors.asReadonly(),
		setRawValue,
		reset
	};
}
var InteropNgControl = class {
	field;
	constructor(field) {
		this.field = field;
	}
	control = this;
	get value() {
		return this.field().controlValue();
	}
	get valid() {
		return this.field().valid();
	}
	get invalid() {
		return this.field().invalid();
	}
	get pending() {
		return this.field().pending();
	}
	get disabled() {
		return this.field().disabled();
	}
	get enabled() {
		return !this.field().disabled();
	}
	get errors() {
		return signalErrorsToValidationErrors(this.field().errors());
	}
	get pristine() {
		return !this.field().dirty();
	}
	get dirty() {
		return this.field().dirty();
	}
	get touched() {
		return this.field().touched();
	}
	get untouched() {
		return !this.field().touched();
	}
	get status() {
		if (this.field().disabled()) return "DISABLED";
		if (this.field().valid()) return "VALID";
		if (this.field().invalid()) return "INVALID";
		if (this.field().pending()) return "PENDING";
		throw new RuntimeError(1910, ngDevMode && "Unknown form control status");
	}
	valueAccessor = null;
	hasValidator(validator) {
		if (validator === Validators.required) return this.field().required();
		return false;
	}
	updateValueAndValidity() {}
};
var FIELD_STATE_KEY_TO_CONTROL_BINDING = {
	disabled: "disabled",
	disabledReasons: "disabledReasons",
	dirty: "dirty",
	errors: "errors",
	hidden: "hidden",
	invalid: "invalid",
	max: "max",
	maxLength: "maxLength",
	min: "min",
	minLength: "minLength",
	name: "name",
	pattern: "pattern",
	pending: "pending",
	readonly: "readonly",
	required: "required",
	touched: "touched"
};
var CONTROL_BINDING_TO_FIELD_STATE_KEY = /* @__PURE__ */ (() => {
	const map = {};
	for (const key of Object.keys(FIELD_STATE_KEY_TO_CONTROL_BINDING)) map[FIELD_STATE_KEY_TO_CONTROL_BINDING[key]] = key;
	return map;
})();
function readFieldStateBindingValue(fieldState, key) {
	return fieldState[CONTROL_BINDING_TO_FIELD_STATE_KEY[key]]?.();
}
var CONTROL_BINDING_NAMES = /* @__PURE__ */ (() => Object.values(FIELD_STATE_KEY_TO_CONTROL_BINDING))();
function createBindings() {
	return {};
}
function bindingUpdated(bindings, key, value) {
	if (!Object.is(bindings[key], value)) {
		bindings[key] = value;
		return true;
	}
	return false;
}
function getNativeControlValue(element, currentValue, validityMonitor) {
	let modelValue;
	if (isInput(element) && validityMonitor.isBadInput(element)) return { error: new NativeInputParseError() };
	switch (element.type) {
		case "checkbox": return { value: element.checked };
		case "number":
		case "range":
		case "datetime-local":
			modelValue = untracked(currentValue);
			if (typeof modelValue === "number" || modelValue === null) return { value: element.value === "" ? null : element.valueAsNumber };
			break;
		case "date":
		case "month":
		case "time":
		case "week":
			modelValue = untracked(currentValue);
			if (modelValue === null || modelValue instanceof Date) return { value: element.valueAsDate };
			else if (typeof modelValue === "number") return { value: element.valueAsNumber };
	}
	if (element.tagName === "INPUT" && element.type === "text") {
		modelValue ??= untracked(currentValue);
		if (typeof modelValue === "number" || modelValue === null) {
			if (element.value === "") return { value: null };
			const parsed = Number(element.value);
			if (Number.isNaN(parsed)) return { error: new NativeInputParseError() };
			return { value: parsed };
		}
	}
	return { value: element.value };
}
function setNativeControlValue(element, value) {
	switch (element.type) {
		case "checkbox":
			element.checked = value;
			return;
		case "radio":
			element.checked = value === element.value;
			return;
		case "number":
		case "range":
		case "datetime-local":
			if (typeof value === "number") {
				setNativeNumberControlValue(element, value);
				return;
			} else if (value === null) {
				element.value = "";
				return;
			}
			break;
		case "date":
		case "month":
		case "time":
		case "week": if (value === null || value instanceof Date) {
			element.valueAsDate = value;
			return;
		} else if (typeof value === "number") {
			setNativeNumberControlValue(element, value);
			return;
		}
	}
	if (element.tagName === "INPUT" && element.type === "text") {
		if (typeof value === "number") {
			element.value = isNaN(value) ? "" : String(value);
			return;
		}
		if (value === null) {
			if (typeof ngDevMode !== "undefined" && ngDevMode) console.warn(formatRuntimeError(1921, `The text input ${element.name} received a null value. Text inputs should use empty strings to represent null values.  The input's value will be set to an empty string instead.`));
			element.value = "";
			return;
		}
	}
	element.value = value;
}
function setNativeNumberControlValue(element, value) {
	if (isNaN(value)) element.value = "";
	else element.valueAsNumber = value;
}
function isInput(element) {
	return element.tagName === "INPUT";
}
function inputRequiresValidityTracking(input) {
	return input.type === "date" || input.type === "datetime-local" || input.type === "month" || input.type === "time" || input.type === "week";
}
function formatDateForInput(date, type) {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	if (type === "month") return `${year}-${month}`;
	return `${year}-${month}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function formatDateForMinMax(name, value, type) {
	if (value instanceof Date && (name === "min" || name === "max") && (type === "date" || type === "month")) return formatDateForInput(value, type);
	return value;
}
function customControlCreate(host, parent) {
	host.listenToCustomControlModel((value) => parent.state().controlValue.set(value));
	host.listenToCustomControlOutput("touch", () => parent.state().markAsTouched());
	parent.registerAsBinding(host.customControl);
	const bindings = createBindings();
	return () => {
		const state = parent.state();
		const controlValue = state.controlValue();
		if (bindingUpdated(bindings, "controlValue", controlValue)) host.setCustomControlModelInput(controlValue);
		for (const name of CONTROL_BINDING_NAMES) {
			let value;
			if (name === "errors") value = parent.errors();
			else value = readFieldStateBindingValue(state, name);
			if (bindingUpdated(bindings, name, value)) {
				host.setInputOnDirectives(name, value);
				if (parent.elementAcceptsNativeProperty(name) && !host.customControlHasInput(name)) {
					const domValue = formatDateForMinMax(name, value, parent.nativeFormElement.type);
					setNativeDomProperty(parent.renderer, parent.nativeFormElement, name, domValue);
				}
			}
		}
	};
}
function isValidatorObject(v) {
	return typeof v === "object" && v !== null;
}
function cvaControlCreate(host, parent) {
	const bindings = createBindings();
	parent.controlValueAccessor.registerOnChange((value) => {
		bindings["controlValue"] = value;
		parent.state().controlValue.set(value);
	});
	parent.controlValueAccessor.registerOnTouched(() => parent.state().markAsTouched());
	const legacyValidators = parent.injector.get(NG_VALIDATORS, null, {
		optional: true,
		self: true
	});
	if (legacyValidators) {
		let version;
		for (const v of legacyValidators) if (isValidatorObject(v) && v.registerOnValidatorChange) {
			version ??= signal(0);
			v.registerOnValidatorChange(() => {
				version.update((n) => n + 1);
			});
		}
		const validatorFns = legacyValidators.map((v) => typeof v === "function" ? v : v.validate.bind(v));
		const mergedValidator = Validators.compose(validatorFns);
		const parseErrors = computed(() => {
			version?.();
			return reactiveErrorsToSignalErrors(mergedValidator ? mergedValidator(parent.interopNgControl.control) : null, parent.interopNgControl.control);
		}, ...ngDevMode ? [{ debugName: "parseErrors" }] : []);
		parent.parseErrorsSource.set(parseErrors);
	}
	parent.registerAsBinding({ reset: () => {
		const value = parent.state().value();
		bindings["controlValue"] = value;
		untracked(() => parent.controlValueAccessor.writeValue(value));
	} });
	return () => {
		const fieldState = parent.state();
		const controlValue = fieldState.controlValue();
		if (bindingUpdated(bindings, "controlValue", controlValue)) untracked(() => parent.controlValueAccessor.writeValue(controlValue));
		for (const name of CONTROL_BINDING_NAMES) {
			const value = readFieldStateBindingValue(fieldState, name);
			if (bindingUpdated(bindings, name, value)) {
				const propertyWasSet = host.setInputOnDirectives(name, value, name === "name" ? isDefinedPredicate : void 0);
				if (name === "disabled" && parent.controlValueAccessor.setDisabledState) untracked(() => parent.controlValueAccessor.setDisabledState(value));
				else if (!propertyWasSet && parent.elementAcceptsNativeProperty(name)) setNativeDomProperty(parent.renderer, parent.nativeFormElement, name, value);
			}
		}
	};
}
function isDefinedPredicate(value) {
	return value == null;
}
function observeSelectMutations(select, onMutation, destroyRef) {
	if (typeof MutationObserver !== "function") return;
	const observer = new MutationObserver((mutations) => {
		if (mutations.some((m) => isRelevantSelectMutation(m))) onMutation();
	});
	observer.observe(select, {
		attributes: true,
		attributeFilter: ["value"],
		characterData: true,
		childList: true,
		subtree: true
	});
	destroyRef.onDestroy(() => observer.disconnect());
}
function isRelevantSelectMutation(mutation) {
	if (mutation.type === "childList" || mutation.type === "characterData") {
		if (mutation.target instanceof Comment) return false;
		for (const node of mutation.addedNodes) if (!(node instanceof Comment)) return true;
		for (const node of mutation.removedNodes) if (!(node instanceof Comment)) return true;
		return false;
	}
	if (mutation.type === "attributes" && mutation.target instanceof HTMLOptionElement) return true;
	return false;
}
function nativeControlCreate(host, parent, parseErrorsSource, validityMonitor) {
	let updateMode = false;
	const input = parent.nativeFormElement;
	const parser = createParser(() => parent.state().value(), (rawValue) => parent.state().controlValue.set(rawValue), (_rawValue) => getNativeControlValue(input, parent.state().value, validityMonitor));
	parseErrorsSource.set(parser.errors);
	parent.onReset = () => {
		parser.reset();
		const value = parent.state().value();
		bindings["controlValue"] = value;
		setNativeControlValue(input, value);
	};
	const nativeEl = host.nativeElement;
	const onInput = () => parser.setRawValue(void 0);
	nativeEl.addEventListener("input", onInput);
	const onBlur = () => parent.state().markAsTouched();
	nativeEl.addEventListener("blur", onBlur);
	parent.destroyRef.onDestroy(() => {
		nativeEl.removeEventListener("input", onInput);
		nativeEl.removeEventListener("blur", onBlur);
	});
	if (isInput(input) && inputRequiresValidityTracking(input)) validityMonitor.watchValidity(parent.destroyRef, input, () => parser.setRawValue(void 0));
	parent.registerAsBinding();
	if (input.tagName === "SELECT") observeSelectMutations(input, () => {
		if (!updateMode) return;
		input.value = parent.state().controlValue();
	}, parent.destroyRef);
	const bindings = createBindings();
	return () => {
		const state = parent.state();
		for (const name of CONTROL_BINDING_NAMES) {
			const value = readFieldStateBindingValue(state, name);
			if (bindingUpdated(bindings, name, value)) {
				host.setInputOnDirectives(name, value);
				if (parent.elementAcceptsNativeProperty(name)) {
					const domValue = formatDateForMinMax(name, value, input.type);
					setNativeDomProperty(parent.renderer, input, name, domValue);
				}
			}
		}
		const controlValue = state.controlValue();
		const controlValueChanged = bindingUpdated(bindings, "controlValue", controlValue);
		const radioValueChanged = input.type === "radio" && bindingUpdated(bindings, "radioValue", input.value);
		if (controlValueChanged || radioValueChanged) setNativeControlValue(input, controlValue);
		updateMode = true;
	};
}
var InputValidityMonitor = class InputValidityMonitor {
	static ɵfac = function InputValidityMonitor_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || InputValidityMonitor)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineInjectable({
		token: InputValidityMonitor,
		factory: (__ngFactoryType__) => AnimationInputValidityMonitor.ɵfac(__ngFactoryType__),
		providedIn: "root"
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InputValidityMonitor, [{
		type: Injectable,
		args: [{
			providedIn: "root",
			useClass: forwardRef(() => AnimationInputValidityMonitor)
		}]
	}], null, null);
})();
var AnimationInputValidityMonitor = class AnimationInputValidityMonitor extends InputValidityMonitor {
	document = inject(DOCUMENT);
	cspNonce = inject(CSP_NONCE, { optional: true });
	injectedStyles = /* @__PURE__ */ new WeakMap();
	watchValidity(destroyRef, element, callback) {
		const rootNode = element.getRootNode();
		if (!this.injectedStyles.has(rootNode)) this.injectedStyles.set(rootNode, this.createAnimationStyle(rootNode));
		const onAnimationStart = (event) => {
			const animationEvent = event;
			if (animationEvent.animationName === "ng-valid" || animationEvent.animationName === "ng-invalid") callback();
		};
		element.addEventListener("animationstart", onAnimationStart);
		destroyRef.onDestroy(() => {
			element.removeEventListener("animationstart", onAnimationStart);
		});
	}
	isBadInput(element) {
		return element.validity?.badInput ?? false;
	}
	createAnimationStyle(rootNode) {
		const element = this.document.createElement("style");
		if (this.cspNonce) element.nonce = this.cspNonce;
		element.textContent = `
      @keyframes ng-valid {}
      @keyframes ng-invalid {}
      input:valid, textarea:valid {
        animation: ng-valid 0.001s;
      }
      input:invalid, textarea:invalid {
        animation: ng-invalid 0.001s;
      }
    `;
		if (rootNode.nodeType === 9) rootNode.head?.appendChild(element);
		else rootNode.appendChild(element);
		return element;
	}
	ngOnDestroy() {
		this.injectedStyles.get(this.document)?.remove();
	}
	static ɵfac = /*@__PURE__*/ (() => {
		let ɵAnimationInputValidityMonitor_BaseFactory = void 0;
		return function AnimationInputValidityMonitor_Factory(__ngFactoryType__) {
			return (ɵAnimationInputValidityMonitor_BaseFactory || (ɵAnimationInputValidityMonitor_BaseFactory = ɵɵgetInheritedFactory(AnimationInputValidityMonitor)))(__ngFactoryType__ || AnimationInputValidityMonitor);
		};
	})();
	static ɵprov = /*@__PURE__*/ ɵɵdefineInjectable({
		token: AnimationInputValidityMonitor,
		factory: AnimationInputValidityMonitor.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AnimationInputValidityMonitor, [{ type: Injectable }], null, null);
})();
var ɵNgFieldDirective = Symbol();
var FORM_FIELD = new InjectionToken(typeof ngDevMode !== "undefined" && ngDevMode ? "FORM_FIELD" : "");
var FormField = class FormField {
	field = input.required({
		...ngDevMode ? { debugName: "field" } : {},
		alias: "formField"
	});
	state = computed(() => this.field()(), ...ngDevMode ? [{ debugName: "state" }] : []);
	renderer = inject(Renderer2);
	destroyRef = inject(DestroyRef);
	injector = inject(Injector);
	element = inject(ElementRef).nativeElement;
	elementIsNativeFormElement = isNativeFormElement(this.element);
	elementAcceptsTextualValues = isTextualFormElement(this.element);
	_elementAcceptsMinMax;
	nativeFormElement = this.elementIsNativeFormElement ? this.element : void 0;
	focuser = (options) => this.element.focus(options);
	controlValueAccessors = inject(NG_VALUE_ACCESSOR, {
		optional: true,
		self: true
	});
	config = inject(SIGNAL_FORMS_CONFIG, { optional: true });
	validityMonitor = inject(InputValidityMonitor);
	parseErrorsSource = signal(void 0, ...ngDevMode ? [{ debugName: "parseErrorsSource" }] : []);
	_interopNgControl;
	get interopNgControl() {
		return this._interopNgControl ??= new InteropNgControl(this.state);
	}
	parseErrors = computed(() => this.parseErrorsSource()?.().map((err) => ({
		...err,
		fieldTree: untracked(this.state).fieldTree,
		formField: this
	})) ?? [], {
		...ngDevMode ? { debugName: "parseErrors" } : {},
		equal: shallowArrayEquals
	});
	errors = computed(() => this.state().errors().filter((err) => !err.formField || err.formField === this), {
		...ngDevMode ? { debugName: "errors" } : {},
		equal: shallowArrayEquals
	});
	isFieldBinding = false;
	resetter = () => {};
	parseErrorsResetCallback;
	setParseErrors(source) {
		this.parseErrorsSource.set(source);
	}
	set onReset(callback) {
		this.parseErrorsResetCallback = callback;
	}
	get onReset() {
		return this.parseErrorsResetCallback;
	}
	get controlValueAccessor() {
		if (!this.controlValueAccessors || this.controlValueAccessors.length === 0) return this.interopNgControl?.valueAccessor ?? void 0;
		return selectValueAccessor(this.interopNgControl, this.controlValueAccessors) ?? void 0;
	}
	installClassBindingEffect() {
		const classes = Object.entries(this.config?.classes ?? {}).map(([className, computation]) => [className, computed(() => computation(this))]);
		if (classes.length === 0) return;
		const bindings = createBindings();
		afterRenderEffect({ write: () => {
			if (this.state().structure.isOrphaned()) return;
			for (const [className, computation] of classes) {
				const active = computation();
				if (bindingUpdated(bindings, className, active)) {
					if (active) this.renderer.addClass(this.element, className);
					else this.renderer.removeClass(this.element, className);
				}
			}
		} }, { injector: this.injector });
	}
	focus(options) {
		this.focuser(options);
	}
	reset() {
		this.resetter();
		this.parseErrorsResetCallback?.(this.state().value());
	}
	registerAsBinding(bindingOptions) {
		if (this.isFieldBinding) throw new RuntimeError(1913, typeof ngDevMode !== "undefined" && ngDevMode && "FormField already registered as a binding");
		this.isFieldBinding = true;
		this.installClassBindingEffect();
		if (bindingOptions?.focus) this.focuser = (focusOptions) => bindingOptions.focus(focusOptions);
		if (bindingOptions?.reset) this.resetter = () => bindingOptions.reset();
		effect((onCleanup) => {
			const fieldNode = this.state();
			fieldNode.nodeState.formFieldBindings.update((controls) => [...controls, this]);
			onCleanup(() => {
				const remaining = fieldNode.nodeState.formFieldBindings().filter((c) => c !== this);
				fieldNode.nodeState.formFieldBindings.set(remaining);
				if (remaining.length === 0 && !fieldNode.structure.isOrphaned()) fieldNode.flushSync();
			});
		}, { injector: this.injector });
		if (typeof ngDevMode !== "undefined" && ngDevMode) effect(() => {
			const fieldNode = this.state();
			if (fieldNode.hidden()) {
				const path = fieldNode.structure.pathKeys().join(".") || "<root>";
				console.warn(formatRuntimeError(1916, `Field '${path}' is hidden but is being rendered. Hidden fields should be removed from the DOM using @if.`));
			}
		}, { injector: this.injector });
	}
	[ɵNgFieldDirective];
	ɵngControlCreate(host) {
		if (host.hasPassThrough) return;
		if (this.controlValueAccessor) this.ɵngControlUpdate = cvaControlCreate(host, this);
		else if (host.customControl) this.ɵngControlUpdate = customControlCreate(host, this);
		else if (this.elementIsNativeFormElement) this.ɵngControlUpdate = nativeControlCreate(host, this, this.parseErrorsSource, this.validityMonitor);
		else throw new RuntimeError(1914, typeof ngDevMode !== "undefined" && ngDevMode && `${host.descriptor} is an invalid [formField] directive host. The host must be a native form control (such as <input>', '<select>', or '<textarea>') or a custom form control with a 'value' or 'checked' model.`);
	}
	ɵngControlUpdate;
	elementAcceptsNativeProperty(key) {
		if (!this.elementIsNativeFormElement) return false;
		switch (key) {
			case "min":
			case "max": return this._elementAcceptsMinMax ??= elementAcceptsMinMax(this.element);
			case "minLength":
			case "maxLength": return this.elementAcceptsTextualValues;
			case "disabled":
			case "required":
			case "readonly":
			case "name": return true;
			default: return false;
		}
	}
	static ɵfac = function FormField_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || FormField)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: FormField,
		selectors: [[
			"",
			"formField",
			""
		]],
		inputs: { field: [
			1,
			"formField",
			"field"
		] },
		exportAs: ["formField"],
		features: [ɵɵProvidersFeature([
			{
				provide: FORM_FIELD,
				useExisting: FormField
			},
			{
				provide: NgControl,
				useFactory: () => inject(FormField).interopNgControl
			},
			{
				provide: ɵFORM_CONTROL_INTEGRATION,
				useFactory: () => inject(FORM_FIELD, { self: true })
			}
		]), ɵɵControlFeature("formField")]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormField, [{
		type: Directive,
		args: [{
			selector: "[formField]",
			exportAs: "formField",
			providers: [
				{
					provide: FORM_FIELD,
					useExisting: FormField
				},
				{
					provide: NgControl,
					useFactory: () => inject(FormField).interopNgControl
				},
				{
					provide: ɵFORM_CONTROL_INTEGRATION,
					useFactory: () => inject(FORM_FIELD, { self: true })
				}
			]
		}]
	}], null, { field: [{
		type: Input,
		args: [{
			isSignal: true,
			alias: "formField",
			required: true
		}]
	}] });
})();
var FormRoot = class FormRoot {
	fieldTree = input.required({
		...ngDevMode ? { debugName: "fieldTree" } : {},
		alias: "formRoot"
	});
	onSubmit(event) {
		event.preventDefault();
		untracked(() => {
			const fieldTree = this.fieldTree();
			if (fieldTree().structure.fieldManager.submitOptions) submit(fieldTree);
		});
	}
	static ɵfac = function FormRoot_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || FormRoot)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: FormRoot,
		selectors: [[
			"form",
			"formRoot",
			""
		]],
		hostAttrs: ["novalidate", ""],
		hostBindings: function FormRoot_HostBindings(rf, ctx) {
			if (rf & 1) ɵɵlistener("submit", function FormRoot_submit_HostBindingHandler($event) {
				return ctx.onSubmit($event);
			});
		},
		inputs: { fieldTree: [
			1,
			"formRoot",
			"fieldTree"
		] }
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(FormRoot, [{
		type: Directive,
		args: [{
			selector: "form[formRoot]",
			host: {
				"novalidate": "",
				"(submit)": "onSubmit($event)"
			}
		}]
	}], null, { fieldTree: [{
		type: Input,
		args: [{
			isSignal: true,
			alias: "formRoot",
			required: true
		}]
	}] });
})();
// node_modules/@angular/cdk/fesm2022/observers-private.mjs
var loopLimitExceededErrorHandler = (e) => {
	if (e instanceof ErrorEvent && e.message === "ResizeObserver loop limit exceeded") console.error(`${e.message}. This could indicate a performance issue with your app. See https://github.com/WICG/resize-observer/blob/master/explainer.md#error-handling`);
};
var SingleBoxSharedResizeObserver = class {
	_box;
	_destroyed = new Subject();
	_resizeSubject = new Subject();
	_resizeObserver;
	_elementObservables = /* @__PURE__ */ new Map();
	constructor(_box) {
		this._box = _box;
		if (typeof ResizeObserver !== "undefined") this._resizeObserver = new ResizeObserver((entries) => this._resizeSubject.next(entries));
	}
	observe(target) {
		if (!this._elementObservables.has(target)) this._elementObservables.set(target, new Observable((observer) => {
			const subscription = this._resizeSubject.subscribe(observer);
			this._resizeObserver?.observe(target, { box: this._box });
			return () => {
				this._resizeObserver?.unobserve(target);
				subscription.unsubscribe();
				this._elementObservables.delete(target);
			};
		}).pipe(filter((entries) => entries.some((entry) => entry.target === target)), shareReplay({
			bufferSize: 1,
			refCount: true
		}), takeUntil(this._destroyed)));
		return this._elementObservables.get(target);
	}
	destroy() {
		this._destroyed.next();
		this._destroyed.complete();
		this._resizeSubject.complete();
		this._elementObservables.clear();
	}
};
var SharedResizeObserver = class SharedResizeObserver {
	_cleanupErrorListener;
	_observers = /* @__PURE__ */ new Map();
	_ngZone = inject(NgZone);
	constructor() {
		if (typeof ResizeObserver !== "undefined" && (typeof ngDevMode === "undefined" || ngDevMode)) this._ngZone.runOutsideAngular(() => {
			const renderer = inject(RendererFactory2).createRenderer(null, null);
			this._cleanupErrorListener = renderer.listen("window", "error", loopLimitExceededErrorHandler);
		});
	}
	ngOnDestroy() {
		for (const [, observer] of this._observers) observer.destroy();
		this._observers.clear();
		this._cleanupErrorListener?.();
	}
	observe(target, options) {
		const box = options?.box || "content-box";
		if (!this._observers.has(box)) this._observers.set(box, new SingleBoxSharedResizeObserver(box));
		return this._observers.get(box).observe(target);
	}
	static ɵfac = function SharedResizeObserver_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || SharedResizeObserver)();
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineService({
		token: SharedResizeObserver,
		factory: SharedResizeObserver.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SharedResizeObserver, [{ type: Service }], () => [], null);
})();
// node_modules/@angular/material/fesm2022/_form-field-chunk.mjs
var MatLabel = class MatLabel {
	static ɵfac = function MatLabel_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatLabel)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatLabel,
		selectors: [["mat-label"]]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatLabel, [{
		type: Directive,
		args: [{ selector: "mat-label" }]
	}], null, null);
})();
var MAT_ERROR = new InjectionToken("MatError");
var MatError = class MatError {
	id = inject(_IdGenerator).getId("mat-mdc-error-");
	static ɵfac = function MatError_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatError)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatError,
		selectors: [["mat-error"], [
			"",
			"matError",
			""
		]],
		hostAttrs: [
			1,
			"mat-mdc-form-field-error",
			"mat-mdc-form-field-bottom-align"
		],
		hostVars: 1,
		hostBindings: function MatError_HostBindings(rf, ctx) {
			if (rf & 2) ɵɵdomProperty("id", ctx.id);
		},
		inputs: { id: "id" },
		features: [ɵɵProvidersFeature([{
			provide: MAT_ERROR,
			useExisting: MatError
		}])]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatError, [{
		type: Directive,
		args: [{
			selector: "mat-error, [matError]",
			host: {
				"class": "mat-mdc-form-field-error mat-mdc-form-field-bottom-align",
				"[id]": "id"
			},
			providers: [{
				provide: MAT_ERROR,
				useExisting: MatError
			}]
		}]
	}], null, { id: [{ type: Input }] });
})();
var MatHint = class MatHint {
	align = "start";
	id = inject(_IdGenerator).getId("mat-mdc-hint-");
	static ɵfac = function MatHint_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatHint)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatHint,
		selectors: [["mat-hint"]],
		hostAttrs: [
			1,
			"mat-mdc-form-field-hint",
			"mat-mdc-form-field-bottom-align"
		],
		hostVars: 4,
		hostBindings: function MatHint_HostBindings(rf, ctx) {
			if (rf & 2) {
				ɵɵdomProperty("id", ctx.id);
				ɵɵattribute("align", null);
				ɵɵclassProp("mat-mdc-form-field-hint-end", ctx.align === "end");
			}
		},
		inputs: {
			align: "align",
			id: "id"
		}
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatHint, [{
		type: Directive,
		args: [{
			selector: "mat-hint",
			host: {
				"class": "mat-mdc-form-field-hint mat-mdc-form-field-bottom-align",
				"[class.mat-mdc-form-field-hint-end]": "align === \"end\"",
				"[id]": "id",
				"[attr.align]": "null"
			}
		}]
	}], null, {
		align: [{ type: Input }],
		id: [{ type: Input }]
	});
})();
var MAT_PREFIX = new InjectionToken("MatPrefix");
var MatPrefix = class MatPrefix {
	set _isTextSelector(value) {
		this._isText = true;
	}
	_isText = false;
	static ɵfac = function MatPrefix_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatPrefix)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatPrefix,
		selectors: [
			[
				"",
				"matPrefix",
				""
			],
			[
				"",
				"matIconPrefix",
				""
			],
			[
				"",
				"matTextPrefix",
				""
			]
		],
		inputs: { _isTextSelector: [
			0,
			"matTextPrefix",
			"_isTextSelector"
		] },
		features: [ɵɵProvidersFeature([{
			provide: MAT_PREFIX,
			useExisting: MatPrefix
		}])]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatPrefix, [{
		type: Directive,
		args: [{
			selector: "[matPrefix], [matIconPrefix], [matTextPrefix]",
			providers: [{
				provide: MAT_PREFIX,
				useExisting: MatPrefix
			}]
		}]
	}], null, { _isTextSelector: [{
		type: Input,
		args: ["matTextPrefix"]
	}] });
})();
var MAT_SUFFIX = new InjectionToken("MatSuffix");
var MatSuffix = class MatSuffix {
	set _isTextSelector(value) {
		this._isText = true;
	}
	_isText = false;
	static ɵfac = function MatSuffix_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatSuffix)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatSuffix,
		selectors: [
			[
				"",
				"matSuffix",
				""
			],
			[
				"",
				"matIconSuffix",
				""
			],
			[
				"",
				"matTextSuffix",
				""
			]
		],
		inputs: { _isTextSelector: [
			0,
			"matTextSuffix",
			"_isTextSelector"
		] },
		features: [ɵɵProvidersFeature([{
			provide: MAT_SUFFIX,
			useExisting: MatSuffix
		}])]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatSuffix, [{
		type: Directive,
		args: [{
			selector: "[matSuffix], [matIconSuffix], [matTextSuffix]",
			providers: [{
				provide: MAT_SUFFIX,
				useExisting: MatSuffix
			}]
		}]
	}], null, { _isTextSelector: [{
		type: Input,
		args: ["matTextSuffix"]
	}] });
})();
var FLOATING_LABEL_PARENT = new InjectionToken("FloatingLabelParent");
var MatFormFieldFloatingLabel = class MatFormFieldFloatingLabel {
	_elementRef = inject(ElementRef);
	get floating() {
		return this._floating;
	}
	set floating(value) {
		this._floating = value;
		if (this.monitorResize) this._handleResize();
	}
	_floating = false;
	get monitorResize() {
		return this._monitorResize;
	}
	set monitorResize(value) {
		this._monitorResize = value;
		if (this._monitorResize) this._subscribeToResize();
		else this._resizeSubscription.unsubscribe();
	}
	_monitorResize = false;
	_resizeObserver = inject(SharedResizeObserver);
	_ngZone = inject(NgZone);
	_parent = inject(FLOATING_LABEL_PARENT);
	_resizeSubscription = new Subscription();
	ngOnDestroy() {
		this._resizeSubscription.unsubscribe();
	}
	getWidth() {
		return estimateScrollWidth(this._elementRef.nativeElement);
	}
	get element() {
		return this._elementRef.nativeElement;
	}
	_handleResize() {
		setTimeout(() => this._parent._handleLabelResized());
	}
	_subscribeToResize() {
		this._resizeSubscription.unsubscribe();
		this._ngZone.runOutsideAngular(() => {
			this._resizeSubscription = this._resizeObserver.observe(this._elementRef.nativeElement, { box: "border-box" }).subscribe(() => this._handleResize());
		});
	}
	static ɵfac = function MatFormFieldFloatingLabel_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatFormFieldFloatingLabel)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatFormFieldFloatingLabel,
		selectors: [[
			"label",
			"matFormFieldFloatingLabel",
			""
		]],
		hostAttrs: [
			1,
			"mdc-floating-label",
			"mat-mdc-floating-label"
		],
		hostVars: 2,
		hostBindings: function MatFormFieldFloatingLabel_HostBindings(rf, ctx) {
			if (rf & 2) ɵɵclassProp("mdc-floating-label--float-above", ctx.floating);
		},
		inputs: {
			floating: "floating",
			monitorResize: "monitorResize"
		}
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldFloatingLabel, [{
		type: Directive,
		args: [{
			selector: "label[matFormFieldFloatingLabel]",
			host: {
				"class": "mdc-floating-label mat-mdc-floating-label",
				"[class.mdc-floating-label--float-above]": "floating"
			}
		}]
	}], null, {
		floating: [{ type: Input }],
		monitorResize: [{ type: Input }]
	});
})();
function estimateScrollWidth(element) {
	const htmlEl = element;
	if (htmlEl.offsetParent !== null) return htmlEl.scrollWidth;
	const clone = htmlEl.cloneNode(true);
	clone.style.setProperty("position", "absolute");
	clone.style.setProperty("transform", "translate(-9999px, -9999px)");
	document.documentElement.appendChild(clone);
	const scrollWidth = clone.scrollWidth;
	clone.remove();
	return scrollWidth;
}
var ACTIVATE_CLASS = "mdc-line-ripple--active";
var DEACTIVATING_CLASS = "mdc-line-ripple--deactivating";
var MatFormFieldLineRipple = class MatFormFieldLineRipple {
	_elementRef = inject(ElementRef);
	_cleanupTransitionEnd;
	constructor() {
		const ngZone = inject(NgZone);
		const renderer = inject(Renderer2);
		ngZone.runOutsideAngular(() => {
			this._cleanupTransitionEnd = renderer.listen(this._elementRef.nativeElement, "transitionend", this._handleTransitionEnd);
		});
	}
	activate() {
		const classList = this._elementRef.nativeElement.classList;
		classList.remove(DEACTIVATING_CLASS);
		classList.add(ACTIVATE_CLASS);
	}
	deactivate() {
		this._elementRef.nativeElement.classList.add(DEACTIVATING_CLASS);
	}
	_handleTransitionEnd = (event) => {
		const classList = this._elementRef.nativeElement.classList;
		const isDeactivating = classList.contains(DEACTIVATING_CLASS);
		if (event.propertyName === "opacity" && isDeactivating) classList.remove(ACTIVATE_CLASS, DEACTIVATING_CLASS);
	};
	ngOnDestroy() {
		this._cleanupTransitionEnd();
	}
	static ɵfac = function MatFormFieldLineRipple_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatFormFieldLineRipple)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({
		type: MatFormFieldLineRipple,
		selectors: [[
			"div",
			"matFormFieldLineRipple",
			""
		]],
		hostAttrs: [1, "mdc-line-ripple"]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldLineRipple, [{
		type: Directive,
		args: [{
			selector: "div[matFormFieldLineRipple]",
			host: { "class": "mdc-line-ripple" }
		}]
	}], () => [], null);
})();
var MatFormFieldNotchedOutline = class MatFormFieldNotchedOutline {
	_elementRef = inject(ElementRef);
	_ngZone = inject(NgZone);
	open = false;
	_notch;
	ngAfterViewInit() {
		const element = this._elementRef.nativeElement;
		const label = element.querySelector(".mdc-floating-label");
		if (label) {
			element.classList.add("mdc-notched-outline--upgraded");
			if (typeof requestAnimationFrame === "function") {
				label.style.transitionDuration = "0s";
				this._ngZone.runOutsideAngular(() => {
					requestAnimationFrame(() => label.style.transitionDuration = "");
				});
			}
		} else element.classList.add("mdc-notched-outline--no-label");
	}
	_setNotchWidth(labelWidth) {
		const notch = this._notch.nativeElement;
		if (!this.open || !labelWidth) notch.style.width = "";
		else notch.style.width = `calc(${labelWidth}px * var(--mat-mdc-form-field-floating-label-scale, 0.75) + 9px)`;
	}
	_setMaxWidth(prefixAndSuffixWidth) {
		this._notch.nativeElement.style.setProperty("--mat-form-field-notch-max-width", `calc(100% - ${prefixAndSuffixWidth}px)`);
	}
	static ɵfac = function MatFormFieldNotchedOutline_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatFormFieldNotchedOutline)();
	};
	static ɵcmp = (function() {
		const _c0 = ["notch"];
		return /*@__PURE__*/ ɵɵdefineComponent({
			type: MatFormFieldNotchedOutline,
			selectors: [[
				"div",
				"matFormFieldNotchedOutline",
				""
			]],
			viewQuery: function MatFormFieldNotchedOutline_Query(rf, ctx) {
				if (rf & 1) ɵɵviewQuery(_c0, 5);
				if (rf & 2) {
					let _t = void 0;
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._notch = _t.first);
				}
			},
			hostAttrs: [1, "mdc-notched-outline"],
			hostVars: 2,
			hostBindings: function MatFormFieldNotchedOutline_HostBindings(rf, ctx) {
				if (rf & 2) ɵɵclassProp("mdc-notched-outline--notched", ctx.open);
			},
			inputs: { open: [
				0,
				"matFormFieldNotchedOutlineOpen",
				"open"
			] },
			ngContentSelectors: ["*"],
			decls: 5,
			vars: 0,
			consts: [
				["notch", ""],
				[
					1,
					"mat-mdc-notch-piece",
					"mdc-notched-outline__leading"
				],
				[
					1,
					"mat-mdc-notch-piece",
					"mdc-notched-outline__notch"
				],
				[
					1,
					"mat-mdc-notch-piece",
					"mdc-notched-outline__trailing"
				]
			],
			template: function MatFormFieldNotchedOutline_Template(rf, ctx) {
				if (rf & 1) {
					ɵɵprojectionDef();
					ɵɵdomElement(0, "div", 1);
					ɵɵdomElementStart(1, "div", 2, 0);
					ɵɵprojection(3);
					ɵɵdomElementEnd();
					ɵɵdomElement(4, "div", 3);
				}
			},
			encapsulation: 2
		});
	})();
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldNotchedOutline, [{
		type: Component,
		args: [{
			selector: "div[matFormFieldNotchedOutline]",
			host: {
				"class": "mdc-notched-outline",
				"[class.mdc-notched-outline--notched]": "open"
			},
			encapsulation: ViewEncapsulation.None,
			template: "<div class=\"mat-mdc-notch-piece mdc-notched-outline__leading\"></div>\n<div class=\"mat-mdc-notch-piece mdc-notched-outline__notch\" #notch>\n  <ng-content></ng-content>\n</div>\n<div class=\"mat-mdc-notch-piece mdc-notched-outline__trailing\"></div>\n"
		}]
	}], null, {
		open: [{
			type: Input,
			args: ["matFormFieldNotchedOutlineOpen"]
		}],
		_notch: [{
			type: ViewChild,
			args: ["notch"]
		}]
	});
})();
var MatFormFieldControl = class MatFormFieldControl {
	id;
	ngField = null;
	ngControl = null;
	focused = false;
	empty = false;
	shouldLabelFloat = false;
	required = false;
	disabled = false;
	errorState = false;
	controlType;
	autofilled;
	userAriaDescribedBy;
	disableAutomaticLabeling;
	describedByIds;
	stateChanges = null;
	value;
	static ɵfac = function MatFormFieldControl_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatFormFieldControl)();
	};
	static ɵdir = /*@__PURE__*/ ɵɵdefineDirective({ type: MatFormFieldControl });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldControl, [{ type: Directive }], null, null);
})();
function getMatFormFieldPlaceholderConflictError() {
	return Error("Placeholder attribute and child element were both specified.");
}
function getMatFormFieldDuplicatedHintError(align) {
	return Error(`A hint was already declared for 'align="${align}"'.`);
}
function getMatFormFieldMissingControlError() {
	return Error("mat-form-field must contain a MatFormFieldControl.");
}
var MAT_FORM_FIELD = new InjectionToken("MatFormField");
var MAT_FORM_FIELD_DEFAULT_OPTIONS = new InjectionToken("MAT_FORM_FIELD_DEFAULT_OPTIONS");
var DEFAULT_APPEARANCE = "fill";
var DEFAULT_FLOAT_LABEL = "auto";
var DEFAULT_SUBSCRIPT_SIZING = "fixed";
var FLOATING_LABEL_DEFAULT_DOCKED_TRANSFORM = `translateY(-50%)`;
var MatFormField = class MatFormField {
	_elementRef = inject(ElementRef);
	_changeDetectorRef = inject(ChangeDetectorRef);
	_platform = inject(Platform);
	_idGenerator = inject(_IdGenerator);
	_ngZone = inject(NgZone);
	_defaults = inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { optional: true });
	_currentDirection;
	_unwrapMaybeSignal(value) {
		return isSignal(value) ? value() : value;
	}
	_textField;
	_iconPrefixContainer;
	_textPrefixContainer;
	_iconSuffixContainer;
	_textSuffixContainer;
	_floatingLabel;
	_notchedOutline;
	_lineRipple;
	_iconPrefixContainerSignal = viewChild("iconPrefixContainer", ...ngDevMode ? [{ debugName: "_iconPrefixContainerSignal" }] : []);
	_textPrefixContainerSignal = viewChild("textPrefixContainer", ...ngDevMode ? [{ debugName: "_textPrefixContainerSignal" }] : []);
	_iconSuffixContainerSignal = viewChild("iconSuffixContainer", ...ngDevMode ? [{ debugName: "_iconSuffixContainerSignal" }] : []);
	_textSuffixContainerSignal = viewChild("textSuffixContainer", ...ngDevMode ? [{ debugName: "_textSuffixContainerSignal" }] : []);
	_prefixSuffixContainers = computed(() => {
		return [
			this._iconPrefixContainerSignal(),
			this._textPrefixContainerSignal(),
			this._iconSuffixContainerSignal(),
			this._textSuffixContainerSignal()
		].map((container) => container?.nativeElement).filter((e) => e !== void 0);
	}, ...ngDevMode ? [{ debugName: "_prefixSuffixContainers" }] : []);
	_formFieldControl;
	_prefixChildren;
	_suffixChildren;
	_errorChildren;
	_hintChildren;
	_labelChild = contentChild(MatLabel, ...ngDevMode ? [{ debugName: "_labelChild" }] : []);
	get hideRequiredMarker() {
		return this._hideRequiredMarker;
	}
	set hideRequiredMarker(value) {
		this._hideRequiredMarker = coerceBooleanProperty(value);
	}
	_hideRequiredMarker = false;
	color = "primary";
	get floatLabel() {
		return this._floatLabel || this._defaults?.floatLabel || DEFAULT_FLOAT_LABEL;
	}
	set floatLabel(value) {
		if (value !== this._floatLabel) {
			this._floatLabel = value;
			this._changeDetectorRef.markForCheck();
		}
	}
	_floatLabel;
	get appearance() {
		return this._appearanceSignal();
	}
	set appearance(value) {
		const newAppearance = value || this._defaults?.appearance || DEFAULT_APPEARANCE;
		if (typeof ngDevMode === "undefined" || ngDevMode) {
			if (newAppearance !== "fill" && newAppearance !== "outline") throw new Error(`MatFormField: Invalid appearance "${newAppearance}", valid values are "fill" or "outline".`);
		}
		this._appearanceSignal.set(newAppearance);
	}
	_appearanceSignal = signal(DEFAULT_APPEARANCE, ...ngDevMode ? [{ debugName: "_appearanceSignal" }] : []);
	get subscriptSizing() {
		return this._subscriptSizing || this._defaults?.subscriptSizing || DEFAULT_SUBSCRIPT_SIZING;
	}
	set subscriptSizing(value) {
		this._subscriptSizing = value || this._defaults?.subscriptSizing || DEFAULT_SUBSCRIPT_SIZING;
	}
	_subscriptSizing = null;
	get hintLabel() {
		return this._hintLabel;
	}
	set hintLabel(value) {
		this._hintLabel = value;
		this._processHints();
	}
	_hintLabel = "";
	_hasIconPrefix = false;
	_hasTextPrefix = false;
	_hasIconSuffix = false;
	_hasTextSuffix = false;
	_labelId = this._idGenerator.getId("mat-mdc-form-field-label-");
	_hintLabelId = this._idGenerator.getId("mat-mdc-hint-");
	_describedByIds;
	get _control() {
		return this._explicitFormFieldControl || this._formFieldControl;
	}
	set _control(value) {
		this._explicitFormFieldControl = value;
	}
	_destroyed = new Subject();
	_isFocused = null;
	_explicitFormFieldControl;
	_previousControl = null;
	_previousControlValidatorFn = null;
	_stateChanges;
	_valueChanges;
	_describedByChanges;
	_outlineLabelOffsetResizeObserver = null;
	_animationsDisabled = _animationsDisabled();
	constructor() {
		const defaults = this._defaults;
		const dir = inject(Directionality);
		if (defaults) {
			if (defaults.appearance) this.appearance = defaults.appearance;
			this._hideRequiredMarker = Boolean(defaults?.hideRequiredMarker);
			if (defaults.color) this.color = defaults.color;
		}
		effect(() => this._currentDirection = dir.valueSignal());
		this._syncOutlineLabelOffset();
	}
	ngAfterViewInit() {
		this._updateFocusState();
		if (!this._animationsDisabled) this._ngZone.runOutsideAngular(() => {
			setTimeout(() => {
				this._elementRef.nativeElement.classList.add("mat-form-field-animations-enabled");
			}, 300);
		});
		this._changeDetectorRef.detectChanges();
	}
	ngAfterContentInit() {
		this._assertFormFieldControl();
		this._initializeSubscript();
		this._initializePrefixAndSuffix();
	}
	ngAfterContentChecked() {
		this._assertFormFieldControl();
		if (this._control !== this._previousControl) {
			this._initializeControl(this._previousControl);
			if (this._control.ngControl && this._control.ngControl.control) this._previousControlValidatorFn = isFieldTree(this._control.ngField) ? null : this._control.ngControl.control.validator;
			this._previousControl = this._control;
			this._changeDetectorRef.markForCheck();
		}
		if (this._control.ngControl && this._control.ngControl.control && !isFieldTree(this._control.ngField)) {
			if (this._control.ngControl.control.validator !== this._previousControlValidatorFn) this._changeDetectorRef.markForCheck();
		}
	}
	ngOnDestroy() {
		this._outlineLabelOffsetResizeObserver?.disconnect();
		this._stateChanges?.unsubscribe();
		this._valueChanges?.unsubscribe();
		this._describedByChanges?.unsubscribe();
		this._destroyed.next();
		this._destroyed.complete();
	}
	getLabelId = computed(() => this._hasFloatingLabel() ? this._labelId : null, ...ngDevMode ? [{ debugName: "getLabelId" }] : []);
	getConnectedOverlayOrigin() {
		return this._textField || this._elementRef;
	}
	_animateAndLockLabel() {
		if (this._hasFloatingLabel()) this.floatLabel = "always";
	}
	_initializeControl(previousControl) {
		const control = this._control;
		const classPrefix = "mat-mdc-form-field-type-";
		if (previousControl) this._elementRef.nativeElement.classList.remove(classPrefix + previousControl.controlType);
		if (control.controlType) this._elementRef.nativeElement.classList.add(classPrefix + control.controlType);
		this._stateChanges?.unsubscribe();
		this._stateChanges = control.stateChanges?.subscribe(() => {
			this._updateFocusState();
			this._changeDetectorRef.markForCheck();
		});
		this._describedByChanges?.unsubscribe();
		this._describedByChanges = control.stateChanges?.pipe(startWith([void 0, void 0]), map(() => [this._unwrapMaybeSignal(control.errorState), control.userAriaDescribedBy]), pairwise(), filter(([[prevErrorState, prevDescribedBy], [currentErrorState, currentDescribedBy]]) => {
			return prevErrorState !== currentErrorState || prevDescribedBy !== currentDescribedBy;
		})).subscribe(() => this._syncDescribedByIds());
		this._valueChanges?.unsubscribe();
		if (control.ngControl && control.ngControl.valueChanges && !isFieldTree(control.ngField)) this._valueChanges = control.ngControl.valueChanges.pipe(takeUntil(this._destroyed)).subscribe(() => this._changeDetectorRef.markForCheck());
	}
	_checkPrefixAndSuffixTypes() {
		this._hasIconPrefix = !!this._prefixChildren.find((p) => !p._isText);
		this._hasTextPrefix = !!this._prefixChildren.find((p) => p._isText);
		this._hasIconSuffix = !!this._suffixChildren.find((s) => !s._isText);
		this._hasTextSuffix = !!this._suffixChildren.find((s) => s._isText);
	}
	_initializePrefixAndSuffix() {
		this._checkPrefixAndSuffixTypes();
		merge(this._prefixChildren.changes, this._suffixChildren.changes).subscribe(() => {
			this._checkPrefixAndSuffixTypes();
			this._changeDetectorRef.markForCheck();
		});
	}
	_initializeSubscript() {
		this._hintChildren.changes.subscribe(() => {
			this._processHints();
			this._changeDetectorRef.markForCheck();
		});
		this._errorChildren.changes.subscribe(() => {
			this._syncDescribedByIds();
			this._changeDetectorRef.markForCheck();
		});
		this._validateHints();
		this._syncDescribedByIds();
	}
	_assertFormFieldControl() {
		if (!this._control && (typeof ngDevMode === "undefined" || ngDevMode)) throw getMatFormFieldMissingControlError();
	}
	_updateFocusState() {
		const controlFocused = this._unwrapMaybeSignal(this._control.focused);
		if (controlFocused && !this._isFocused) {
			this._isFocused = true;
			this._lineRipple?.activate();
		} else if (!controlFocused && (this._isFocused || this._isFocused === null)) {
			this._isFocused = false;
			this._lineRipple?.deactivate();
		}
		this._elementRef.nativeElement.classList.toggle("mat-focused", controlFocused);
		this._textField?.nativeElement.classList.toggle("mdc-text-field--focused", controlFocused);
	}
	_syncOutlineLabelOffset() {
		afterRenderEffect({
			earlyRead: () => {
				if (this._appearanceSignal() !== "outline") {
					this._outlineLabelOffsetResizeObserver?.disconnect();
					return null;
				}
				if (globalThis.ResizeObserver) {
					this._outlineLabelOffsetResizeObserver ||= new globalThis.ResizeObserver(() => {
						this._writeOutlinedLabelStyles(this._getOutlinedLabelOffset());
					});
					for (const el of this._prefixSuffixContainers()) this._outlineLabelOffsetResizeObserver.observe(el, { box: "border-box" });
				}
				return this._getOutlinedLabelOffset();
			},
			write: (labelStyles) => this._writeOutlinedLabelStyles(labelStyles())
		});
	}
	_shouldAlwaysFloat() {
		return this.floatLabel === "always";
	}
	_hasOutline() {
		return this.appearance === "outline";
	}
	_forceDisplayInfixLabel() {
		return !this._platform.isBrowser && this._prefixChildren.length && !this._shouldLabelFloat();
	}
	_hasFloatingLabel = computed(() => !!this._labelChild(), ...ngDevMode ? [{ debugName: "_hasFloatingLabel" }] : []);
	_shouldLabelFloat() {
		if (!this._hasFloatingLabel()) return false;
		return this._shouldAlwaysFloat() || this._unwrapMaybeSignal(this._control.shouldLabelFloat);
	}
	_shouldForward(prop) {
		const rawControl = this._control?.ngField || this._control?.ngControl;
		if (!rawControl) return false;
		if (isFieldTree(rawControl)) {
			const control = rawControl();
			if (prop === "valid") return control.valid();
			else if (prop === "dirty") return control.dirty();
			else if (prop === "touched") return control.touched();
			else if (prop === "pending") return control.pending();
			else if (prop === "untouched") return !control.touched();
			else if (prop === "pristine") return !control.dirty();
			else if (prop === "invalid") return !control.valid();
			return false;
		} else {
			const control = rawControl;
			if (prop === "valid") return control.valid;
			else if (prop === "dirty") return control.dirty;
			else if (prop === "touched") return control.touched;
			else if (prop === "pending") return control.pending;
			else if (prop === "untouched") return control.untouched;
			else if (prop === "pristine") return control.pristine;
			else if (prop === "invalid") return control.invalid;
			return false;
		}
	}
	_getSubscriptMessageType() {
		return this._errorChildren && this._errorChildren.length > 0 && this._unwrapMaybeSignal(this._control.errorState) ? "error" : "hint";
	}
	_handleLabelResized() {
		this._refreshOutlineNotchWidth();
	}
	_refreshOutlineNotchWidth() {
		if (!this._hasOutline() || !this._floatingLabel || !this._shouldLabelFloat()) this._notchedOutline?._setNotchWidth(0);
		else this._notchedOutline?._setNotchWidth(this._floatingLabel.getWidth());
	}
	_processHints() {
		this._validateHints();
		this._syncDescribedByIds();
	}
	_validateHints() {
		if (this._hintChildren && (typeof ngDevMode === "undefined" || ngDevMode)) {
			let startHint;
			let endHint;
			this._hintChildren.forEach((hint) => {
				if (hint.align === "start") {
					if (startHint || this.hintLabel) throw getMatFormFieldDuplicatedHintError("start");
					startHint = hint;
				} else if (hint.align === "end") {
					if (endHint) throw getMatFormFieldDuplicatedHintError("end");
					endHint = hint;
				}
			});
		}
	}
	_syncDescribedByIds() {
		if (this._control) {
			let ids = [];
			if (this._control.userAriaDescribedBy && typeof this._control.userAriaDescribedBy === "string") ids.push(...this._control.userAriaDescribedBy.split(" "));
			if (this._getSubscriptMessageType() === "hint") {
				const startHint = this._hintChildren ? this._hintChildren.find((hint) => hint.align === "start") : null;
				const endHint = this._hintChildren ? this._hintChildren.find((hint) => hint.align === "end") : null;
				if (startHint) ids.push(startHint.id);
				else if (this._hintLabel) ids.push(this._hintLabelId);
				if (endHint) ids.push(endHint.id);
			} else if (this._errorChildren) ids.push(...this._errorChildren.map((error) => error.id));
			const existingDescribedBy = this._control.describedByIds;
			let toAssign;
			if (existingDescribedBy) {
				const exclude = this._describedByIds || ids;
				toAssign = ids.concat(existingDescribedBy.filter((id) => id && !exclude.includes(id)));
			} else toAssign = ids;
			this._control.setDescribedByIds(toAssign);
			this._describedByIds = ids;
		}
	}
	_getOutlinedLabelOffset() {
		if (!this._hasOutline() || !this._floatingLabel) return null;
		if (!this._iconPrefixContainer && !this._textPrefixContainer) return ["", null];
		if (!this._isAttachedToDom()) return null;
		const iconPrefixContainer = this._iconPrefixContainer?.nativeElement;
		const textPrefixContainer = this._textPrefixContainer?.nativeElement;
		const iconSuffixContainer = this._iconSuffixContainer?.nativeElement;
		const textSuffixContainer = this._textSuffixContainer?.nativeElement;
		const iconPrefixContainerWidth = iconPrefixContainer?.getBoundingClientRect().width ?? 0;
		const textPrefixContainerWidth = textPrefixContainer?.getBoundingClientRect().width ?? 0;
		const iconSuffixContainerWidth = iconSuffixContainer?.getBoundingClientRect().width ?? 0;
		const textSuffixContainerWidth = textSuffixContainer?.getBoundingClientRect().width ?? 0;
		return [`var(--mat-mdc-form-field-label-transform, ${FLOATING_LABEL_DEFAULT_DOCKED_TRANSFORM} translateX(${`calc(${this._currentDirection === "rtl" ? "-1" : "1"} * (${`${iconPrefixContainerWidth + textPrefixContainerWidth}px`} + var(--mat-mdc-form-field-label-offset-x, 0px)))`}))`, iconPrefixContainerWidth + textPrefixContainerWidth + iconSuffixContainerWidth + textSuffixContainerWidth];
	}
	_writeOutlinedLabelStyles(styles) {
		if (styles !== null) {
			const [floatingLabelTransform, notchedOutlineWidth] = styles;
			if (this._floatingLabel) this._floatingLabel.element.style.transform = floatingLabelTransform;
			if (notchedOutlineWidth !== null) this._notchedOutline?._setMaxWidth(notchedOutlineWidth);
		}
	}
	_isAttachedToDom() {
		const element = this._elementRef.nativeElement;
		if (element.getRootNode) {
			const rootNode = element.getRootNode();
			return rootNode && rootNode !== element;
		}
		return document.documentElement.contains(element);
	}
	static ɵfac = function MatFormField_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatFormField)();
	};
	static ɵcmp = (function() {
		const _c0 = ["iconPrefixContainer"];
		const _c1 = ["textPrefixContainer"];
		const _c2 = ["iconSuffixContainer"];
		const _c3 = ["textSuffixContainer"];
		const _c4 = ["textField"];
		const _c5 = [
			"*",
			[["mat-label"]],
			[[
				"",
				"matPrefix",
				""
			], [
				"",
				"matIconPrefix",
				""
			]],
			[[
				"",
				"matTextPrefix",
				""
			]],
			[[
				"",
				"matTextSuffix",
				""
			]],
			[[
				"",
				"matSuffix",
				""
			], [
				"",
				"matIconSuffix",
				""
			]],
			[["mat-error"], [
				"",
				"matError",
				""
			]],
			[[
				"mat-hint",
				3,
				"align",
				"end"
			]],
			[[
				"mat-hint",
				"align",
				"end"
			]]
		];
		const _c6 = [
			"*",
			"mat-label",
			"[matPrefix], [matIconPrefix]",
			"[matTextPrefix]",
			"[matTextSuffix]",
			"[matSuffix], [matIconSuffix]",
			"mat-error, [matError]",
			"mat-hint:not([align='end'])",
			"mat-hint[align='end']"
		];
		function MatFormField_ng_template_0_Conditional_0_Conditional_2_Template(rf, ctx) {
			if (rf & 1) ɵɵelement(0, "span", 21);
		}
		function MatFormField_ng_template_0_Conditional_0_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "label", 20);
				ɵɵprojection(1, 1);
				ɵɵconditionalCreate(2, MatFormField_ng_template_0_Conditional_0_Conditional_2_Template, 1, 0, "span", 21);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext(2);
				ɵɵproperty("floating", ctx_r0._shouldLabelFloat())("monitorResize", ctx_r0._hasOutline())("id", ctx_r0._labelId);
				ɵɵattribute("for", ctx_r0._control.disableAutomaticLabeling ? null : ctx_r0._control.id);
				ɵɵadvance(2);
				ɵɵconditional(!ctx_r0.hideRequiredMarker && ctx_r0._unwrapMaybeSignal(ctx_r0._control.required) ? 2 : -1);
			}
		}
		function MatFormField_ng_template_0_Template(rf, ctx) {
			if (rf & 1) ɵɵconditionalCreate(0, MatFormField_ng_template_0_Conditional_0_Template, 3, 5, "label", 20);
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext();
				ɵɵconditional(ctx_r0._hasFloatingLabel() ? 0 : -1);
			}
		}
		function MatFormField_Conditional_4_Template(rf, ctx) {
			if (rf & 1) ɵɵelement(0, "div", 7);
		}
		function MatFormField_Conditional_6_Conditional_1_ng_template_0_Template(rf, ctx) {}
		function MatFormField_Conditional_6_Conditional_1_Template(rf, ctx) {
			if (rf & 1) ɵɵtemplate(0, MatFormField_Conditional_6_Conditional_1_ng_template_0_Template, 0, 0, "ng-template", 13);
			if (rf & 2) {
				ɵɵnextContext(2);
				const labelTemplate_r2 = ɵɵreference(1);
				ɵɵproperty("ngTemplateOutlet", labelTemplate_r2);
			}
		}
		function MatFormField_Conditional_6_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 9);
				ɵɵconditionalCreate(1, MatFormField_Conditional_6_Conditional_1_Template, 1, 1, null, 13);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext();
				ɵɵproperty("matFormFieldNotchedOutlineOpen", ctx_r0._shouldLabelFloat());
				ɵɵadvance();
				ɵɵconditional(!ctx_r0._forceDisplayInfixLabel() ? 1 : -1);
			}
		}
		function MatFormField_Conditional_7_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 10, 2);
				ɵɵprojection(2, 2);
				ɵɵelementEnd();
			}
		}
		function MatFormField_Conditional_8_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 11, 3);
				ɵɵprojection(2, 3);
				ɵɵelementEnd();
			}
		}
		function MatFormField_Conditional_10_ng_template_0_Template(rf, ctx) {}
		function MatFormField_Conditional_10_Template(rf, ctx) {
			if (rf & 1) ɵɵtemplate(0, MatFormField_Conditional_10_ng_template_0_Template, 0, 0, "ng-template", 13);
			if (rf & 2) {
				ɵɵnextContext();
				const labelTemplate_r2 = ɵɵreference(1);
				ɵɵproperty("ngTemplateOutlet", labelTemplate_r2);
			}
		}
		function MatFormField_Conditional_12_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 14, 4);
				ɵɵprojection(2, 4);
				ɵɵelementEnd();
			}
		}
		function MatFormField_Conditional_13_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 15, 5);
				ɵɵprojection(2, 5);
				ɵɵelementEnd();
			}
		}
		function MatFormField_Conditional_14_Template(rf, ctx) {
			if (rf & 1) ɵɵelement(0, "div", 16);
		}
		function MatFormField_Case_16_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 18);
				ɵɵprojection(1, 6);
				ɵɵelementEnd();
			}
		}
		function MatFormField_Case_17_Conditional_1_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "mat-hint", 22);
				ɵɵtext(1);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext(2);
				ɵɵproperty("id", ctx_r0._hintLabelId);
				ɵɵadvance();
				ɵɵtextInterpolate(ctx_r0.hintLabel);
			}
		}
		function MatFormField_Case_17_Template(rf, ctx) {
			if (rf & 1) {
				ɵɵelementStart(0, "div", 19);
				ɵɵconditionalCreate(1, MatFormField_Case_17_Conditional_1_Template, 2, 2, "mat-hint", 22);
				ɵɵprojection(2, 7);
				ɵɵelement(3, "div", 23);
				ɵɵprojection(4, 8);
				ɵɵelementEnd();
			}
			if (rf & 2) {
				const ctx_r0 = ɵɵnextContext();
				ɵɵadvance();
				ɵɵconditional(ctx_r0.hintLabel ? 1 : -1);
			}
		}
		return /*@__PURE__*/ ɵɵdefineComponent({
			type: MatFormField,
			selectors: [["mat-form-field"]],
			contentQueries: function MatFormField_ContentQueries(rf, ctx, dirIndex) {
				if (rf & 1) {
					ɵɵcontentQuerySignal(dirIndex, ctx._labelChild, MatLabel, 5);
					ɵɵcontentQuery(dirIndex, MatFormFieldControl, 5)(dirIndex, MAT_PREFIX, 5)(dirIndex, MAT_SUFFIX, 5)(dirIndex, MAT_ERROR, 5)(dirIndex, MatHint, 5);
				}
				if (rf & 2) {
					ɵɵqueryAdvance();
					let _t = void 0;
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._formFieldControl = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._prefixChildren = _t);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._suffixChildren = _t);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._errorChildren = _t);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._hintChildren = _t);
				}
			},
			viewQuery: function MatFormField_Query(rf, ctx) {
				if (rf & 1) {
					ɵɵviewQuerySignal(ctx._iconPrefixContainerSignal, _c0, 5)(ctx._textPrefixContainerSignal, _c1, 5)(ctx._iconSuffixContainerSignal, _c2, 5)(ctx._textSuffixContainerSignal, _c3, 5);
					ɵɵviewQuery(_c4, 5)(_c0, 5)(_c1, 5)(_c2, 5)(_c3, 5)(MatFormFieldFloatingLabel, 5)(MatFormFieldNotchedOutline, 5)(MatFormFieldLineRipple, 5);
				}
				if (rf & 2) {
					ɵɵqueryAdvance(4);
					let _t = void 0;
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._textField = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._iconPrefixContainer = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._textPrefixContainer = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._iconSuffixContainer = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._textSuffixContainer = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._floatingLabel = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._notchedOutline = _t.first);
					ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._lineRipple = _t.first);
				}
			},
			hostAttrs: [1, "mat-mdc-form-field"],
			hostVars: 38,
			hostBindings: function MatFormField_HostBindings(rf, ctx) {
				if (rf & 2) ɵɵclassProp("mat-mdc-form-field-label-always-float", ctx._shouldAlwaysFloat())("mat-mdc-form-field-has-icon-prefix", ctx._hasIconPrefix)("mat-mdc-form-field-has-icon-suffix", ctx._hasIconSuffix)("mat-form-field-invalid", ctx._unwrapMaybeSignal(ctx._control.errorState))("mat-form-field-disabled", ctx._unwrapMaybeSignal(ctx._control.disabled))("mat-form-field-autofilled", ctx._unwrapMaybeSignal(ctx._control.autofilled))("mat-form-field-appearance-fill", ctx.appearance == "fill")("mat-form-field-appearance-outline", ctx.appearance == "outline")("mat-form-field-hide-placeholder", ctx._hasFloatingLabel() && !ctx._shouldLabelFloat())("mat-primary", ctx.color !== "accent" && ctx.color !== "warn")("mat-accent", ctx.color === "accent")("mat-warn", ctx.color === "warn")("ng-untouched", ctx._shouldForward("untouched"))("ng-touched", ctx._shouldForward("touched"))("ng-pristine", ctx._shouldForward("pristine"))("ng-dirty", ctx._shouldForward("dirty"))("ng-valid", ctx._shouldForward("valid"))("ng-invalid", ctx._shouldForward("invalid"))("ng-pending", ctx._shouldForward("pending"));
			},
			inputs: {
				hideRequiredMarker: "hideRequiredMarker",
				color: "color",
				floatLabel: "floatLabel",
				appearance: "appearance",
				subscriptSizing: "subscriptSizing",
				hintLabel: "hintLabel"
			},
			exportAs: ["matFormField"],
			features: [ɵɵProvidersFeature([{
				provide: MAT_FORM_FIELD,
				useExisting: MatFormField
			}, {
				provide: FLOATING_LABEL_PARENT,
				useExisting: MatFormField
			}])],
			ngContentSelectors: _c6,
			decls: 18,
			vars: 21,
			consts: [
				["labelTemplate", ""],
				["textField", ""],
				["iconPrefixContainer", ""],
				["textPrefixContainer", ""],
				["textSuffixContainer", ""],
				["iconSuffixContainer", ""],
				[
					1,
					"mat-mdc-text-field-wrapper",
					"mdc-text-field",
					3,
					"click"
				],
				[1, "mat-mdc-form-field-focus-overlay"],
				[1, "mat-mdc-form-field-flex"],
				[
					"matFormFieldNotchedOutline",
					"",
					3,
					"matFormFieldNotchedOutlineOpen"
				],
				[1, "mat-mdc-form-field-icon-prefix"],
				[1, "mat-mdc-form-field-text-prefix"],
				[1, "mat-mdc-form-field-infix"],
				[3, "ngTemplateOutlet"],
				[1, "mat-mdc-form-field-text-suffix"],
				[1, "mat-mdc-form-field-icon-suffix"],
				["matFormFieldLineRipple", ""],
				[
					"aria-atomic",
					"true",
					"aria-live",
					"polite",
					1,
					"mat-mdc-form-field-subscript-wrapper",
					"mat-mdc-form-field-bottom-align"
				],
				[1, "mat-mdc-form-field-error-wrapper"],
				[1, "mat-mdc-form-field-hint-wrapper"],
				[
					"matFormFieldFloatingLabel",
					"",
					3,
					"floating",
					"monitorResize",
					"id"
				],
				[
					"aria-hidden",
					"true",
					1,
					"mat-mdc-form-field-required-marker",
					"mdc-floating-label--required"
				],
				[3, "id"],
				[1, "mat-mdc-form-field-hint-spacer"]
			],
			template: function MatFormField_Template(rf, ctx) {
				if (rf & 1) {
					ɵɵprojectionDef(_c5);
					ɵɵtemplate(0, MatFormField_ng_template_0_Template, 1, 1, "ng-template", null, 0, ɵɵtemplateRefExtractor);
					ɵɵelementStart(2, "div", 6, 1);
					ɵɵlistener("click", function MatFormField_Template_div_click_2_listener($event) {
						return ctx._control.onContainerClick($event);
					});
					ɵɵconditionalCreate(4, MatFormField_Conditional_4_Template, 1, 0, "div", 7);
					ɵɵelementStart(5, "div", 8);
					ɵɵconditionalCreate(6, MatFormField_Conditional_6_Template, 2, 2, "div", 9);
					ɵɵconditionalCreate(7, MatFormField_Conditional_7_Template, 3, 0, "div", 10);
					ɵɵconditionalCreate(8, MatFormField_Conditional_8_Template, 3, 0, "div", 11);
					ɵɵelementStart(9, "div", 12);
					ɵɵconditionalCreate(10, MatFormField_Conditional_10_Template, 1, 1, null, 13);
					ɵɵprojection(11);
					ɵɵelementEnd();
					ɵɵconditionalCreate(12, MatFormField_Conditional_12_Template, 3, 0, "div", 14);
					ɵɵconditionalCreate(13, MatFormField_Conditional_13_Template, 3, 0, "div", 15);
					ɵɵelementEnd();
					ɵɵconditionalCreate(14, MatFormField_Conditional_14_Template, 1, 0, "div", 16);
					ɵɵelementEnd();
					ɵɵelementStart(15, "div", 17);
					ɵɵconditionalCreate(16, MatFormField_Case_16_Template, 2, 0, "div", 18)(17, MatFormField_Case_17_Template, 5, 1, "div", 19);
					ɵɵelementEnd();
				}
				if (rf & 2) {
					let tmp_18_0 = void 0;
					const isDisabled_r3 = ctx._unwrapMaybeSignal(ctx._control.disabled);
					ɵɵadvance(2);
					ɵɵclassProp("mdc-text-field--filled", !ctx._hasOutline())("mdc-text-field--outlined", ctx._hasOutline())("mdc-text-field--no-label", !ctx._hasFloatingLabel())("mdc-text-field--disabled", isDisabled_r3)("mdc-text-field--invalid", ctx._unwrapMaybeSignal(ctx._control.errorState));
					ɵɵadvance(2);
					ɵɵconditional(!ctx._hasOutline() && !isDisabled_r3 ? 4 : -1);
					ɵɵadvance(2);
					ɵɵconditional(ctx._hasOutline() ? 6 : -1);
					ɵɵadvance();
					ɵɵconditional(ctx._hasIconPrefix ? 7 : -1);
					ɵɵadvance();
					ɵɵconditional(ctx._hasTextPrefix ? 8 : -1);
					ɵɵadvance(2);
					ɵɵconditional(!ctx._hasOutline() || ctx._forceDisplayInfixLabel() ? 10 : -1);
					ɵɵadvance(2);
					ɵɵconditional(ctx._hasTextSuffix ? 12 : -1);
					ɵɵadvance();
					ɵɵconditional(ctx._hasIconSuffix ? 13 : -1);
					ɵɵadvance();
					ɵɵconditional(!ctx._hasOutline() ? 14 : -1);
					ɵɵadvance();
					ɵɵclassProp("mat-mdc-form-field-subscript-dynamic-size", ctx.subscriptSizing === "dynamic");
					const subscriptMessageType_r4 = ctx._getSubscriptMessageType();
					ɵɵadvance();
					ɵɵconditional((tmp_18_0 = subscriptMessageType_r4) === "error" ? 16 : tmp_18_0 === "hint" ? 17 : -1);
				}
			},
			dependencies: [
				MatFormFieldFloatingLabel,
				MatFormFieldNotchedOutline,
				NgTemplateOutlet,
				MatFormFieldLineRipple,
				MatHint
			],
			styles: [".mdc-text-field {\n  display: inline-flex;\n  align-items: baseline;\n  padding: 0 16px;\n  position: relative;\n  box-sizing: border-box;\n  overflow: hidden;\n  will-change: opacity, transform, color;\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n\n.mdc-text-field__input {\n  width: 100%;\n  min-width: 0;\n  border: none;\n  border-radius: 0;\n  background: none;\n  padding: 0;\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  height: 28px;\n}\n.mdc-text-field__input::-webkit-calendar-picker-indicator, .mdc-text-field__input::-webkit-search-cancel-button {\n  display: none;\n}\n.mdc-text-field__input::-ms-clear {\n  display: none;\n}\n.mdc-text-field__input:focus {\n  outline: none;\n}\n.mdc-text-field__input:invalid {\n  box-shadow: none;\n}\n.mdc-text-field__input::placeholder {\n  opacity: 0;\n}\n.mdc-text-field__input::-moz-placeholder {\n  opacity: 0;\n}\n.mdc-text-field__input::-webkit-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field__input:-ms-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--no-label .mdc-text-field__input::placeholder, .mdc-text-field--focused .mdc-text-field__input::placeholder {\n  opacity: 1;\n}\n.mdc-text-field--no-label .mdc-text-field__input::-moz-placeholder, .mdc-text-field--focused .mdc-text-field__input::-moz-placeholder {\n  opacity: 1;\n}\n.mdc-text-field--no-label .mdc-text-field__input::-webkit-input-placeholder, .mdc-text-field--focused .mdc-text-field__input::-webkit-input-placeholder {\n  opacity: 1;\n}\n.mdc-text-field--no-label .mdc-text-field__input:-ms-input-placeholder, .mdc-text-field--focused .mdc-text-field__input:-ms-input-placeholder {\n  opacity: 1;\n}\n.mdc-text-field--%NS%disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive::placeholder {\n  opacity: 0;\n}\n.mdc-text-field--%NS%disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive::-moz-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--%NS%disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive::-webkit-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--%NS%disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive:-ms-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--outlined .mdc-text-field__input, .mdc-text-field--filled.mdc-text-field--no-label .mdc-text-field__input {\n  height: 100%;\n}\n.mdc-text-field--outlined .mdc-text-field__input {\n  display: flex;\n  border: none !important;\n  background-color: transparent;\n}\n.mdc-text-field--disabled .mdc-text-field__input {\n  pointer-events: auto;\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  color: var(--%NS%mat-form-field-filled-input-text-color, var(--%NS%mat-sys-on-surface));\n  caret-color: var(--%NS%mat-form-field-filled-caret-color, var(--%NS%mat-sys-primary));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-text-field__input::placeholder {\n  color: var(--%NS%mat-form-field-filled-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-text-field__input::-moz-placeholder {\n  color: var(--%NS%mat-form-field-filled-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-text-field__input::-webkit-input-placeholder {\n  color: var(--%NS%mat-form-field-filled-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-text-field__input:-ms-input-placeholder {\n  color: var(--%NS%mat-form-field-filled-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  color: var(--%NS%mat-form-field-outlined-input-text-color, var(--%NS%mat-sys-on-surface));\n  caret-color: var(--%NS%mat-form-field-outlined-caret-color, var(--%NS%mat-sys-primary));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mdc-text-field__input::placeholder {\n  color: var(--%NS%mat-form-field-outlined-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mdc-text-field__input::-moz-placeholder {\n  color: var(--%NS%mat-form-field-outlined-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mdc-text-field__input::-webkit-input-placeholder {\n  color: var(--%NS%mat-form-field-outlined-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mdc-text-field__input:-ms-input-placeholder {\n  color: var(--%NS%mat-form-field-outlined-input-text-placeholder-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled.mdc-text-field--%NS%invalid:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  caret-color: var(--%NS%mat-form-field-filled-error-caret-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--outlined.mdc-text-field--%NS%invalid:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  caret-color: var(--%NS%mat-form-field-outlined-error-caret-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--filled.mdc-text-field--disabled .mdc-text-field__input {\n  color: var(--%NS%mat-form-field-filled-disabled-input-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--outlined.mdc-text-field--disabled .mdc-text-field__input {\n  color: var(--%NS%mat-form-field-outlined-disabled-input-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n@media (forced-colors: active) {\n  .mdc-text-field--disabled .mdc-text-field__input {\n    background-color: Window;\n  }\n}\n\n.mdc-text-field--filled {\n  height: 56px;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n  border-top-left-radius: var(--%NS%mat-form-field-filled-container-shape, var(--%NS%mat-sys-corner-extra-small));\n  border-top-right-radius: var(--%NS%mat-form-field-filled-container-shape, var(--%NS%mat-sys-corner-extra-small));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) {\n  background-color: var(--%NS%mat-form-field-filled-container-color, var(--%NS%mat-sys-surface-variant));\n}\n.mdc-text-field--filled.mdc-text-field--disabled {\n  background-color: var(--%NS%mat-form-field-filled-disabled-container-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 4%, transparent));\n}\n\n.mdc-text-field--outlined {\n  height: 56px;\n  overflow: visible;\n  padding-right: max(16px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small)));\n  padding-left: max(16px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small)) + 4px);\n}\n[dir=rtl] .mdc-text-field--outlined {\n  padding-right: max(16px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small)) + 4px);\n  padding-left: max(16px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small)));\n}\n\n.mdc-floating-label {\n  position: absolute;\n  left: 0;\n  transform-origin: left top;\n  line-height: 1.15rem;\n  text-align: left;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  cursor: text;\n  overflow: hidden;\n  will-change: transform;\n}\n[dir=rtl] .mdc-floating-label {\n  right: 0;\n  left: auto;\n  transform-origin: right top;\n  text-align: right;\n}\n.mdc-text-field .mdc-floating-label {\n  top: 50%;\n  transform: translateY(-50%);\n  pointer-events: none;\n}\n.mdc-notched-outline .mdc-floating-label {\n  display: inline-block;\n  position: relative;\n  max-width: 100%;\n}\n.mdc-text-field--outlined .mdc-floating-label {\n  left: 4px;\n  right: auto;\n}\n[dir=rtl] .mdc-text-field--outlined .mdc-floating-label {\n  left: auto;\n  right: 4px;\n}\n.mdc-text-field--filled .mdc-floating-label {\n  left: 16px;\n  right: auto;\n}\n[dir=rtl] .mdc-text-field--filled .mdc-floating-label {\n  left: auto;\n  right: 16px;\n}\n.mdc-text-field--disabled .mdc-floating-label {\n  cursor: default;\n}\n@media (forced-colors: active) {\n  .mdc-text-field--disabled .mdc-floating-label {\n    z-index: 1;\n  }\n}\n.mdc-text-field--filled.mdc-text-field--no-label .mdc-floating-label {\n  display: none;\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-label-text-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-focus-label-text-color, var(--%NS%mat-sys-primary));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-hover-label-text-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled.mdc-text-field--disabled .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled).mdc-text-field--invalid .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-error-label-text-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled).mdc-text-field--invalid.mdc-text-field--focused .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-error-focus-label-text-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled).mdc-text-field--%NS%invalid:not(.mdc-text-field--disabled):hover .mdc-floating-label {\n  color: var(--%NS%mat-form-field-filled-error-hover-label-text-color, var(--%NS%mat-sys-on-error-container));\n}\n.mdc-text-field--filled .mdc-floating-label {\n  font-family: var(--%NS%mat-form-field-filled-label-text-font, var(--%NS%mat-sys-body-large-font));\n  font-size: var(--%NS%mat-form-field-filled-label-text-size, var(--%NS%mat-sys-body-large-size));\n  font-weight: var(--%NS%mat-form-field-filled-label-text-weight, var(--%NS%mat-sys-body-large-weight));\n  letter-spacing: var(--%NS%mat-form-field-filled-label-text-tracking, var(--%NS%mat-sys-body-large-tracking));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-label-text-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-focus-label-text-color, var(--%NS%mat-sys-primary));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-hover-label-text-color, var(--%NS%mat-sys-on-surface));\n}\n.mdc-text-field--outlined.mdc-text-field--disabled .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-disabled-label-text-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-error-label-text-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid.mdc-text-field--focused .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-error-focus-label-text-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--%NS%invalid:not(.mdc-text-field--disabled):hover .mdc-floating-label {\n  color: var(--%NS%mat-form-field-outlined-error-hover-label-text-color, var(--%NS%mat-sys-on-error-container));\n}\n.mdc-text-field--outlined .mdc-floating-label {\n  font-family: var(--%NS%mat-form-field-outlined-label-text-font, var(--%NS%mat-sys-body-large-font));\n  font-size: var(--%NS%mat-form-field-outlined-label-text-size, var(--%NS%mat-sys-body-large-size));\n  font-weight: var(--%NS%mat-form-field-outlined-label-text-weight, var(--%NS%mat-sys-body-large-weight));\n  letter-spacing: var(--%NS%mat-form-field-outlined-label-text-tracking, var(--%NS%mat-sys-body-large-tracking));\n}\n\n.mdc-floating-label--float-above {\n  cursor: auto;\n  transform: translateY(-106%) scale(0.75);\n}\n.mdc-text-field--filled .mdc-floating-label--float-above {\n  transform: translateY(-106%) scale(0.75);\n}\n.mdc-text-field--outlined .mdc-floating-label--float-above {\n  transform: translateY(-37.25px) scale(1);\n  font-size: 0.75rem;\n}\n.mdc-notched-outline .mdc-floating-label--float-above {\n  text-overflow: clip;\n}\n.mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  max-width: 133.3333333333%;\n}\n.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above, .mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  transform: translateY(-34.75px) scale(0.75);\n}\n.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above, .mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  font-size: 1rem;\n}\n\n.mdc-floating-label--%NS%required:not(.mdc-floating-label--hide-required-marker)::after {\n  margin-left: 1px;\n  margin-right: 0;\n  content: \"*\";\n}\n[dir=rtl] .mdc-floating-label--%NS%required:not(.mdc-floating-label--hide-required-marker)::after {\n  margin-left: 0;\n  margin-right: 1px;\n}\n\n.mdc-notched-outline {\n  display: flex;\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  box-sizing: border-box;\n  width: 100%;\n  max-width: 100%;\n  height: 100%;\n  text-align: left;\n  pointer-events: none;\n}\n[dir=rtl] .mdc-notched-outline {\n  text-align: right;\n}\n.mdc-text-field--outlined .mdc-notched-outline {\n  z-index: 1;\n}\n\n.mat-mdc-notch-piece {\n  box-sizing: border-box;\n  height: 100%;\n  pointer-events: none;\n  border: none;\n  border-top: 1px solid;\n  border-bottom: 1px solid;\n}\n.mdc-text-field--focused .mat-mdc-notch-piece {\n  border-width: 2px;\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled) .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-outline-color, var(--%NS%mat-sys-outline));\n  border-width: var(--%NS%mat-form-field-outlined-outline-width, 1px);\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-hover-outline-color, var(--%NS%mat-sys-on-surface));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-focus-outline-color, var(--%NS%mat-sys-primary));\n}\n.mdc-text-field--outlined.mdc-text-field--disabled .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-disabled-outline-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 12%, transparent));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-error-outline-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--%NS%invalid:not(.mdc-text-field--focused):hover .mdc-notched-outline .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-error-hover-outline-color, var(--%NS%mat-sys-on-error-container));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid.mdc-text-field--focused .mat-mdc-notch-piece {\n  border-color: var(--%NS%mat-form-field-outlined-error-focus-outline-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline .mat-mdc-notch-piece {\n  border-width: var(--%NS%mat-form-field-outlined-focus-outline-width, 2px);\n}\n\n.mdc-notched-outline__leading {\n  border-left: 1px solid;\n  border-right: none;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-top-left-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n  border-bottom-left-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n}\n.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading {\n  width: max(12px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small)));\n}\n[dir=rtl] .mdc-notched-outline__leading {\n  border-left: none;\n  border-right: 1px solid;\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n  border-top-right-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n  border-bottom-right-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n}\n\n.mdc-notched-outline__trailing {\n  flex-grow: 1;\n  border-left: none;\n  border-right: 1px solid;\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n  border-top-right-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n  border-bottom-right-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n}\n[dir=rtl] .mdc-notched-outline__trailing {\n  border-left: 1px solid;\n  border-right: none;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-top-left-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n  border-bottom-left-radius: var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small));\n}\n\n.mdc-notched-outline__notch {\n  flex: 0 0 auto;\n  width: auto;\n}\n.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__notch {\n  max-width: min(var(--%NS%mat-form-field-notch-max-width, 100%), calc(100% - max(12px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small))) * 2));\n}\n.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  max-width: min(100%, calc(100% - max(12px, var(--%NS%mat-form-field-outlined-container-shape, var(--%NS%mat-sys-corner-extra-small))) * 2));\n}\n.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-top: 1px;\n}\n.mdc-text-field--focused.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-top: 2px;\n}\n.mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-left: 0;\n  padding-right: 8px;\n  border-top: none;\n}\n[dir=rtl] .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-left: 8px;\n  padding-right: 0;\n}\n.mdc-notched-outline--no-label .mdc-notched-outline__notch {\n  display: none;\n}\n\n.mdc-line-ripple::before, .mdc-line-ripple::after {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  border-bottom-style: solid;\n  content: \"\";\n}\n.mdc-line-ripple::before {\n  z-index: 1;\n  border-bottom-width: var(--%NS%mat-form-field-filled-active-indicator-height, 1px);\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-line-ripple::before {\n  border-bottom-color: var(--%NS%mat-form-field-filled-active-indicator-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-line-ripple::before {\n  border-bottom-color: var(--%NS%mat-form-field-filled-hover-active-indicator-color, var(--%NS%mat-sys-on-surface));\n}\n.mdc-text-field--filled.mdc-text-field--disabled .mdc-line-ripple::before {\n  border-bottom-color: var(--%NS%mat-form-field-filled-disabled-active-indicator-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled).mdc-text-field--invalid .mdc-line-ripple::before {\n  border-bottom-color: var(--%NS%mat-form-field-filled-error-active-indicator-color, var(--%NS%mat-sys-error));\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled).mdc-text-field--%NS%invalid:not(.mdc-text-field--focused):hover .mdc-line-ripple::before {\n  border-bottom-color: var(--%NS%mat-form-field-filled-error-hover-active-indicator-color, var(--%NS%mat-sys-on-error-container));\n}\n.mdc-line-ripple::after {\n  transform: scaleX(0);\n  opacity: 0;\n  z-index: 2;\n}\n.mdc-text-field--filled .mdc-line-ripple::after {\n  border-bottom-width: var(--%NS%mat-form-field-filled-focus-active-indicator-height, 2px);\n}\n.mdc-text-field--%NS%filled:not(.mdc-text-field--disabled) .mdc-line-ripple::after {\n  border-bottom-color: var(--%NS%mat-form-field-filled-focus-active-indicator-color, var(--%NS%mat-sys-primary));\n}\n.mdc-text-field--filled.mdc-text-field--%NS%invalid:not(.mdc-text-field--disabled) .mdc-line-ripple::after {\n  border-bottom-color: var(--%NS%mat-form-field-filled-error-focus-active-indicator-color, var(--%NS%mat-sys-error));\n}\n\n.mdc-line-ripple--%NS%active::after {\n  transform: scaleX(1);\n  opacity: 1;\n}\n\n.mdc-line-ripple--%NS%deactivating::after {\n  opacity: 0;\n}\n\n.mdc-text-field--disabled {\n  pointer-events: none;\n}\n\n.mat-mdc-form-field-textarea-control {\n  vertical-align: middle;\n  resize: vertical;\n  box-sizing: border-box;\n  height: auto;\n  margin: 0;\n  padding: 0;\n  border: none;\n  overflow: auto;\n}\n\n.mat-mdc-form-field-input-control.mat-mdc-form-field-input-control {\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font: inherit;\n  letter-spacing: inherit;\n  text-decoration: inherit;\n  text-transform: inherit;\n  border: none;\n}\n\n.mat-mdc-form-field .mat-mdc-floating-label.mdc-floating-label {\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  line-height: normal;\n  pointer-events: all;\n  will-change: auto;\n}\n\n.mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-floating-label.mdc-floating-label {\n  cursor: inherit;\n}\n\n.mdc-text-field--%NS%no-label:not(.mdc-text-field--textarea) .mat-mdc-form-field-input-control.mdc-text-field__input,\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-input-control {\n  height: auto;\n}\n\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-input-control.mdc-text-field__input[type=color] {\n  height: 23px;\n}\n\n.mat-mdc-text-field-wrapper {\n  height: auto;\n  flex: auto;\n  will-change: auto;\n}\n\n.mat-mdc-form-field-has-icon-prefix .mat-mdc-text-field-wrapper {\n  padding-left: 0;\n  --%NS%mat-mdc-form-field-label-offset-x: -16px;\n}\n\n.mat-mdc-form-field-has-icon-suffix .mat-mdc-text-field-wrapper {\n  padding-right: 0;\n}\n\n[dir=rtl] .mat-mdc-text-field-wrapper {\n  padding-left: 16px;\n  padding-right: 16px;\n}\n[dir=rtl] .mat-mdc-form-field-has-icon-suffix .mat-mdc-text-field-wrapper {\n  padding-left: 0;\n}\n[dir=rtl] .mat-mdc-form-field-has-icon-prefix .mat-mdc-text-field-wrapper {\n  padding-right: 0;\n}\n\n.mat-form-field-disabled .mdc-text-field__input::placeholder {\n  color: var(--%NS%mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-disabled .mdc-text-field__input::-moz-placeholder {\n  color: var(--%NS%mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-disabled .mdc-text-field__input::-webkit-input-placeholder {\n  color: var(--%NS%mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-disabled .mdc-text-field__input:-ms-input-placeholder {\n  color: var(--%NS%mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n\n.mat-mdc-form-field-label-always-float .mdc-text-field__input::placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n  opacity: 1;\n}\n\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-infix .mat-mdc-floating-label {\n  left: auto;\n  right: auto;\n}\n\n.mat-mdc-text-field-wrapper.mdc-text-field--outlined .mdc-text-field__input {\n  display: inline-block;\n}\n\n.mat-mdc-form-field .mat-mdc-text-field-wrapper.mdc-text-field .mdc-notched-outline__notch {\n  padding-top: 0;\n}\n\n.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field .mdc-notched-outline__notch {\n  border-left: 1px solid transparent;\n}\n\n[dir=rtl] .mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field .mdc-notched-outline__notch {\n  border-left: none;\n  border-right: 1px solid transparent;\n}\n\n.mat-mdc-form-field-infix {\n  min-height: var(--%NS%mat-form-field-container-height, 56px);\n  padding-top: var(--%NS%mat-form-field-filled-with-label-container-padding-top, 24px);\n  padding-bottom: var(--%NS%mat-form-field-filled-with-label-container-padding-bottom, 8px);\n}\n.mdc-text-field--outlined .mat-mdc-form-field-infix, .mdc-text-field--no-label .mat-mdc-form-field-infix {\n  padding-top: var(--%NS%mat-form-field-container-vertical-padding, 16px);\n  padding-bottom: var(--%NS%mat-form-field-container-vertical-padding, 16px);\n}\n\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-flex .mat-mdc-floating-label {\n  top: calc(var(--%NS%mat-form-field-container-height, 56px) / 2);\n}\n\n.mdc-text-field--filled .mat-mdc-floating-label {\n  display: var(--%NS%mat-form-field-filled-label-display, block);\n}\n\n.mat-mdc-text-field-wrapper.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  --%NS%mat-mdc-form-field-label-transform: translateY(calc(calc(6.75px + var(--%NS%mat-form-field-container-height, 56px) / 2) * -1))\n    scale(var(--%NS%mat-mdc-form-field-floating-label-scale, 0.75));\n  transform: var(--%NS%mat-mdc-form-field-label-transform);\n}\n\n@keyframes _mat-form-field-subscript-animation {\n  from {\n    opacity: 0;\n    transform: translateY(-5px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.mat-mdc-form-field-subscript-wrapper {\n  box-sizing: border-box;\n  width: 100%;\n  position: relative;\n}\n\n.mat-mdc-form-field-hint-wrapper,\n.mat-mdc-form-field-error-wrapper {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  padding: 0 16px;\n  opacity: 1;\n  transform: translateY(0);\n  animation: _mat-form-field-subscript-animation 0ms cubic-bezier(0.55, 0, 0.55, 0.2);\n}\n\n.mat-mdc-form-field-subscript-dynamic-size .mat-mdc-form-field-hint-wrapper,\n.mat-mdc-form-field-subscript-dynamic-size .mat-mdc-form-field-error-wrapper {\n  position: static;\n}\n\n.mat-mdc-form-field-bottom-align::before {\n  content: \"\";\n  display: inline-block;\n  height: 16px;\n}\n\n.mat-mdc-form-field-bottom-align.mat-mdc-form-field-subscript-dynamic-size::before {\n  content: unset;\n}\n\n.mat-mdc-form-field-hint-end {\n  order: 1;\n}\n\n.mat-mdc-form-field-hint-wrapper {\n  display: flex;\n}\n\n.mat-mdc-form-field-hint-spacer {\n  flex: 1 0 1em;\n}\n\n.mat-mdc-form-field-error {\n  display: block;\n  color: var(--%NS%mat-form-field-error-text-color, var(--%NS%mat-sys-error));\n}\n\n.mat-mdc-form-field-subscript-wrapper,\n.mat-mdc-form-field-bottom-align::before {\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-family: var(--%NS%mat-form-field-subscript-text-font, var(--%NS%mat-sys-body-small-font));\n  line-height: var(--%NS%mat-form-field-subscript-text-line-height, var(--%NS%mat-sys-body-small-line-height));\n  font-size: var(--%NS%mat-form-field-subscript-text-size, var(--%NS%mat-sys-body-small-size));\n  letter-spacing: var(--%NS%mat-form-field-subscript-text-tracking, var(--%NS%mat-sys-body-small-tracking));\n  font-weight: var(--%NS%mat-form-field-subscript-text-weight, var(--%NS%mat-sys-body-small-weight));\n}\n\n.mat-mdc-form-field-focus-overlay {\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  position: absolute;\n  opacity: 0;\n  pointer-events: none;\n  background-color: var(--%NS%mat-form-field-state-layer-color, var(--%NS%mat-sys-on-surface));\n}\n.mat-mdc-text-field-wrapper:hover .mat-mdc-form-field-focus-overlay {\n  opacity: var(--%NS%mat-form-field-hover-state-layer-opacity, var(--%NS%mat-sys-hover-state-layer-opacity));\n}\n.mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {\n  opacity: var(--%NS%mat-form-field-focus-state-layer-opacity, 0);\n}\n\nselect.mat-mdc-form-field-input-control {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  background-color: transparent;\n  display: inline-flex;\n  box-sizing: border-box;\n}\nselect.mat-mdc-form-field-input-control:not(:disabled) {\n  cursor: pointer;\n}\nselect.mat-mdc-form-field-input-control:not(.mat-mdc-native-select-inline) option {\n  color: var(--%NS%mat-form-field-select-option-text-color, var(--%NS%mat-sys-neutral10));\n}\nselect.mat-mdc-form-field-input-control:not(.mat-mdc-native-select-inline) option:disabled {\n  color: var(--%NS%mat-form-field-select-disabled-option-text-color, color-mix(in srgb, var(--%NS%mat-sys-neutral10) 38%, transparent));\n}\n\n.mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-infix::after {\n  content: \"\";\n  width: 0;\n  height: 0;\n  border-left: 5px solid transparent;\n  border-right: 5px solid transparent;\n  border-top: 5px solid;\n  position: absolute;\n  right: 0;\n  top: 50%;\n  margin-top: -2.5px;\n  pointer-events: none;\n  color: var(--%NS%mat-form-field-enabled-select-arrow-color, var(--%NS%mat-sys-on-surface-variant));\n}\n[dir=rtl] .mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-infix::after {\n  right: auto;\n  left: 0;\n}\n.mat-mdc-form-field-type-mat-native-select.mat-focused .mat-mdc-form-field-infix::after {\n  color: var(--%NS%mat-form-field-focus-select-arrow-color, var(--%NS%mat-sys-primary));\n}\n.mat-mdc-form-field-type-mat-native-select.mat-form-field-disabled .mat-mdc-form-field-infix::after {\n  color: var(--%NS%mat-form-field-disabled-select-arrow-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-input-control {\n  padding-right: 15px;\n}\n[dir=rtl] .mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-input-control {\n  padding-right: 0;\n  padding-left: 15px;\n}\n\n@media (forced-colors: active) {\n  .mat-form-field-appearance-fill .mat-mdc-text-field-wrapper {\n    outline: solid 1px;\n  }\n}\n@media (forced-colors: active) {\n  .mat-form-field-appearance-fill.mat-form-field-disabled .mat-mdc-text-field-wrapper {\n    outline-color: GrayText;\n  }\n}\n\n@media (forced-colors: active) {\n  .mat-form-field-appearance-fill.mat-focused .mat-mdc-text-field-wrapper {\n    outline: dashed 3px;\n  }\n}\n\n@media (forced-colors: active) {\n  .mat-mdc-form-field.mat-focused .mdc-notched-outline {\n    border: dashed 3px;\n  }\n}\n\n.mat-mdc-form-field-input-control[type=date], .mat-mdc-form-field-input-control[type=datetime], .mat-mdc-form-field-input-control[type=datetime-local], .mat-mdc-form-field-input-control[type=month], .mat-mdc-form-field-input-control[type=week], .mat-mdc-form-field-input-control[type=time] {\n  line-height: 1;\n}\n.mat-mdc-form-field-input-control::-webkit-datetime-edit {\n  line-height: 1;\n  padding: 0;\n  margin-bottom: -2px;\n}\n\n.mat-mdc-form-field {\n  --%NS%mat-mdc-form-field-floating-label-scale: 0.75;\n  display: inline-flex;\n  flex-direction: column;\n  min-width: 0;\n  text-align: left;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-family: var(--%NS%mat-form-field-container-text-font, var(--%NS%mat-sys-body-large-font));\n  line-height: var(--%NS%mat-form-field-container-text-line-height, var(--%NS%mat-sys-body-large-line-height));\n  font-size: var(--%NS%mat-form-field-container-text-size, var(--%NS%mat-sys-body-large-size));\n  letter-spacing: var(--%NS%mat-form-field-container-text-tracking, var(--%NS%mat-sys-body-large-tracking));\n  font-weight: var(--%NS%mat-form-field-container-text-weight, var(--%NS%mat-sys-body-large-weight));\n}\n.mat-mdc-form-field .mdc-text-field--outlined .mdc-floating-label--float-above {\n  font-size: calc(var(--%NS%mat-form-field-outlined-label-text-populated-size) * var(--%NS%mat-mdc-form-field-floating-label-scale));\n}\n.mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  font-size: var(--%NS%mat-form-field-outlined-label-text-populated-size);\n}\n[dir=rtl] .mat-mdc-form-field {\n  text-align: right;\n}\n\n.mat-mdc-form-field-flex {\n  display: inline-flex;\n  align-items: baseline;\n  box-sizing: border-box;\n  width: 100%;\n}\n\n.mat-mdc-text-field-wrapper {\n  width: 100%;\n  z-index: 0;\n}\n\n.mat-mdc-form-field-icon-prefix,\n.mat-mdc-form-field-icon-suffix {\n  align-self: center;\n  line-height: 0;\n  pointer-events: auto;\n  position: relative;\n  z-index: 1;\n}\n.mat-mdc-form-field-icon-prefix > .mat-icon,\n.mat-mdc-form-field-icon-suffix > .mat-icon {\n  padding: 0 12px;\n  box-sizing: content-box;\n}\n\n.mat-mdc-form-field-icon-prefix {\n  color: var(--%NS%mat-form-field-leading-icon-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mat-form-field-disabled .mat-mdc-form-field-icon-prefix {\n  color: var(--%NS%mat-form-field-disabled-leading-icon-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n\n.mat-mdc-form-field-icon-suffix {\n  color: var(--%NS%mat-form-field-trailing-icon-color, var(--%NS%mat-sys-on-surface-variant));\n}\n.mat-form-field-disabled .mat-mdc-form-field-icon-suffix {\n  color: var(--%NS%mat-form-field-disabled-trailing-icon-color, color-mix(in srgb, var(--%NS%mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-invalid .mat-mdc-form-field-icon-suffix {\n  color: var(--%NS%mat-form-field-error-trailing-icon-color, var(--%NS%mat-sys-error));\n}\n.mat-form-field-invalid:not(.mat-focused):not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mat-mdc-form-field-icon-suffix {\n  color: var(--%NS%mat-form-field-error-hover-trailing-icon-color, var(--%NS%mat-sys-on-error-container));\n}\n.mat-form-field-invalid.mat-focused .mat-mdc-text-field-wrapper .mat-mdc-form-field-icon-suffix {\n  color: var(--%NS%mat-form-field-error-focus-trailing-icon-color, var(--%NS%mat-sys-error));\n}\n\n.mat-mdc-form-field-icon-prefix,\n[dir=rtl] .mat-mdc-form-field-icon-suffix {\n  padding: 0 4px 0 0;\n}\n\n.mat-mdc-form-field-icon-suffix,\n[dir=rtl] .mat-mdc-form-field-icon-prefix {\n  padding: 0 0 0 4px;\n}\n\n.mat-mdc-form-field-subscript-wrapper .mat-icon,\n.mat-mdc-form-field label .mat-icon {\n  width: 1em;\n  height: 1em;\n  font-size: inherit;\n}\n\n.mat-mdc-form-field-infix {\n  flex: auto;\n  min-width: 0;\n  width: 180px;\n  position: relative;\n  box-sizing: border-box;\n}\n.mat-mdc-form-field-infix:has(textarea[cols]) {\n  width: auto;\n}\n\n.mat-mdc-form-field .mdc-notched-outline__notch {\n  margin-left: -1px;\n  -webkit-clip-path: inset(-9em -999em -9em 1px);\n  clip-path: inset(-9em -999em -9em 1px);\n}\n[dir=rtl] .mat-mdc-form-field .mdc-notched-outline__notch {\n  margin-left: 0;\n  margin-right: -1px;\n  -webkit-clip-path: inset(-9em 1px -9em -999em);\n  clip-path: inset(-9em 1px -9em -999em);\n}\n\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-floating-label {\n  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input {\n  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input::placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input::-moz-placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input::-webkit-input-placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input:-ms-input-placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input::placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input::placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input::-moz-placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input::-moz-placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input::-webkit-input-placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input::-webkit-input-placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input:-ms-input-placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input:-ms-input-placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field--%NS%filled:not(.mdc-ripple-upgraded):focus .mdc-text-field__ripple::before {\n  transition-duration: 75ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-line-ripple::after {\n  transition: transform 180ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mat-mdc-form-field-hint-wrapper,\n.mat-mdc-form-field.mat-form-field-animations-enabled .mat-mdc-form-field-error-wrapper {\n  animation-duration: 300ms;\n}\n\n.mdc-notched-outline .mdc-floating-label {\n  max-width: calc(100% + 1px);\n}\n\n.mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  max-width: calc(133.3333333333% + 1px);\n}\n"],
			encapsulation: 2
		});
	})();
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormField, [{
		type: Component,
		args: [{
			selector: "mat-form-field",
			exportAs: "matFormField",
			host: {
				"class": "mat-mdc-form-field",
				"[class.mat-mdc-form-field-label-always-float]": "_shouldAlwaysFloat()",
				"[class.mat-mdc-form-field-has-icon-prefix]": "_hasIconPrefix",
				"[class.mat-mdc-form-field-has-icon-suffix]": "_hasIconSuffix",
				"[class.mat-form-field-invalid]": "_unwrapMaybeSignal(_control.errorState)",
				"[class.mat-form-field-disabled]": "_unwrapMaybeSignal(_control.disabled)",
				"[class.mat-form-field-autofilled]": "_unwrapMaybeSignal(_control.autofilled)",
				"[class.mat-form-field-appearance-fill]": "appearance == \"fill\"",
				"[class.mat-form-field-appearance-outline]": "appearance == \"outline\"",
				"[class.mat-form-field-hide-placeholder]": "_hasFloatingLabel() && !_shouldLabelFloat()",
				"[class.mat-primary]": "color !== \"accent\" && color !== \"warn\"",
				"[class.mat-accent]": "color === \"accent\"",
				"[class.mat-warn]": "color === \"warn\"",
				"[class.ng-untouched]": "_shouldForward(\"untouched\")",
				"[class.ng-touched]": "_shouldForward(\"touched\")",
				"[class.ng-pristine]": "_shouldForward(\"pristine\")",
				"[class.ng-dirty]": "_shouldForward(\"dirty\")",
				"[class.ng-valid]": "_shouldForward(\"valid\")",
				"[class.ng-invalid]": "_shouldForward(\"invalid\")",
				"[class.ng-pending]": "_shouldForward(\"pending\")"
			},
			encapsulation: ViewEncapsulation.None,
			providers: [{
				provide: MAT_FORM_FIELD,
				useExisting: MatFormField
			}, {
				provide: FLOATING_LABEL_PARENT,
				useExisting: MatFormField
			}],
			imports: [
				MatFormFieldFloatingLabel,
				MatFormFieldNotchedOutline,
				NgTemplateOutlet,
				MatFormFieldLineRipple,
				MatHint
			],
			template: "<ng-template #labelTemplate>\n  <!--\n    MDC recommends that the text-field is a `<label>` element. This rather complicates the\n    setup because it would require every form-field control to explicitly set `aria-labelledby`.\n    This is because the `<label>` itself contains more than the actual label (e.g. prefix, suffix\n    or other projected content), and screen readers could potentially read out undesired content.\n    Excluding elements from being printed out requires them to be marked with `aria-hidden`, or\n    the form control is set to a scoped element for the label (using `aria-labelledby`). Both of\n    these options seem to complicate the setup because we know exactly what content is rendered\n    as part of the label, and we don't want to spend resources on walking through projected content\n    to set `aria-hidden`. Nor do we want to set `aria-labelledby` on every form control if we could\n    simply link the label to the control using the label `for` attribute.\n  -->\n  @if (_hasFloatingLabel()) {\n    <label\n      matFormFieldFloatingLabel\n      [floating]=\"_shouldLabelFloat()\"\n      [monitorResize]=\"_hasOutline()\"\n      [id]=\"_labelId\"\n      [attr.for]=\"_control.disableAutomaticLabeling ? null : _control.id\"\n    >\n      <ng-content select=\"mat-label\"></ng-content>\n      <!--\n        We set the required marker as a separate element, in order to make it easier to target if\n        apps want to override it and to be able to set `aria-hidden` so that screen readers don't\n        pick it up.\n       -->\n      @if (!hideRequiredMarker && _unwrapMaybeSignal(_control.required)) {\n        <span\n          aria-hidden=\"true\"\n          class=\"mat-mdc-form-field-required-marker mdc-floating-label--required\"\n        ></span>\n      }\n    </label>\n  }\n</ng-template>\n\n@let isDisabled = _unwrapMaybeSignal(_control.disabled);\n\n<div\n  class=\"mat-mdc-text-field-wrapper mdc-text-field\"\n  #textField\n  [class.mdc-text-field--filled]=\"!_hasOutline()\"\n  [class.mdc-text-field--outlined]=\"_hasOutline()\"\n  [class.mdc-text-field--no-label]=\"!_hasFloatingLabel()\"\n  [class.mdc-text-field--disabled]=\"isDisabled\"\n  [class.mdc-text-field--invalid]=\"_unwrapMaybeSignal(_control.errorState)\"\n  (click)=\"_control.onContainerClick($event)\"\n>\n  @if (!_hasOutline() && !isDisabled) {\n    <div class=\"mat-mdc-form-field-focus-overlay\"></div>\n  }\n  <div class=\"mat-mdc-form-field-flex\">\n    @if (_hasOutline()) {\n      <div matFormFieldNotchedOutline [matFormFieldNotchedOutlineOpen]=\"_shouldLabelFloat()\">\n        @if (!_forceDisplayInfixLabel()) {\n          <ng-template [ngTemplateOutlet]=\"labelTemplate\"></ng-template>\n        }\n      </div>\n    }\n\n    @if (_hasIconPrefix) {\n      <div class=\"mat-mdc-form-field-icon-prefix\" #iconPrefixContainer>\n        <ng-content select=\"[matPrefix], [matIconPrefix]\"></ng-content>\n      </div>\n    }\n\n    @if (_hasTextPrefix) {\n      <div class=\"mat-mdc-form-field-text-prefix\" #textPrefixContainer>\n        <ng-content select=\"[matTextPrefix]\"></ng-content>\n      </div>\n    }\n\n    <div class=\"mat-mdc-form-field-infix\">\n      @if (!_hasOutline() || _forceDisplayInfixLabel()) {\n        <ng-template [ngTemplateOutlet]=\"labelTemplate\"></ng-template>\n      }\n\n      <ng-content></ng-content>\n    </div>\n\n    @if (_hasTextSuffix) {\n      <div class=\"mat-mdc-form-field-text-suffix\" #textSuffixContainer>\n        <ng-content select=\"[matTextSuffix]\"></ng-content>\n      </div>\n    }\n\n    @if (_hasIconSuffix) {\n      <div class=\"mat-mdc-form-field-icon-suffix\" #iconSuffixContainer>\n        <ng-content select=\"[matSuffix], [matIconSuffix]\"></ng-content>\n      </div>\n    }\n  </div>\n\n  @if (!_hasOutline()) {\n    <div matFormFieldLineRipple></div>\n  }\n</div>\n\n<div aria-atomic=\"true\" aria-live=\"polite\"\n  class=\"mat-mdc-form-field-subscript-wrapper mat-mdc-form-field-bottom-align\"\n  [class.mat-mdc-form-field-subscript-dynamic-size]=\"subscriptSizing === 'dynamic'\"\n>\n  @let subscriptMessageType = _getSubscriptMessageType();\n\n  @switch (subscriptMessageType) {\n    @case ('error') {\n      <div class=\"mat-mdc-form-field-error-wrapper\">\n        <ng-content select=\"mat-error, [matError]\"></ng-content>\n      </div>\n    }\n\n    @case ('hint') {\n      <div class=\"mat-mdc-form-field-hint-wrapper\">\n        @if (hintLabel) {\n          <mat-hint [id]=\"_hintLabelId\">{{hintLabel}}</mat-hint>\n        }\n        <ng-content select=\"mat-hint:not([align='end'])\"></ng-content>\n        <div class=\"mat-mdc-form-field-hint-spacer\"></div>\n        <ng-content select=\"mat-hint[align='end']\"></ng-content>\n      </div>\n    }\n  }\n</div>\n",
			styles: [".mdc-text-field {\n  display: inline-flex;\n  align-items: baseline;\n  padding: 0 16px;\n  position: relative;\n  box-sizing: border-box;\n  overflow: hidden;\n  will-change: opacity, transform, color;\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n\n.mdc-text-field__input {\n  width: 100%;\n  min-width: 0;\n  border: none;\n  border-radius: 0;\n  background: none;\n  padding: 0;\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  height: 28px;\n}\n.mdc-text-field__input::-webkit-calendar-picker-indicator, .mdc-text-field__input::-webkit-search-cancel-button {\n  display: none;\n}\n.mdc-text-field__input::-ms-clear {\n  display: none;\n}\n.mdc-text-field__input:focus {\n  outline: none;\n}\n.mdc-text-field__input:invalid {\n  box-shadow: none;\n}\n.mdc-text-field__input::placeholder {\n  opacity: 0;\n}\n.mdc-text-field__input::-moz-placeholder {\n  opacity: 0;\n}\n.mdc-text-field__input::-webkit-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field__input:-ms-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--no-label .mdc-text-field__input::placeholder, .mdc-text-field--focused .mdc-text-field__input::placeholder {\n  opacity: 1;\n}\n.mdc-text-field--no-label .mdc-text-field__input::-moz-placeholder, .mdc-text-field--focused .mdc-text-field__input::-moz-placeholder {\n  opacity: 1;\n}\n.mdc-text-field--no-label .mdc-text-field__input::-webkit-input-placeholder, .mdc-text-field--focused .mdc-text-field__input::-webkit-input-placeholder {\n  opacity: 1;\n}\n.mdc-text-field--no-label .mdc-text-field__input:-ms-input-placeholder, .mdc-text-field--focused .mdc-text-field__input:-ms-input-placeholder {\n  opacity: 1;\n}\n.mdc-text-field--disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive::placeholder {\n  opacity: 0;\n}\n.mdc-text-field--disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive::-moz-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive::-webkit-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--disabled:not(.mdc-text-field--no-label) .mdc-text-field__input.mat-mdc-input-disabled-interactive:-ms-input-placeholder {\n  opacity: 0;\n}\n.mdc-text-field--outlined .mdc-text-field__input, .mdc-text-field--filled.mdc-text-field--no-label .mdc-text-field__input {\n  height: 100%;\n}\n.mdc-text-field--outlined .mdc-text-field__input {\n  display: flex;\n  border: none !important;\n  background-color: transparent;\n}\n.mdc-text-field--disabled .mdc-text-field__input {\n  pointer-events: auto;\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  color: var(--mat-form-field-filled-input-text-color, var(--mat-sys-on-surface));\n  caret-color: var(--mat-form-field-filled-caret-color, var(--mat-sys-primary));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-text-field__input::placeholder {\n  color: var(--mat-form-field-filled-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-text-field__input::-moz-placeholder {\n  color: var(--mat-form-field-filled-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-text-field__input::-webkit-input-placeholder {\n  color: var(--mat-form-field-filled-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-text-field__input:-ms-input-placeholder {\n  color: var(--mat-form-field-filled-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  color: var(--mat-form-field-outlined-input-text-color, var(--mat-sys-on-surface));\n  caret-color: var(--mat-form-field-outlined-caret-color, var(--mat-sys-primary));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-text-field__input::placeholder {\n  color: var(--mat-form-field-outlined-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-text-field__input::-moz-placeholder {\n  color: var(--mat-form-field-outlined-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-text-field__input::-webkit-input-placeholder {\n  color: var(--mat-form-field-outlined-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-text-field__input:-ms-input-placeholder {\n  color: var(--mat-form-field-outlined-input-text-placeholder-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  caret-color: var(--mat-form-field-filled-error-caret-color, var(--mat-sys-error));\n}\n.mdc-text-field--outlined.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-text-field__input {\n  caret-color: var(--mat-form-field-outlined-error-caret-color, var(--mat-sys-error));\n}\n.mdc-text-field--filled.mdc-text-field--disabled .mdc-text-field__input {\n  color: var(--mat-form-field-filled-disabled-input-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--outlined.mdc-text-field--disabled .mdc-text-field__input {\n  color: var(--mat-form-field-outlined-disabled-input-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n@media (forced-colors: active) {\n  .mdc-text-field--disabled .mdc-text-field__input {\n    background-color: Window;\n  }\n}\n\n.mdc-text-field--filled {\n  height: 56px;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n  border-top-left-radius: var(--mat-form-field-filled-container-shape, var(--mat-sys-corner-extra-small));\n  border-top-right-radius: var(--mat-form-field-filled-container-shape, var(--mat-sys-corner-extra-small));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) {\n  background-color: var(--mat-form-field-filled-container-color, var(--mat-sys-surface-variant));\n}\n.mdc-text-field--filled.mdc-text-field--disabled {\n  background-color: var(--mat-form-field-filled-disabled-container-color, color-mix(in srgb, var(--mat-sys-on-surface) 4%, transparent));\n}\n\n.mdc-text-field--outlined {\n  height: 56px;\n  overflow: visible;\n  padding-right: max(16px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small)));\n  padding-left: max(16px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small)) + 4px);\n}\n[dir=rtl] .mdc-text-field--outlined {\n  padding-right: max(16px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small)) + 4px);\n  padding-left: max(16px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small)));\n}\n\n.mdc-floating-label {\n  position: absolute;\n  left: 0;\n  transform-origin: left top;\n  line-height: 1.15rem;\n  text-align: left;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  cursor: text;\n  overflow: hidden;\n  will-change: transform;\n}\n[dir=rtl] .mdc-floating-label {\n  right: 0;\n  left: auto;\n  transform-origin: right top;\n  text-align: right;\n}\n.mdc-text-field .mdc-floating-label {\n  top: 50%;\n  transform: translateY(-50%);\n  pointer-events: none;\n}\n.mdc-notched-outline .mdc-floating-label {\n  display: inline-block;\n  position: relative;\n  max-width: 100%;\n}\n.mdc-text-field--outlined .mdc-floating-label {\n  left: 4px;\n  right: auto;\n}\n[dir=rtl] .mdc-text-field--outlined .mdc-floating-label {\n  left: auto;\n  right: 4px;\n}\n.mdc-text-field--filled .mdc-floating-label {\n  left: 16px;\n  right: auto;\n}\n[dir=rtl] .mdc-text-field--filled .mdc-floating-label {\n  left: auto;\n  right: 16px;\n}\n.mdc-text-field--disabled .mdc-floating-label {\n  cursor: default;\n}\n@media (forced-colors: active) {\n  .mdc-text-field--disabled .mdc-floating-label {\n    z-index: 1;\n  }\n}\n.mdc-text-field--filled.mdc-text-field--no-label .mdc-floating-label {\n  display: none;\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-floating-label {\n  color: var(--mat-form-field-filled-label-text-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-floating-label {\n  color: var(--mat-form-field-filled-focus-label-text-color, var(--mat-sys-primary));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-floating-label {\n  color: var(--mat-form-field-filled-hover-label-text-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled.mdc-text-field--disabled .mdc-floating-label {\n  color: var(--mat-form-field-filled-disabled-label-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled).mdc-text-field--invalid .mdc-floating-label {\n  color: var(--mat-form-field-filled-error-label-text-color, var(--mat-sys-error));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled).mdc-text-field--invalid.mdc-text-field--focused .mdc-floating-label {\n  color: var(--mat-form-field-filled-error-focus-label-text-color, var(--mat-sys-error));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled).mdc-text-field--invalid:not(.mdc-text-field--disabled):hover .mdc-floating-label {\n  color: var(--mat-form-field-filled-error-hover-label-text-color, var(--mat-sys-on-error-container));\n}\n.mdc-text-field--filled .mdc-floating-label {\n  font-family: var(--mat-form-field-filled-label-text-font, var(--mat-sys-body-large-font));\n  font-size: var(--mat-form-field-filled-label-text-size, var(--mat-sys-body-large-size));\n  font-weight: var(--mat-form-field-filled-label-text-weight, var(--mat-sys-body-large-weight));\n  letter-spacing: var(--mat-form-field-filled-label-text-tracking, var(--mat-sys-body-large-tracking));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-floating-label {\n  color: var(--mat-form-field-outlined-label-text-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-floating-label {\n  color: var(--mat-form-field-outlined-focus-label-text-color, var(--mat-sys-primary));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-floating-label {\n  color: var(--mat-form-field-outlined-hover-label-text-color, var(--mat-sys-on-surface));\n}\n.mdc-text-field--outlined.mdc-text-field--disabled .mdc-floating-label {\n  color: var(--mat-form-field-outlined-disabled-label-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid .mdc-floating-label {\n  color: var(--mat-form-field-outlined-error-label-text-color, var(--mat-sys-error));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid.mdc-text-field--focused .mdc-floating-label {\n  color: var(--mat-form-field-outlined-error-focus-label-text-color, var(--mat-sys-error));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid:not(.mdc-text-field--disabled):hover .mdc-floating-label {\n  color: var(--mat-form-field-outlined-error-hover-label-text-color, var(--mat-sys-on-error-container));\n}\n.mdc-text-field--outlined .mdc-floating-label {\n  font-family: var(--mat-form-field-outlined-label-text-font, var(--mat-sys-body-large-font));\n  font-size: var(--mat-form-field-outlined-label-text-size, var(--mat-sys-body-large-size));\n  font-weight: var(--mat-form-field-outlined-label-text-weight, var(--mat-sys-body-large-weight));\n  letter-spacing: var(--mat-form-field-outlined-label-text-tracking, var(--mat-sys-body-large-tracking));\n}\n\n.mdc-floating-label--float-above {\n  cursor: auto;\n  transform: translateY(-106%) scale(0.75);\n}\n.mdc-text-field--filled .mdc-floating-label--float-above {\n  transform: translateY(-106%) scale(0.75);\n}\n.mdc-text-field--outlined .mdc-floating-label--float-above {\n  transform: translateY(-37.25px) scale(1);\n  font-size: 0.75rem;\n}\n.mdc-notched-outline .mdc-floating-label--float-above {\n  text-overflow: clip;\n}\n.mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  max-width: 133.3333333333%;\n}\n.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above, .mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  transform: translateY(-34.75px) scale(0.75);\n}\n.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above, .mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  font-size: 1rem;\n}\n\n.mdc-floating-label--required:not(.mdc-floating-label--hide-required-marker)::after {\n  margin-left: 1px;\n  margin-right: 0;\n  content: \"*\";\n}\n[dir=rtl] .mdc-floating-label--required:not(.mdc-floating-label--hide-required-marker)::after {\n  margin-left: 0;\n  margin-right: 1px;\n}\n\n.mdc-notched-outline {\n  display: flex;\n  position: absolute;\n  top: 0;\n  right: 0;\n  left: 0;\n  box-sizing: border-box;\n  width: 100%;\n  max-width: 100%;\n  height: 100%;\n  text-align: left;\n  pointer-events: none;\n}\n[dir=rtl] .mdc-notched-outline {\n  text-align: right;\n}\n.mdc-text-field--outlined .mdc-notched-outline {\n  z-index: 1;\n}\n\n.mat-mdc-notch-piece {\n  box-sizing: border-box;\n  height: 100%;\n  pointer-events: none;\n  border: none;\n  border-top: 1px solid;\n  border-bottom: 1px solid;\n}\n.mdc-text-field--focused .mat-mdc-notch-piece {\n  border-width: 2px;\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-outline-color, var(--mat-sys-outline));\n  border-width: var(--mat-form-field-outlined-outline-width, 1px);\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-hover-outline-color, var(--mat-sys-on-surface));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-focus-outline-color, var(--mat-sys-primary));\n}\n.mdc-text-field--outlined.mdc-text-field--disabled .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-disabled-outline-color, color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-error-outline-color, var(--mat-sys-error));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid:not(.mdc-text-field--focused):hover .mdc-notched-outline .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-error-hover-outline-color, var(--mat-sys-on-error-container));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--invalid.mdc-text-field--focused .mat-mdc-notch-piece {\n  border-color: var(--mat-form-field-outlined-error-focus-outline-color, var(--mat-sys-error));\n}\n.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline .mat-mdc-notch-piece {\n  border-width: var(--mat-form-field-outlined-focus-outline-width, 2px);\n}\n\n.mdc-notched-outline__leading {\n  border-left: 1px solid;\n  border-right: none;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-top-left-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n  border-bottom-left-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n}\n.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading {\n  width: max(12px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small)));\n}\n[dir=rtl] .mdc-notched-outline__leading {\n  border-left: none;\n  border-right: 1px solid;\n  border-bottom-left-radius: 0;\n  border-top-left-radius: 0;\n  border-top-right-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n  border-bottom-right-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n}\n\n.mdc-notched-outline__trailing {\n  flex-grow: 1;\n  border-left: none;\n  border-right: 1px solid;\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n  border-top-right-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n  border-bottom-right-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n}\n[dir=rtl] .mdc-notched-outline__trailing {\n  border-left: 1px solid;\n  border-right: none;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-top-left-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n  border-bottom-left-radius: var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small));\n}\n\n.mdc-notched-outline__notch {\n  flex: 0 0 auto;\n  width: auto;\n}\n.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__notch {\n  max-width: min(var(--mat-form-field-notch-max-width, 100%), calc(100% - max(12px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small))) * 2));\n}\n.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  max-width: min(100%, calc(100% - max(12px, var(--mat-form-field-outlined-container-shape, var(--mat-sys-corner-extra-small))) * 2));\n}\n.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-top: 1px;\n}\n.mdc-text-field--focused.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-top: 2px;\n}\n.mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-left: 0;\n  padding-right: 8px;\n  border-top: none;\n}\n[dir=rtl] .mdc-notched-outline--notched .mdc-notched-outline__notch {\n  padding-left: 8px;\n  padding-right: 0;\n}\n.mdc-notched-outline--no-label .mdc-notched-outline__notch {\n  display: none;\n}\n\n.mdc-line-ripple::before, .mdc-line-ripple::after {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  border-bottom-style: solid;\n  content: \"\";\n}\n.mdc-line-ripple::before {\n  z-index: 1;\n  border-bottom-width: var(--mat-form-field-filled-active-indicator-height, 1px);\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-line-ripple::before {\n  border-bottom-color: var(--mat-form-field-filled-active-indicator-color, var(--mat-sys-on-surface-variant));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-line-ripple::before {\n  border-bottom-color: var(--mat-form-field-filled-hover-active-indicator-color, var(--mat-sys-on-surface));\n}\n.mdc-text-field--filled.mdc-text-field--disabled .mdc-line-ripple::before {\n  border-bottom-color: var(--mat-form-field-filled-disabled-active-indicator-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled).mdc-text-field--invalid .mdc-line-ripple::before {\n  border-bottom-color: var(--mat-form-field-filled-error-active-indicator-color, var(--mat-sys-error));\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled).mdc-text-field--invalid:not(.mdc-text-field--focused):hover .mdc-line-ripple::before {\n  border-bottom-color: var(--mat-form-field-filled-error-hover-active-indicator-color, var(--mat-sys-on-error-container));\n}\n.mdc-line-ripple::after {\n  transform: scaleX(0);\n  opacity: 0;\n  z-index: 2;\n}\n.mdc-text-field--filled .mdc-line-ripple::after {\n  border-bottom-width: var(--mat-form-field-filled-focus-active-indicator-height, 2px);\n}\n.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-line-ripple::after {\n  border-bottom-color: var(--mat-form-field-filled-focus-active-indicator-color, var(--mat-sys-primary));\n}\n.mdc-text-field--filled.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-line-ripple::after {\n  border-bottom-color: var(--mat-form-field-filled-error-focus-active-indicator-color, var(--mat-sys-error));\n}\n\n.mdc-line-ripple--active::after {\n  transform: scaleX(1);\n  opacity: 1;\n}\n\n.mdc-line-ripple--deactivating::after {\n  opacity: 0;\n}\n\n.mdc-text-field--disabled {\n  pointer-events: none;\n}\n\n.mat-mdc-form-field-textarea-control {\n  vertical-align: middle;\n  resize: vertical;\n  box-sizing: border-box;\n  height: auto;\n  margin: 0;\n  padding: 0;\n  border: none;\n  overflow: auto;\n}\n\n.mat-mdc-form-field-input-control.mat-mdc-form-field-input-control {\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font: inherit;\n  letter-spacing: inherit;\n  text-decoration: inherit;\n  text-transform: inherit;\n  border: none;\n}\n\n.mat-mdc-form-field .mat-mdc-floating-label.mdc-floating-label {\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  line-height: normal;\n  pointer-events: all;\n  will-change: auto;\n}\n\n.mat-mdc-form-field:not(.mat-form-field-disabled) .mat-mdc-floating-label.mdc-floating-label {\n  cursor: inherit;\n}\n\n.mdc-text-field--no-label:not(.mdc-text-field--textarea) .mat-mdc-form-field-input-control.mdc-text-field__input,\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-input-control {\n  height: auto;\n}\n\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-input-control.mdc-text-field__input[type=color] {\n  height: 23px;\n}\n\n.mat-mdc-text-field-wrapper {\n  height: auto;\n  flex: auto;\n  will-change: auto;\n}\n\n.mat-mdc-form-field-has-icon-prefix .mat-mdc-text-field-wrapper {\n  padding-left: 0;\n  --mat-mdc-form-field-label-offset-x: -16px;\n}\n\n.mat-mdc-form-field-has-icon-suffix .mat-mdc-text-field-wrapper {\n  padding-right: 0;\n}\n\n[dir=rtl] .mat-mdc-text-field-wrapper {\n  padding-left: 16px;\n  padding-right: 16px;\n}\n[dir=rtl] .mat-mdc-form-field-has-icon-suffix .mat-mdc-text-field-wrapper {\n  padding-left: 0;\n}\n[dir=rtl] .mat-mdc-form-field-has-icon-prefix .mat-mdc-text-field-wrapper {\n  padding-right: 0;\n}\n\n.mat-form-field-disabled .mdc-text-field__input::placeholder {\n  color: var(--mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-disabled .mdc-text-field__input::-moz-placeholder {\n  color: var(--mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-disabled .mdc-text-field__input::-webkit-input-placeholder {\n  color: var(--mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-disabled .mdc-text-field__input:-ms-input-placeholder {\n  color: var(--mat-form-field-disabled-input-text-placeholder-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n\n.mat-mdc-form-field-label-always-float .mdc-text-field__input::placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n  opacity: 1;\n}\n\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-infix .mat-mdc-floating-label {\n  left: auto;\n  right: auto;\n}\n\n.mat-mdc-text-field-wrapper.mdc-text-field--outlined .mdc-text-field__input {\n  display: inline-block;\n}\n\n.mat-mdc-form-field .mat-mdc-text-field-wrapper.mdc-text-field .mdc-notched-outline__notch {\n  padding-top: 0;\n}\n\n.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field .mdc-notched-outline__notch {\n  border-left: 1px solid transparent;\n}\n\n[dir=rtl] .mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field.mat-mdc-form-field .mdc-notched-outline__notch {\n  border-left: none;\n  border-right: 1px solid transparent;\n}\n\n.mat-mdc-form-field-infix {\n  min-height: var(--mat-form-field-container-height, 56px);\n  padding-top: var(--mat-form-field-filled-with-label-container-padding-top, 24px);\n  padding-bottom: var(--mat-form-field-filled-with-label-container-padding-bottom, 8px);\n}\n.mdc-text-field--outlined .mat-mdc-form-field-infix, .mdc-text-field--no-label .mat-mdc-form-field-infix {\n  padding-top: var(--mat-form-field-container-vertical-padding, 16px);\n  padding-bottom: var(--mat-form-field-container-vertical-padding, 16px);\n}\n\n.mat-mdc-text-field-wrapper .mat-mdc-form-field-flex .mat-mdc-floating-label {\n  top: calc(var(--mat-form-field-container-height, 56px) / 2);\n}\n\n.mdc-text-field--filled .mat-mdc-floating-label {\n  display: var(--mat-form-field-filled-label-display, block);\n}\n\n.mat-mdc-text-field-wrapper.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  --mat-mdc-form-field-label-transform: translateY(calc(calc(6.75px + var(--mat-form-field-container-height, 56px) / 2) * -1))\n    scale(var(--mat-mdc-form-field-floating-label-scale, 0.75));\n  transform: var(--mat-mdc-form-field-label-transform);\n}\n\n@keyframes _mat-form-field-subscript-animation {\n  from {\n    opacity: 0;\n    transform: translateY(-5px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n.mat-mdc-form-field-subscript-wrapper {\n  box-sizing: border-box;\n  width: 100%;\n  position: relative;\n}\n\n.mat-mdc-form-field-hint-wrapper,\n.mat-mdc-form-field-error-wrapper {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  padding: 0 16px;\n  opacity: 1;\n  transform: translateY(0);\n  animation: _mat-form-field-subscript-animation 0ms cubic-bezier(0.55, 0, 0.55, 0.2);\n}\n\n.mat-mdc-form-field-subscript-dynamic-size .mat-mdc-form-field-hint-wrapper,\n.mat-mdc-form-field-subscript-dynamic-size .mat-mdc-form-field-error-wrapper {\n  position: static;\n}\n\n.mat-mdc-form-field-bottom-align::before {\n  content: \"\";\n  display: inline-block;\n  height: 16px;\n}\n\n.mat-mdc-form-field-bottom-align.mat-mdc-form-field-subscript-dynamic-size::before {\n  content: unset;\n}\n\n.mat-mdc-form-field-hint-end {\n  order: 1;\n}\n\n.mat-mdc-form-field-hint-wrapper {\n  display: flex;\n}\n\n.mat-mdc-form-field-hint-spacer {\n  flex: 1 0 1em;\n}\n\n.mat-mdc-form-field-error {\n  display: block;\n  color: var(--mat-form-field-error-text-color, var(--mat-sys-error));\n}\n\n.mat-mdc-form-field-subscript-wrapper,\n.mat-mdc-form-field-bottom-align::before {\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-family: var(--mat-form-field-subscript-text-font, var(--mat-sys-body-small-font));\n  line-height: var(--mat-form-field-subscript-text-line-height, var(--mat-sys-body-small-line-height));\n  font-size: var(--mat-form-field-subscript-text-size, var(--mat-sys-body-small-size));\n  letter-spacing: var(--mat-form-field-subscript-text-tracking, var(--mat-sys-body-small-tracking));\n  font-weight: var(--mat-form-field-subscript-text-weight, var(--mat-sys-body-small-weight));\n}\n\n.mat-mdc-form-field-focus-overlay {\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  position: absolute;\n  opacity: 0;\n  pointer-events: none;\n  background-color: var(--mat-form-field-state-layer-color, var(--mat-sys-on-surface));\n}\n.mat-mdc-text-field-wrapper:hover .mat-mdc-form-field-focus-overlay {\n  opacity: var(--mat-form-field-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));\n}\n.mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {\n  opacity: var(--mat-form-field-focus-state-layer-opacity, 0);\n}\n\nselect.mat-mdc-form-field-input-control {\n  -moz-appearance: none;\n  -webkit-appearance: none;\n  background-color: transparent;\n  display: inline-flex;\n  box-sizing: border-box;\n}\nselect.mat-mdc-form-field-input-control:not(:disabled) {\n  cursor: pointer;\n}\nselect.mat-mdc-form-field-input-control:not(.mat-mdc-native-select-inline) option {\n  color: var(--mat-form-field-select-option-text-color, var(--mat-sys-neutral10));\n}\nselect.mat-mdc-form-field-input-control:not(.mat-mdc-native-select-inline) option:disabled {\n  color: var(--mat-form-field-select-disabled-option-text-color, color-mix(in srgb, var(--mat-sys-neutral10) 38%, transparent));\n}\n\n.mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-infix::after {\n  content: \"\";\n  width: 0;\n  height: 0;\n  border-left: 5px solid transparent;\n  border-right: 5px solid transparent;\n  border-top: 5px solid;\n  position: absolute;\n  right: 0;\n  top: 50%;\n  margin-top: -2.5px;\n  pointer-events: none;\n  color: var(--mat-form-field-enabled-select-arrow-color, var(--mat-sys-on-surface-variant));\n}\n[dir=rtl] .mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-infix::after {\n  right: auto;\n  left: 0;\n}\n.mat-mdc-form-field-type-mat-native-select.mat-focused .mat-mdc-form-field-infix::after {\n  color: var(--mat-form-field-focus-select-arrow-color, var(--mat-sys-primary));\n}\n.mat-mdc-form-field-type-mat-native-select.mat-form-field-disabled .mat-mdc-form-field-infix::after {\n  color: var(--mat-form-field-disabled-select-arrow-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-input-control {\n  padding-right: 15px;\n}\n[dir=rtl] .mat-mdc-form-field-type-mat-native-select .mat-mdc-form-field-input-control {\n  padding-right: 0;\n  padding-left: 15px;\n}\n\n@media (forced-colors: active) {\n  .mat-form-field-appearance-fill .mat-mdc-text-field-wrapper {\n    outline: solid 1px;\n  }\n}\n@media (forced-colors: active) {\n  .mat-form-field-appearance-fill.mat-form-field-disabled .mat-mdc-text-field-wrapper {\n    outline-color: GrayText;\n  }\n}\n\n@media (forced-colors: active) {\n  .mat-form-field-appearance-fill.mat-focused .mat-mdc-text-field-wrapper {\n    outline: dashed 3px;\n  }\n}\n\n@media (forced-colors: active) {\n  .mat-mdc-form-field.mat-focused .mdc-notched-outline {\n    border: dashed 3px;\n  }\n}\n\n.mat-mdc-form-field-input-control[type=date], .mat-mdc-form-field-input-control[type=datetime], .mat-mdc-form-field-input-control[type=datetime-local], .mat-mdc-form-field-input-control[type=month], .mat-mdc-form-field-input-control[type=week], .mat-mdc-form-field-input-control[type=time] {\n  line-height: 1;\n}\n.mat-mdc-form-field-input-control::-webkit-datetime-edit {\n  line-height: 1;\n  padding: 0;\n  margin-bottom: -2px;\n}\n\n.mat-mdc-form-field {\n  --mat-mdc-form-field-floating-label-scale: 0.75;\n  display: inline-flex;\n  flex-direction: column;\n  min-width: 0;\n  text-align: left;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-family: var(--mat-form-field-container-text-font, var(--mat-sys-body-large-font));\n  line-height: var(--mat-form-field-container-text-line-height, var(--mat-sys-body-large-line-height));\n  font-size: var(--mat-form-field-container-text-size, var(--mat-sys-body-large-size));\n  letter-spacing: var(--mat-form-field-container-text-tracking, var(--mat-sys-body-large-tracking));\n  font-weight: var(--mat-form-field-container-text-weight, var(--mat-sys-body-large-weight));\n}\n.mat-mdc-form-field .mdc-text-field--outlined .mdc-floating-label--float-above {\n  font-size: calc(var(--mat-form-field-outlined-label-text-populated-size) * var(--mat-mdc-form-field-floating-label-scale));\n}\n.mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  font-size: var(--mat-form-field-outlined-label-text-populated-size);\n}\n[dir=rtl] .mat-mdc-form-field {\n  text-align: right;\n}\n\n.mat-mdc-form-field-flex {\n  display: inline-flex;\n  align-items: baseline;\n  box-sizing: border-box;\n  width: 100%;\n}\n\n.mat-mdc-text-field-wrapper {\n  width: 100%;\n  z-index: 0;\n}\n\n.mat-mdc-form-field-icon-prefix,\n.mat-mdc-form-field-icon-suffix {\n  align-self: center;\n  line-height: 0;\n  pointer-events: auto;\n  position: relative;\n  z-index: 1;\n}\n.mat-mdc-form-field-icon-prefix > .mat-icon,\n.mat-mdc-form-field-icon-suffix > .mat-icon {\n  padding: 0 12px;\n  box-sizing: content-box;\n}\n\n.mat-mdc-form-field-icon-prefix {\n  color: var(--mat-form-field-leading-icon-color, var(--mat-sys-on-surface-variant));\n}\n.mat-form-field-disabled .mat-mdc-form-field-icon-prefix {\n  color: var(--mat-form-field-disabled-leading-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n\n.mat-mdc-form-field-icon-suffix {\n  color: var(--mat-form-field-trailing-icon-color, var(--mat-sys-on-surface-variant));\n}\n.mat-form-field-disabled .mat-mdc-form-field-icon-suffix {\n  color: var(--mat-form-field-disabled-trailing-icon-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));\n}\n.mat-form-field-invalid .mat-mdc-form-field-icon-suffix {\n  color: var(--mat-form-field-error-trailing-icon-color, var(--mat-sys-error));\n}\n.mat-form-field-invalid:not(.mat-focused):not(.mat-form-field-disabled) .mat-mdc-text-field-wrapper:hover .mat-mdc-form-field-icon-suffix {\n  color: var(--mat-form-field-error-hover-trailing-icon-color, var(--mat-sys-on-error-container));\n}\n.mat-form-field-invalid.mat-focused .mat-mdc-text-field-wrapper .mat-mdc-form-field-icon-suffix {\n  color: var(--mat-form-field-error-focus-trailing-icon-color, var(--mat-sys-error));\n}\n\n.mat-mdc-form-field-icon-prefix,\n[dir=rtl] .mat-mdc-form-field-icon-suffix {\n  padding: 0 4px 0 0;\n}\n\n.mat-mdc-form-field-icon-suffix,\n[dir=rtl] .mat-mdc-form-field-icon-prefix {\n  padding: 0 0 0 4px;\n}\n\n.mat-mdc-form-field-subscript-wrapper .mat-icon,\n.mat-mdc-form-field label .mat-icon {\n  width: 1em;\n  height: 1em;\n  font-size: inherit;\n}\n\n.mat-mdc-form-field-infix {\n  flex: auto;\n  min-width: 0;\n  width: 180px;\n  position: relative;\n  box-sizing: border-box;\n}\n.mat-mdc-form-field-infix:has(textarea[cols]) {\n  width: auto;\n}\n\n.mat-mdc-form-field .mdc-notched-outline__notch {\n  margin-left: -1px;\n  -webkit-clip-path: inset(-9em -999em -9em 1px);\n  clip-path: inset(-9em -999em -9em 1px);\n}\n[dir=rtl] .mat-mdc-form-field .mdc-notched-outline__notch {\n  margin-left: 0;\n  margin-right: -1px;\n  -webkit-clip-path: inset(-9em 1px -9em -999em);\n  clip-path: inset(-9em 1px -9em -999em);\n}\n\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-floating-label {\n  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input {\n  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input::placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input::-moz-placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input::-webkit-input-placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field__input:-ms-input-placeholder {\n  transition: opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input::placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input::placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input::-moz-placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input::-moz-placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input::-webkit-input-placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input::-webkit-input-placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--no-label .mdc-text-field__input:-ms-input-placeholder, .mat-mdc-form-field.mat-form-field-animations-enabled.mdc-text-field--focused .mdc-text-field__input:-ms-input-placeholder {\n  transition-delay: 40ms;\n  transition-duration: 110ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-text-field--filled:not(.mdc-ripple-upgraded):focus .mdc-text-field__ripple::before {\n  transition-duration: 75ms;\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mdc-line-ripple::after {\n  transition: transform 180ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mat-mdc-form-field.mat-form-field-animations-enabled .mat-mdc-form-field-hint-wrapper,\n.mat-mdc-form-field.mat-form-field-animations-enabled .mat-mdc-form-field-error-wrapper {\n  animation-duration: 300ms;\n}\n\n.mdc-notched-outline .mdc-floating-label {\n  max-width: calc(100% + 1px);\n}\n\n.mdc-notched-outline--upgraded .mdc-floating-label--float-above {\n  max-width: calc(133.3333333333% + 1px);\n}\n"]
		}]
	}], () => [], {
		_textField: [{
			type: ViewChild,
			args: ["textField"]
		}],
		_iconPrefixContainer: [{
			type: ViewChild,
			args: ["iconPrefixContainer"]
		}],
		_textPrefixContainer: [{
			type: ViewChild,
			args: ["textPrefixContainer"]
		}],
		_iconSuffixContainer: [{
			type: ViewChild,
			args: ["iconSuffixContainer"]
		}],
		_textSuffixContainer: [{
			type: ViewChild,
			args: ["textSuffixContainer"]
		}],
		_floatingLabel: [{
			type: ViewChild,
			args: [MatFormFieldFloatingLabel]
		}],
		_notchedOutline: [{
			type: ViewChild,
			args: [MatFormFieldNotchedOutline]
		}],
		_lineRipple: [{
			type: ViewChild,
			args: [MatFormFieldLineRipple]
		}],
		_iconPrefixContainerSignal: [{
			type: ViewChild,
			args: ["iconPrefixContainer", { isSignal: true }]
		}],
		_textPrefixContainerSignal: [{
			type: ViewChild,
			args: ["textPrefixContainer", { isSignal: true }]
		}],
		_iconSuffixContainerSignal: [{
			type: ViewChild,
			args: ["iconSuffixContainer", { isSignal: true }]
		}],
		_textSuffixContainerSignal: [{
			type: ViewChild,
			args: ["textSuffixContainer", { isSignal: true }]
		}],
		_formFieldControl: [{
			type: ContentChild,
			args: [MatFormFieldControl]
		}],
		_prefixChildren: [{
			type: ContentChildren,
			args: [MAT_PREFIX, { descendants: true }]
		}],
		_suffixChildren: [{
			type: ContentChildren,
			args: [MAT_SUFFIX, { descendants: true }]
		}],
		_errorChildren: [{
			type: ContentChildren,
			args: [MAT_ERROR, { descendants: true }]
		}],
		_hintChildren: [{
			type: ContentChildren,
			args: [MatHint, { descendants: true }]
		}],
		_labelChild: [{
			type: ContentChild,
			args: [forwardRef(() => MatLabel), { isSignal: true }]
		}],
		hideRequiredMarker: [{ type: Input }],
		color: [{ type: Input }],
		floatLabel: [{ type: Input }],
		appearance: [{ type: Input }],
		subscriptSizing: [{ type: Input }],
		hintLabel: [{ type: Input }]
	});
})();
export { MAT_SUFFIX as a, MatFormFieldControl as c, MatPrefix as d, MatSuffix as f, FORM_FIELD as g, getMatFormFieldPlaceholderConflictError as h, MAT_PREFIX as i, MatHint as l, getMatFormFieldMissingControlError as m, MAT_FORM_FIELD as n, MatError as o, getMatFormFieldDuplicatedHintError as p, MAT_FORM_FIELD_DEFAULT_OPTIONS as r, MatFormField as s, MAT_ERROR as t, MatLabel as u };
