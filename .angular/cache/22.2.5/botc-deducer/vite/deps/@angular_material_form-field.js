import { Wi as setClassMetadata, ao as ɵɵdefineNgModule, jl as ɵɵdefineInjector, qn as NgModule } from "./core-DUwRcsgK.js";
import { i as ObserversModule } from "./_animation-chunk-BSRSnsxC.js";
import { t as BidiModule } from "./bidi-DfOrtKt2.js";
import "./platform-FcODWz2l.js";
import { a as MAT_SUFFIX, c as MatFormFieldControl, d as MatPrefix, f as MatSuffix, h as getMatFormFieldPlaceholderConflictError, i as MAT_PREFIX, l as MatHint, m as getMatFormFieldMissingControlError, n as MAT_FORM_FIELD, o as MatError, p as getMatFormFieldDuplicatedHintError, r as MAT_FORM_FIELD_DEFAULT_OPTIONS, s as MatFormField, t as MAT_ERROR, u as MatLabel } from "./_form-field-chunk-CKAZDbTh.js";
// node_modules/@angular/material/fesm2022/form-field.mjs
var MatFormFieldModule = class MatFormFieldModule {
	static ɵfac = function MatFormFieldModule_Factory(__ngFactoryType__) {
		return new (__ngFactoryType__ || MatFormFieldModule)();
	};
	static ɵmod = /*@__PURE__*/ ɵɵdefineNgModule({
		type: MatFormFieldModule,
		imports: [
			ObserversModule,
			MatFormField,
			MatLabel,
			MatError,
			MatHint,
			MatPrefix,
			MatSuffix
		],
		exports: [
			MatFormField,
			MatLabel,
			MatHint,
			MatError,
			MatPrefix,
			MatSuffix,
			BidiModule
		]
	});
	static ɵinj = /*@__PURE__*/ ɵɵdefineInjector({ imports: [
		ObserversModule,
		MatFormField,
		BidiModule
	] });
};
(() => {
	(typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatFormFieldModule, [{
		type: NgModule,
		args: [{
			imports: [
				ObserversModule,
				MatFormField,
				MatLabel,
				MatError,
				MatHint,
				MatPrefix,
				MatSuffix
			],
			exports: [
				MatFormField,
				MatLabel,
				MatHint,
				MatError,
				MatPrefix,
				MatSuffix,
				BidiModule
			]
		}]
	}], null, null);
})();
export { MAT_ERROR, MAT_FORM_FIELD, MAT_FORM_FIELD_DEFAULT_OPTIONS, MAT_PREFIX, MAT_SUFFIX, MatError, MatFormField, MatFormFieldControl, MatFormFieldModule, MatHint, MatLabel, MatPrefix, MatSuffix, getMatFormFieldDuplicatedHintError, getMatFormFieldMissingControlError, getMatFormFieldPlaceholderConflictError };
