// Movement / turn split configuration module (now sourced from global CONFIG if present)
// Provides: turnSplits, readTurnSplitsFromUI, validateTurnSplits, pickMovement, movementCounts
import { CONFIG } from '../config.js';

export const turnSplits = JSON.parse(JSON.stringify(CONFIG.turnSplits)); // deep copy so UI edits don't mutate CONFIG directly

export const movementCounts = { left: 0, thru: 0, right: 0 };

export function readTurnSplitsFromUI() {
  const get = id => parseInt(document.getElementById(id)?.value) || 0;
  turnSplits.north.left = get('north-left');
  turnSplits.north.thru = get('north-thru');
  turnSplits.north.right = get('north-right');
  turnSplits.south.left = get('south-left');
  turnSplits.south.thru = get('south-thru');
  turnSplits.south.right = get('south-right');
  turnSplits.east.left = get('east-left');
  turnSplits.east.thru = get('east-thru');
  turnSplits.east.right = get('east-right');
  turnSplits.west.left = get('west-left');
  turnSplits.west.thru = get('west-thru');
  turnSplits.west.right = get('west-right');
}

export function validateTurnSplits() {
  readTurnSplitsFromUI();
  const errorEl = document.getElementById('turn-splits-error');
  const rows = Object.entries(turnSplits);
  for (const [approach, obj] of rows) {
    const sum = obj.left + obj.thru + obj.right;
    if (sum !== 100) {
      if (errorEl) errorEl.textContent = `Turn splits for ${approach} must total 100% (now ${sum}%)`;
      const applyBtn = document.getElementById('apply-config-btn');
      if (applyBtn) applyBtn.disabled = true;
      return false;
    }
  }
  if (errorEl) errorEl.textContent = '';
  const applyBtn = document.getElementById('apply-config-btn');
  if (applyBtn) applyBtn.disabled = false;
  return true;
}

export function pickMovement(approachLetter) {
  const map = { N:'north', S:'south', E:'east', W:'west' };
  const splits = turnSplits[map[approachLetter]];
  if (!splits) return 'thru';
  const r = Math.random() * 100;
  if (r < splits.left) return 'left';
  if (r < splits.left + splits.thru) return 'thru';
  return 'right';
}
