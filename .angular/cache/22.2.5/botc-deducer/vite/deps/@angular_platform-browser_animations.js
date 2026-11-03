import { Al as ɵɵdefineInjectable, Ei as performanceMarkFeature, Fn as Injectable, Pl as ɵɵinject, Pn as Inject, Rc as NgZone, Wi as setClassMetadata, _c as DOCUMENT, ao as ɵɵdefineNgModule, ar as RendererFactory2, dl as inject, fc as ANIMATION_MODULE_TYPE, jl as ɵɵdefineInjector, qn as NgModule } from "./core-RGofNjFx.js";
import { d as DomRendererFactory2, r as BrowserModule } from "./_browser-chunk-U1T84XM7.js";
// \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
// node_modules/@angular/platform-browser/fesm2022/animations.mjs
/**
* @license Angular v22.2.4
* (c) 2010-2026 Google LLC. https://angular.dev/
* License: MIT
*/
var import_platform_browser = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {};
	throw new Error(`Could not resolve "@angular/animations/browser" imported by "@angular/platform-browser". Is it installed?`);
})))(), 1);
var InjectableAnimationEngine = class InjectableAnimationEngine extends import_platform_browser.ɵAnimationEngine {
	constructor(doc, driver, normalizer) {
		super(doc, driver, normalizer);
	}
	ngOnDestroy() {
		this.flush();
	}
	static ɵfac = function InjectableAnimationEngine_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || InjectableAnimationEngine)(ɵɵinject(DOCUMENT), ɵɵinject(import_platform_browser.AnimationDriver), ɵɵinject(import_platform_browser.ɵAnimationStyleNormalizer));
	};
	static ɵprov = /*@__PURE__*/ ɵɵdefineInjectable({
		token: InjectableAnimationEngine,
		factory: InjectableAnimationEngine.ɵfac
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(InjectableAnimationEngine, [{ type: Injectable }], () => [
		{
			type: Document,
			decorators: [{
				type: Inject,
				args: [DOCUMENT]
			}]
		},
		{ type: import_platform_browser.AnimationDriver },
		{ type: import_platform_browser.ɵAnimationStyleNormalizer }
	], null);
})();
function instantiateDefaultStyleNormalizer() {
	return new import_platform_browser.ɵWebAnimationsStyleNormalizer();
}
function instantiateRendererFactory() {
	return new import_platform_browser.ɵAnimationRendererFactory(inject(DomRendererFactory2), inject(import_platform_browser.ɵAnimationEngine), inject(NgZone));
}
var SHARED_ANIMATION_PROVIDERS = [
	{
		provide: import_platform_browser.ɵAnimationStyleNormalizer,
		useFactory: instantiateDefaultStyleNormalizer
	},
	{
		provide: import_platform_browser.ɵAnimationEngine,
		useClass: InjectableAnimationEngine
	},
	{
		provide: RendererFactory2,
		useFactory: instantiateRendererFactory
	}
];
var BROWSER_NOOP_ANIMATIONS_PROVIDERS = [
	{
		provide: import_platform_browser.AnimationDriver,
		useClass: import_platform_browser.NoopAnimationDriver
	},
	{
		provide: ANIMATION_MODULE_TYPE,
		useValue: "NoopAnimations"
	},
	...SHARED_ANIMATION_PROVIDERS
];
var BROWSER_ANIMATIONS_PROVIDERS = [
	{
		provide: import_platform_browser.AnimationDriver,
		useFactory: () => new import_platform_browser.ɵWebAnimationsDriver()
	},
	{
		provide: ANIMATION_MODULE_TYPE,
		useFactory: () => "BrowserAnimations"
	},
	...SHARED_ANIMATION_PROVIDERS
];
var BrowserAnimationsModule = class BrowserAnimationsModule {
	static withConfig(config) {
		return {
			ngModule: BrowserAnimationsModule,
			providers: config.disableAnimations ? BROWSER_NOOP_ANIMATIONS_PROVIDERS : BROWSER_ANIMATIONS_PROVIDERS
		};
	}
	static ɵfac = function BrowserAnimationsModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || BrowserAnimationsModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: BrowserAnimationsModule,
		exports: [BrowserModule]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({
		providers: BROWSER_ANIMATIONS_PROVIDERS,
		imports: [BrowserModule]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrowserAnimationsModule, [{
		type: NgModule,
		args: [{
			exports: [BrowserModule],
			providers: BROWSER_ANIMATIONS_PROVIDERS
		}]
	}], null, null);
})();
function provideAnimations() {
	performanceMarkFeature("NgEagerAnimations");
	return [...BROWSER_ANIMATIONS_PROVIDERS];
}
var NoopAnimationsModule = class NoopAnimationsModule {
	static ɵfac = function NoopAnimationsModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || NoopAnimationsModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: NoopAnimationsModule,
		exports: [BrowserModule]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({
		providers: BROWSER_NOOP_ANIMATIONS_PROVIDERS,
		imports: [BrowserModule]
	});
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NoopAnimationsModule, [{
		type: NgModule,
		args: [{
			exports: [BrowserModule],
			providers: BROWSER_NOOP_ANIMATIONS_PROVIDERS
		}]
	}], null, null);
})();
function provideNoopAnimations() {
	return [...BROWSER_NOOP_ANIMATIONS_PROVIDERS];
}
export { ANIMATION_MODULE_TYPE, BrowserAnimationsModule, NoopAnimationsModule, provideAnimations, provideNoopAnimations, InjectableAnimationEngine as ɵInjectableAnimationEngine };
