import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RoleRegistry } from '../../core/roles/role-registry';

@Component({
  selector: 'app-character-image',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    @if (imageSrc()) {
      <img
        [ngSrc]="imageSrc()!"
        [alt]="name()"
        width="48"
        height="48"
        class="character-image"
        loading="lazy"
      />
    } @else {
      <div class="character-image-placeholder" [attr.aria-label]="name()">
        {{ name().charAt(0) }}
      </div>
    }
  `,
  styles: `
    .character-image {
      border-radius: 8px;
      object-fit: cover;
    }
    .character-image-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      color: #666;
    }
  `
})
export class CharacterImageComponent {
  roleId = input.required<string>();
  alignment = input<'good' | 'evil' | 'unknown'>('unknown');
  size = input<number>(48);

  name() {
    const role = RoleRegistry.get(this.roleId());
    return role?.name ?? this.roleId();
  }

  imageSrc(): string | null {
    const role = RoleRegistry.get(this.roleId());
    if (!role?.edition) {
      return null;
    }

    const edition = role.edition;
    const id = this.roleId();
    const align = this.alignment();

    // Try alignment-specific image first
    if (align === 'good') {
      return `/assets/characters/${edition}/${id}_g.webp`;
    }
    if (align === 'evil') {
      return `/assets/characters/${edition}/${id}_e.webp`;
    }

    // Default: try without alignment suffix, then good variant
    return `/assets/characters/${edition}/${id}.webp`;
  }
}
