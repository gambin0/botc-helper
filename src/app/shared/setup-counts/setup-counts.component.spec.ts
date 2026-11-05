import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RoleRegistry } from '../../core/roles/role-registry';
import { SetupCountsComponent } from './setup-counts.component';

describe('SetupCountsComponent', () => {
  function render(playerCount: number, roles: string[] = []) {
    const fixture = TestBed.createComponent(SetupCountsComponent);
    fixture.componentRef.setInput('playerCount', playerCount);
    fixture.componentRef.setInput('characters', RoleRegistry.toScriptCharacters(roles));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the character counts for the player count', () => {
    const el = render(8);
    const counts = [...el.querySelectorAll('dd')].map(d => d.textContent?.trim());
    expect(counts).toEqual(['5', '1', '1', '1']);
    expect(el.querySelector('dl')?.getAttribute('aria-label')).toBe('Character counts for 8 players');
  });

  it('lists setup modifiers in the role pool', () => {
    const el = render(8, ['baron', 'chef']);
    expect(el.textContent).toContain('Baron');
    expect(render(8, ['chef']).textContent).not.toContain('Can change');
  });
});
