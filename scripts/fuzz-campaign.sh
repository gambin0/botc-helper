#!/usr/bin/env bash
# Runs the standard fuzz campaign: every profile on its own seed, plus long games.
# Failures explained by a recorded engine bug are only counted;
# anything new is written, minimized, to fuzz-runs/campaign/<job>/failures/.
#
#   bash scripts/fuzz-campaign.sh            # default: 1500 games per job
#   GAMES=5000 bash scripts/fuzz-campaign.sh # longer
#   STRICT=1 bash scripts/fuzz-campaign.sh   # exit with an error if anything new is found (CI)
set -euo pipefail
cd "$(dirname "$0")/.."
GAMES=${GAMES:-1500}
OUT=${OUT:-fuzz-runs/campaign}
mkdir -p "$OUT"

run() { # name seed profile [extra args]
  local name=$1 seed=$2 profile=$3; shift 3
  echo "=== $name (seed $seed, profile $profile, $GAMES games) $*"
  npx tsx scripts/fuzz.ts run --seed "$seed" --games "$GAMES" --profile "$profile" \
    --max-failures 25 --out "$OUT/$name" "$@" | grep -E "done|FAIL|crash"
}

run mixed            11 mixed
run tb               12 tb
run misregistration  13 misregistration
run corruption       14 corruption
run vortox           15 vortox
run lilmonsta        16 lilmonsta
run villageidiot     17 villageidiot
run fibbin           18 fibbin
run lycanthrope      19 lycanthrope
run executions       20 executions
run long             21 mixed --max-events 14
run setup            22 setup
run demonmoves       24 demonmoves
run fanggu           25 fanggu

echo "=== new failures:"
find "$OUT" -path '*/failures/*' -type f | sort || true

# STRICT=1 (used in CI): fail if anything new was found.
if [ "${STRICT:-0}" = "1" ] && [ -n "$(find "$OUT" -path '*/failures/*' -type f)" ]; then
  exit 1
fi
