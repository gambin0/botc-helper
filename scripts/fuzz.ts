/**
 * Fuzz runner for the deduction engine. See README.md ("Checking the deduction engine").
 *
 *   npm run fuzz -- run   --check diff --seed 3 --games 500 --profile vortox --out fuzz-runs/vortox-3
 *   npm run fuzz -- show  fuzz-runs/vortox-3/failures/diff-3-41.json
 *   npm run fuzz -- replay --check truth --seed 3 --index 41 --profile vortox
 *   npm run fuzz -- profiles
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RoleRegistry } from '../src/app/core/roles/role-registry';
import { describeEvent } from '../src/app/core/rules/events';
import { SolverInput, solve } from '../src/app/core/solver/solver';
import {
  DiffOutcome,
  TruthOutcome,
  differentialCheck,
  enginePossible,
  explainByKnownBug,
  minimize,
  sameDisagreement,
  truthCheck
} from '../src/app/core/solver/reference/checks';
import { GeneratorOptions, PROFILES, ProfileName, generateGame, generateTrueGame } from '../src/app/core/solver/reference/game-generator';
import { KNOWN_DISAGREEMENTS } from '../src/app/core/solver/reference/known-disagreements';
import { referenceSolve } from '../src/app/core/solver/reference/reference-solver';

type Check = 'diff' | 'truth';

interface FailureRecord {
  check: Check;
  seed: number;
  index: number;
  generator: GeneratorOptions;
  outcome: DiffOutcome | TruthOutcome;
  input: SolverInput;
  truth?: string[];
  minimized: SolverInput;
  minimizedOutcome: DiffOutcome | TruthOutcome;
  /** One line per minimized event, for reading. */
  minimizedSummary: string[];
}

const HELP = `Usage:
  npm run fuzz -- run [options]       Generate games, check them, write failures to --out
      --check diff|truth|both          Which check (default both)
      --seed N                         Seed (default 1)
      --from N                         First game index (default 0)
      --games N                        Number of games per check (default 500)
      --profile NAME                   Pool profile (default mixed; see "profiles")
      --players A-B                    Player count range, within 5-7 (default 5-7)
      --max-events N                   Maximum events per game (default 8)
      --max-failures N                 Stop after this many NEW failures (default 20)
      --keep-known                     Also write failures explained by a recorded bug (F-001, F-002)
      --out DIR                        Output directory (default fuzz-runs/<profile>-<seed>)
  npm run fuzz -- show FILE.json      Print a failure file in readable form, re-checking it
  npm run fuzz -- replay --check diff|truth --seed N --index I [--profile P] [--players A-B] [--max-events N]
                                      Regenerate one game and print it with both answers
  npm run fuzz -- profiles            List pool profiles`;

function parseArgs(argv: string[]): { command: string; flags: Map<string, string>; positional: string[] } {
  const [command = 'help', ...rest] = argv;
  const flags = new Map<string, string>();
  const positional: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('--')) flags.set(a.slice(2), 'true');
      else flags.set(a.slice(2), rest[++i]);
    } else positional.push(a);
  }
  return { command, flags, positional };
}

function int(flags: Map<string, string>, key: string, fallback: number): number {
  const v = flags.get(key);
  if (v === undefined) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`--${key} must be a number, got "${v}"`);
  return n;
}

function generatorOptions(flags: Map<string, string>): GeneratorOptions {
  const profile = (flags.get('profile') ?? 'mixed') as ProfileName;
  if (!(profile in PROFILES)) throw new Error(`Unknown profile "${profile}". Run: npm run fuzz -- profiles`);
  const [lo, hi] = (flags.get('players') ?? '5-7').split('-').map(x => Number.parseInt(x, 10));
  const minPlayers = Math.max(5, lo);
  const maxPlayers = Math.min(7, hi ?? lo);
  if (!(minPlayers <= maxPlayers)) throw new Error('--players must be a range within 5-7, e.g. 5-6');
  return { profile, minPlayers, maxPlayers, maxEvents: int(flags, 'max-events', 8) };
}

function summarize(input: SolverInput): string[] {
  const role = (id?: string | null) => (id ? (RoleRegistry.get(id)?.name ?? id) : '?');
  const lines = [
    `players: ${input.players.map(p => p.id).join(' ')}`,
    `pool: ${input.characters.map(c => c.id).join(', ')}`
  ];
  if (input.self) lines.push(`self: ${input.self.playerId} was told ${role(input.self.roleId)}${input.self.certain ? ' (certain)' : ' (might be Drunk etc.)'}`);
  if (input.options?.assumeGoodPlayersHonest === false) lines.push('honesty assumption: OFF');
  for (const e of input.events) lines.push(`night ${e.night}: ${describeEvent(e, id => id ?? '?', role)}`);
  return lines;
}

