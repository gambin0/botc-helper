# Reference-solver findings

Disagreements between the deduction engine (`src/app/core/solver/solver.ts`) and the brute-force reference (`reference-solver.ts`), plus open questions about the rules in `openspec/changes/add-reference-solver/design.md` Section 4.

Each engine bug has a matching `it.fails` test in `regressions.test.ts` with the same F-number. Generated games that hit a recorded finding are listed in `known-disagreements.ts` so the default `npm test` run stays green.

**Status values:** `open` (engine wrong, not fixed) · `fixed` · `reference-bug` (the reference was wrong and has been fixed) · `question` (rules unclear; needs a human).

---

## F-001 — Two Village Idiots: the engine always frees the first one · `open`

- **Found by:** hand-built case while writing the reference (2026-11-04), not by a fuzz run.
- **Test:** `regressions.test.ts` → `F-001`.
- **Minimized input:** 7 players. Pool: Village Idiot, Chef, Empath, Noble, Knight, Poisoner, Imp. Confirmed: p1 and p2 Village Idiot, p3 Empath, p4 Chef. Events:
  - night 1: p1 (as Village Idiot) sees p4 as evil;
  - night 1: p2 (as Village Idiot) sees p4 as evil;
  - night 2: p2 sees p4 as evil again;
  - night 2: p3 (as Empath) gets a 2.
- **Engine:** inconsistent. **Reference:** consistent. With the two p1/p2 events swapped in the log, the engine says consistent too.
- **Rule (design 4d):** with 2+ Village Idiots, one copy is drunk all game, and any copy may be that one. If p2 is the drunk copy, the remaining false info is p1 on night 1 and the Empath on night 2: one poisoning per night, which the Poisoner covers. The engine's final check (`leafOk`, the `drunkCopyFails` block) always frees the first Village Idiot in log order. Freeing p1 leaves p2 and the Empath both false on night 2, which is too many for one Poisoner.
- **Verdict:** the engine is wrong. A fix would try each Village Idiot as the drunk one, as the reference does.

---

## F-002 — Outsider modifiers depend on pool order · `open`

- **Found by:** `npm run fuzz -- run --profile villageidiot --seed 1`, diff index 228 (2026-11-04). It first showed up as a reference bug: the reference had the same mistake, now fixed (see design Decision 3).
- **Test:** `regressions.test.ts` → `F-002`.
- **Minimized input:** 7 players, no events. Pool: Village Idiot, Slayer, Godfather, Baron, Drunk, Lil' Monsta. The only legal setup is 3 Village Idiots, Slayer, Drunk, Baron and Godfather: no Demon seat because Lil' Monsta is in play, and 1 Outsider = 0 + 2 (Baron) − 1 (Godfather).
- **Engine:** no legal setup (inconsistent). With the Baron listed before the Godfather, consistent.
- **Rule (design Decision 3):** add one change per modifier, then clamp once at zero. The engine (`compositionTargets`) clamps after each modifier in pool order: 0 → Godfather {0, 1} (−1 clamped to 0) → Baron {2, 3}, which loses 1.
- **Verdict:** the engine is wrong. It probably also affects other pairs of a negative and a positive modifier when the base count is low (Vigormortis, Hermit, Godfather with Baron or Fang Gu).

---

## Performance

- 200 random games per profile, all 11 profiles (5–7 players, at most 10 seatable roles): typically 15 ms per game, slowest about 1 s (2026-11-04).
- The full 22-role Trouble Brewing pool exceeds the 2,000,000-seating limit at 6–7 players. The generator caps pools at 10 seatable roles for this reason.
