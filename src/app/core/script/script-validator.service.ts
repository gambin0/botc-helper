import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Ajv, { AnySchema } from 'ajv';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

@Injectable({ providedIn: 'root' })
export class ScriptValidatorService {
  private http = inject(HttpClient);
  private ajv: Ajv | null = null;
  private schemaPromise: Promise<AnySchema> | null = null;

  /**
   * Load the JSON schema from the asset file.
   */
  private async loadSchema(): Promise<AnySchema> {
    if (!this.schemaPromise) {
      const schema = await this.http.get<AnySchema>('/assets/data/script-schema.json').toPromise();
      if (!schema) {
        throw new Error('Failed to load script schema');
      }
      this.schemaPromise = Promise.resolve(schema);
    }
    return this.schemaPromise;
  }

  /**
   * Get or create the Ajv validator instance.
   */
  private getAjv(): Ajv {
    if (!this.ajv) {
      this.ajv = new Ajv({ allErrors: true, verbose: true });
    }
    return this.ajv;
  }

  /**
   * Validate a script against the official JSON schema.
   * @param scriptData The script data to validate
   * @returns Promise<ValidationResult> with validation result
   */
  async validate(scriptData: unknown): Promise<ValidationResult> {
    try {
      const schema = await this.loadSchema();
      const ajv = this.getAjv();
      const validate = ajv.compile(schema);
      const valid = validate(scriptData);

      if (valid) {
        return { valid: true };
      }

      const errors = validate.errors?.map(err => {
        const path = err.instancePath || '/';
        const message = err.message || 'Unknown error';
        return `${path}: ${message}`;
      }) || ['Validation failed with no details'];

      return { valid: false, errors };
    } catch (e) {
      return {
        valid: false,
        errors: [`Schema validation error: ${e instanceof Error ? e.message : String(e)}`]
      };
    }
  }
}