function checkOne(check: Check, seed: number, index: number, gen: GeneratorOptions, keepKnown: boolean):
  | { status: 'pass' | 'skip' | 'none' }
  | { status: 'known'; bug: string }
  | { status: 'fail'; record: FailureRecord } {
  if (check === 'diff') {
    const input = generateGame(seed, index, gen);
    const outcome = differentialCheck(input);
    if (outcome.status === 'skipped') return { status: 'skip' };
    if (outcome.status === 'agree') return { status: 'pass' };
    const bug = explainByKnownBug(input, v => differentialCheck(v).status !== 'disagree');
    if (bug && !keepKnown) return { status: 'known', bug };
    const minimized = minimize(input, c => sameDisagreement(outcome, differentialCheck(c)));
    const minimizedOutcome = differentialCheck(minimized);
    return {
      status: 'fail',
      record: { check, seed, index, generator: gen, outcome, input, minimized, minimizedOutcome, minimizedSummary: summarize(minimized) }
    };
  }
  const game = generateTrueGame(seed, index, gen);
  if (!game) return { status: 'none' };
  const outcome = truthCheck(game.input, game.truth);
  if (outcome.status === 'skipped') return { status: 'skip' };
  if (outcome.status === 'ok') return { status: 'pass' };
  if (outcome.status === 'engine-wrong') {
    const bug = explainByKnownBug(game.input, v => truthCheck(v, game.truth).status === 'ok');
    if (bug && !keepKnown) return { status: 'known', bug };
  }
  const minimized =
    outcome.status === 'engine-wrong'
      ? minimize(game.input, c => truthCheck(c, game.truth).status === 'engine-wrong')
      : game.input;
  const minimizedOutcome = truthCheck(minimized, game.truth);
  return {
    status: 'fail',
    record: {
      check, seed, index, generator: gen, outcome, input: game.input, truth: game.truth,
      minimized, minimizedOutcome, minimizedSummary: summarize(minimized)
    }
  };
}

function run(flags: Map<string, string>): void {
  const gen = generatorOptions(flags);
  const seed = int(flags, 'seed', 1);
  const from = int(flags, 'from', 0);
  const games = int(flags, 'games', 500);
  const maxFailures = int(flags, 'max-failures', 20);
  const checkFlag = flags.get('check') ?? 'both';
  const checks: Check[] = checkFlag === 'both' ? ['diff', 'truth'] : [checkFlag as Check];
  if (!checks.every(c => c === 'diff' || c === 'truth')) throw new Error('--check must be diff, truth or both');
  const out = flags.get('out') ?? join('fuzz-runs', `${gen.profile}-${seed}`);
  mkdirSync(join(out, 'failures'), { recursive: true });

  const started = Date.now();
  const summary: Record<string, unknown> = { seed, from, games, generator: gen, checks: {} };
  let failures = 0;
  for (const check of checks) {
    const counts = { pass: 0, skip: 0, none: 0, fail: 0, known: 0 };
    const knownBugs: Record<string, number> = {};
    let slowest = { ms: 0, index: -1 };
    for (let index = from; index < from + games && failures < maxFailures; index++) {
      if (KNOWN_DISAGREEMENTS.has(`${check}:${seed}:${index}`)) {
        counts.known++;
        continue;
      }
      const t = Date.now();
      let result: ReturnType<typeof checkOne>;
      try {
        result = checkOne(check, seed, index, gen, flags.has('keep-known'));
      } catch (e) {
        console.error(`${check} seed ${seed} index ${index}: crashed: ${(e as Error).message}`);
        counts.fail++;
        failures++;
        writeFileSync(join(out, 'failures', `${check}-${seed}-${index}.crash.txt`), String((e as Error).stack));
        continue;
      }
      const ms = Date.now() - t;
      if (ms > slowest.ms) slowest = { ms, index };
      if (result.status === 'known') {
        counts.known++;
        knownBugs[result.bug] = (knownBugs[result.bug] ?? 0) + 1;
        continue;
      }
      counts[result.status]++;
      if (result.status === 'fail') {
        failures++;
        const file = join(out, 'failures', `${check}-${seed}-${index}.json`);
        writeFileSync(file, JSON.stringify(result.record, null, 2));
        console.log(`FAIL ${check} seed ${seed} index ${index} → ${file}`);
      }
      if ((index - from + 1) % 100 === 0) console.log(`${check}: ${index - from + 1}/${games} ${JSON.stringify(counts)}`);
    }
    (summary['checks'] as Record<string, unknown>)[check] = { ...counts, knownBugs, slowest };
    console.log(`${check} done: ${JSON.stringify(counts)} known bugs ${JSON.stringify(knownBugs)} slowest ${slowest.ms} ms (index ${slowest.index})`);
  }
  summary['seconds'] = Math.round((Date.now() - started) / 100) / 10;
  summary['stoppedEarly'] = failures >= maxFailures;
  writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`summary → ${join(out, 'summary.json')}`);
}

