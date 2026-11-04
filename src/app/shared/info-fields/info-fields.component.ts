import { Component, inject, input, model } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { GameStateService } from '../../core/services/game-state.service';
import { InfoField, InfoPayload, InfoSpec } from '../../core/rules/info-specs';

/** True when every field the spec needs has a valid value. */
export function isInfoComplete(spec: InfoSpec | undefined, info: InfoPayload): boolean {
  if (!spec) return false;
  if (info.none) return true;
  return spec.fields.every(f => {
    switch (f.kind) {
      case 'players':
        return (info.players ?? []).filter(Boolean).length === f.count && new Set(info.players).size === f.count;
      case 'player':
        return !!info.player;
      case 'role':
        return !!info[f.key];
      case 'number':
        return info.count !== undefined && !Number.isNaN(info.count) && info.count >= f.min && info.count <= f.max;
      case 'boolean':
        return info.yes !== undefined;
    }
  });
}

/** Form fields for one ability's information, generated from its InfoSpec. */
@Component({
  selector: 'app-info-fields',
  imports: [MatCheckboxModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatSelectModule],
  template: `
    @let s = spec();
    @if (s.noneOption) {
      <mat-checkbox [checked]="!!info().none" (change)="set('none', $event.checked)">{{ s.noneOption }}</mat-checkbox>
    }
    @if (!info().none) {
      @for (field of s.fields; track field.key) {
        @switch (field.kind) {
          @case ('players') {
            @for (i of indexes(field); track i) {
              <mat-form-field appearance="outline" class="full">
                <mat-label>{{ field.label }} #{{ i + 1 }}</mat-label>
                <mat-select [value]="info().players?.[i]" (selectionChange)="setPlayer(i, $event.value)">
                  @for (p of players(); track p.id) {
                    <mat-option [value]="p.id">{{ p.seat }}. {{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          }
          @case ('player') {
            <mat-form-field appearance="outline" class="full">
              <mat-label>{{ field.label }}</mat-label>
              <mat-select [value]="info().player" (selectionChange)="set('player', $event.value)">
                @for (p of players(); track p.id) {
                  <mat-option [value]="p.id">{{ p.seat }}. {{ p.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          @case ('role') {
            <mat-form-field appearance="outline" class="full">
              <mat-label>{{ field.label }}</mat-label>
              <mat-select [value]="info()[field.key]" (selectionChange)="set(field.key, $event.value)">
                @for (r of rolesFor(field); track r.id) {
                  <mat-option [value]="r.id">{{ r.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          @case ('number') {
            <mat-form-field appearance="outline" class="full">
              <mat-label>{{ field.label }}</mat-label>
              <input matInput type="number" [min]="field.min" [max]="field.max" [value]="info().count ?? ''"
                     (input)="set('count', toNumber($event))" />
            </mat-form-field>
          }
          @case ('boolean') {
            <mat-radio-group class="radios" [attr.aria-label]="field.label" [value]="info().yes"
                             (change)="set('yes', $event.value)">
              <span class="radio-label">{{ field.label }}</span>
              <mat-radio-button [value]="true">{{ field.trueLabel }}</mat-radio-button>
              <mat-radio-button [value]="false">{{ field.falseLabel }}</mat-radio-button>
            </mat-radio-group>
          }
        }
      }
    }
  `,
  styles: `
    :host { display: block; }
    .full { width: 100%; }
    .radios { display: flex; flex-direction: column; margin-bottom: 12px; }
    .radio-label { font-weight: 500; margin-top: 4px; }
  `
})
export class InfoFieldsComponent {
  private readonly gameState = inject(GameStateService);
  readonly spec = input.required<InfoSpec>();
  readonly info = model.required<InfoPayload>();

  protected readonly players = this.gameState.players;
  private readonly roles = this.gameState.activeRoles;

  protected readonly indexes = (field: InfoField) =>
    field.kind === 'players' ? Array.from({ length: field.count }, (_, i) => i) : [];

  protected rolesFor(field: InfoField) {
    const teams = field.kind === 'role' ? field.teams : undefined;
    return teams ? this.roles().filter(r => teams.includes(r.team)) : this.roles();
  }

  protected toNumber(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  protected set<K extends keyof InfoPayload>(key: K, value: InfoPayload[K]): void {
    this.info.update(info => ({ ...info, [key]: value }));
  }

  protected setPlayer(index: number, playerId: string): void {
    this.info.update(info => {
      const players = [...(info.players ?? [])];
      players[index] = playerId;
      return { ...info, players };
    });
  }
}

