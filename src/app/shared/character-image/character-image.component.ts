import { Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RoleRegistry } from '../../core/roles/role-registry';

/**
 * Character token image. Decorative: it is always shown next to the
 * character's name, so it is hidden from assistive technology.
 */
@Component({
  selector: 'app-character-image',
  imports: [NgOptimizedImage],
  template: `
    @if (src(); as s) {
      <img [ngSrc]="s" alt="" aria-hidden="true" [width]="size()" [height]="size()" class="token" />
    } @else {
      <span class="token placeholder" aria-hidden="true" [style.width.px]="size()" [style.height.px]="size()">
        {{ initial() }}
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
    .token {
      border-radius: 50%;
      object-fit: cover;
    }
    .placeholder {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--app-surface-alt);
      color: var(--mat-sys-on-surface);
      font-weight: 600;
    }
  `
})
export class CharacterImageComponent {
  readonly roleId = input.required<string>();
  /** Override the token colouring; defaults to the character's team. */
  readonly alignment = input<'good' | 'evil' | 'default'>('default');
  readonly size = input(32);

  private readonly role = computed(() => RoleRegistry.get(this.roleId()));
  protected readonly initial = computed(() => (this.role()?.name ?? this.roleId()).charAt(0).toUpperCase());

  protected readonly src = computed(() => {
    const role = this.role();
    if (!role?.edition) return null;
    let suffix = '';
    const alignment = this.alignment();
    if (alignment === 'good') suffix = '_g';
    else if (alignment === 'evil') suffix = '_e';
    else if (role.team === 'townsfolk' || role.team === 'outsider') suffix = '_g';
    else if (role.team === 'minion' || role.team === 'demon' || role.team === 'traveller') suffix = '_e';
    return `assets/characters/${role.edition}/${role.id}${suffix}.webp`;
  });
}