function printGame(input: SolverInput, truth?: string[]): void {
  for (const line of summarize(input)) console.log(`  ${line}`);
  const engine = solve(input);
  const engineSets = enginePossible(engine);
  let ref: ReturnType<typeof referenceSolve> | null = null;
  try {
    ref = referenceSolve(input);
  } catch (e) {
    console.log(`  reference: ${(e as Error).message}`);
  }
  console.log(`  engine: ${engine.consistent ? 'consistent' : 'INCONSISTENT'}${engine.incomplete ? ' (search incomplete)' : ''}` +
    (engine.ignoredEvidence.length ? `; set aside: ${engine.ignoredEvidence.map(e => e.label).join(' | ')}` : ''));
  if (ref) console.log(`  reference: ${ref.consistent ? 'consistent' : 'INCONSISTENT'}`);
  const seats = [...input.players].sort((a, b) => a.seat - b.seat);
  seats.forEach((p, i) => {
    const e = [...(engineSets.get(p.id) ?? [])].sort();
    const r = ref ? [...(ref.possible.get(p.id) ?? [])].sort() : [];
    const tag = truth ? ` [true: ${truth[i]}]` : '';
    const engineOnly = e.filter(x => ref && !r.includes(x));
    const refOnly = r.filter(x => !e.includes(x));
    const diff = engineOnly.length || refOnly.length
      ? `   ← engine-only: [${engineOnly.join(', ')}] reference-only: [${refOnly.join(', ')}]`
      : '';
    console.log(`  ${p.id}${tag}: engine {${e.join(', ')}}${diff}`);
  });
}

function show(file: string): void {
  const record = JSON.parse(readFileSync(file, 'utf8')) as FailureRecord;
  console.log(`${record.check} seed ${record.seed} index ${record.index} (profile ${record.generator.profile})`);
  console.log(`original outcome: ${JSON.stringify(record.outcome)}`);
  console.log(`minimized (${record.minimized.events.length} of ${record.input.events.length} events):`);
  printGame(record.minimized, record.truth);
  const now = record.check === 'diff' ? differentialCheck(record.minimized) : truthCheck(record.minimized, record.truth!);
  console.log(`re-checked now: ${JSON.stringify(now)}`);
}

function replay(flags: Map<string, string>): void {
  const gen = generatorOptions(flags);
  const seed = int(flags, 'seed', 1);
  const index = int(flags, 'index', 0);
  const check = (flags.get('check') ?? 'diff') as Check;
  if (check === 'diff') {
    printGame(generateGame(seed, index, gen));
    console.log(`  outcome: ${JSON.stringify(differentialCheck(generateGame(seed, index, gen)))}`);
  } else {
    const game = generateTrueGame(seed, index, gen);
    if (!game) return console.log('No legal setup for this pool; nothing generated.');
    printGame(game.input, game.truth);
    console.log(`  outcome: ${JSON.stringify(truthCheck(game.input, game.truth))}`);
  }
}

function main(): void {
  const { command, flags, positional } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'run':
      return run(flags);
    case 'show':
      if (!positional[0]) throw new Error('show needs a failure file');
      return show(positional[0]);
    case 'replay':
      return replay(flags);
    case 'profiles':
      for (const [name, p] of Object.entries(PROFILES)) {
        console.log(`${name.padEnd(16)} forced: ${p.forced.join(', ') || '-'}; weighted: ${Object.keys(p.weights).join(', ') || '-'}`);
      }
      return;
    default:
      console.log(HELP);
  }
}

try {
  main();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
