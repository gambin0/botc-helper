import { describe, expect, it } from 'vitest';
import {
  forgetName,
  isDefaultName,
  moveToSeat,
  nameSuggestions,
  rememberName,
  seatNamesFrom,
  seatingOf
} from './roster';

describe('roster', () => {
  it('recognises the names the app gives new seats', () => {
    expect(isDefaultName('Player 3')).toBe(true);
    expect(isDefaultName('Player Three')).toBe(false);
    expect(isDefaultName('Ana')).toBe(false);
  });

  it('remembers names most recent first, without duplicates or default names', () => {
    let known = rememberName([], 'Ana');
    known = rememberName(known, 'Ben');
    known = rememberName(known, ' ana ');
    known = rememberName(known, 'Player 4');
    known = rememberName(known, '   ');
    expect(known).toEqual(['ana', 'Ben']);
    expect(rememberName(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
    expect(forgetName(known, 'ANA')).toEqual(['Ben']);
  });

  it('copies the last seating into a new game of any size', () => {
    const last = ['Ana', null, 'Cal'];
    expect(seatNamesFrom(last, 5)).toEqual(['Ana', 'Player 2', 'Cal', 'Player 4', 'Player 5']);
    expect(seatNamesFrom(last, 2)).toEqual(['Ana', 'Player 2']);
  });

  it('records the seating in seat order, with nulls for default names', () => {
    const players = [
      { name: 'Cal', seat: 3 },
      { name: 'Ana ', seat: 1 },
      { name: 'Player 2', seat: 2 }
    ];
    expect(seatingOf(players)).toEqual(['Ana', null, 'Cal']);
  });

  it('suggests remembered names that match, prefix matches first, skipping names already seated', () => {
    const known = ['Dave', 'Adam', 'Ada', 'Ben'];
    expect(nameSuggestions(known, 'ad', [])).toEqual(['Adam', 'Ada']);
    expect(nameSuggestions(known, 'da', [])).toEqual(['Dave', 'Adam', 'Ada']);
    expect(nameSuggestions(known, '', ['ben', 'Dave'])).toEqual(['Adam', 'Ada']);
  });

  it('moves a player to another seat and renumbers the circle', () => {
    const players = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, seat: i + 1 }));
    const seats = (ps: { id: string; seat: number }[]) => ps.map(p => `${p.seat}${p.id}`).join(' ');
    expect(seats(moveToSeat(players, 'a', 3))).toBe('1b 2c 3a 4d');
    expect(seats(moveToSeat(players, 'd', 1))).toBe('1d 2a 3b 4c');
    expect(seats(moveToSeat(players, 'b', 99))).toBe('1a 2c 3d 4b');
    expect(moveToSeat(players, 'nobody', 1)).toEqual(players);
    // Players who keep their seat are the same objects.
    expect(moveToSeat(players, 'c', 4)[0]).toBe(players[0]);
  });
});
