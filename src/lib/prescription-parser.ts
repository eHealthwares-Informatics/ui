// @ts-nocheck
/* eslint-disable */
'use strict';

/**
 * rxParser v2: a conservative parser for free-text prescription items
 * ("Augmentin 875/125 mg take 1 tablet by mouth twice daily").
 *
 * Design rules
 *  1. FAIL CLOSED. Anything not understood is reported (unparsed / warnings)
 *     and the result is marked `needs_review`. A null is never silently
 *     "fine"; `status: 'ok'` means every character was accounted for and no
 *     ambiguity was found.
 *  2. SPANS, NOT BOOLEANS. Extractors claim character ranges of the
 *     normalized text. A claimed range cannot be claimed twice, so overlaps
 *     are resolved by extraction order and never by object-key order.
 *  3. LONGEST MATCH WINS inside each vocabulary ("twice daily" beats "daily").
 *  4. STRUCTURED OUTPUT. Frequency is {frequency, period, periodUnit}
 *     (FHIR Timing.repeat shape), strengths are tied to ingredients, and
 *     regimens are arrays of steps (tapers, loading doses, AM/PM splits).
 *  5. NO INFERENCE ACROSS SAFETY BOUNDARIES. We never guess a dose, never
 *     collapse a range, never read a fraction as its denominator.
 *
 * Spans refer to `result.normalized` (lower-cased, de-dotted, whitespace
 * collapsed), not to `result.raw`.
 *
 * KNOWN LIMITS (all of these fail closed: they surface as `unparsed` or a
 * warning, they are never guessed):
 *  - clock times ("at 8am and 8pm"), "morning and evening" lists, free-text
 *    cautions, "repeat if…", and anything conditional
 *  - a bare mass next to a drug name ("Metformin 500 mg bd") is read as the
 *    product strength; the dose is reported as not stated rather than guessed
 *  - weight/BSA-based doses are parsed but never converted to absolute doses
 *  - routes and units are not bound to SNOMED/UCUM beyond the UCUM units we are
 *    certain of; do that in your terminology layer
 *  - drug names are only as good as the catalogue you pass to createParser()
 *
 * This is a decision-support component, not a substitute for pharmacist
 * verification. Route `needs_review` and `unparseable` to a human.
 */

const VERSION = '2.0.0';
const MAX_INPUT_LENGTH = 1000;

/* ───────────────────────── regex building blocks ───────────────────────── */

const N = String.raw`\d+(?:\.\d+)?`;
const FRAC = String.raw`(?:\d+ \d+\/\d+|\d+\/\d+)`; // "1 1/2" | "1/2"
const Q = `(?:${FRAC}|${N})`;
// quantity or range, with named groups <g>Lo / <g>Hi
const qr = (g) => String.raw`(?<${g}Lo>${Q})(?: ?(?:-|to) ?(?<${g}Hi>${Q}))?`;
const NB = String.raw`(?<![\d./])`; // not glued to a preceding number
const BW = String.raw`(?<![a-z0-9])`; // word start
const EW = String.raw`(?![a-z0-9])`; // word end
const MU = 'mcg|mmol|meq|mg|iu|units?|ml|cc|gm|g|l'; // measure units (longest first)

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lexicon = (rows) => {
  const map = new Map();
  for (const [keys, val] of rows) for (const k of keys) map.set(k, val);
  return map;
};
const lexRegex = (map) =>
  new RegExp(
    String.raw`${BW}(${[...map.keys()]
      .sort((a, b) => b.length - a.length)
      .map(esc)
      .join('|')})${EW}`,
    'g'
  );

/* ───────────────────────────── vocabularies ───────────────────────────── */

const UNSAFE = (token, message) => ({ code: 'UNSAFE_ABBREVIATION', token, message });
const F = (frequency, period, periodUnit, extra = {}) => ({
  frequency,
  period,
  periodUnit,
  ...extra,
});

const FREQ_LEX = lexicon([
  [['once daily', 'once a day', 'once per day', 'every day', 'each day', 'daily'], F(1, 1, 'd')],
  [
    ['qd'],
    F(1, 1, 'd', {
      warn: UNSAFE(
        'qd',
        '"qd" is on the Joint Commission Do Not Use list (mistaken for "qid"); write "daily".'
      ),
    }),
  ],
  [['twice daily', 'twice a day', 'twice per day', 'bid', 'bd'], F(2, 1, 'd')],
  [['thrice daily', 'thrice a day', 'tid', 'tds'], F(3, 1, 'd')],
  [['qid', 'qds'], F(4, 1, 'd')],
  [['twice weekly', 'twice a week'], F(2, 1, 'wk')],
  [['once weekly', 'once a week', 'once per week', 'weekly', 'every week', 'qw'], F(1, 1, 'wk')],
  [['once monthly', 'once a month', 'monthly', 'every month'], F(1, 1, 'mo')],
  [['every other day', 'alternate days', 'on alternate days', 'every second day'], F(1, 2, 'd')],
  [
    ['qod'],
    F(1, 2, 'd', {
      warn: UNSAFE(
        'qod',
        '"qod" is on the Joint Commission Do Not Use list (mistaken for qd/qid); write "every other day".'
      ),
    }),
  ],
]);

const W = (when, extra = {}) => ({ when, ...extra });
const WHEN_LEX = lexicon([
  [['with food', 'with meals', 'with a meal'], W('with food')],
  [['after meals', 'after food', 'after eating', 'pc'], W('after meals')],
  [['before meals', 'before food', 'before eating', 'ac'], W('before meals')],
  [['on an empty stomach', 'empty stomach'], W('empty stomach')],
  [['in the morning', 'every morning', 'each morning', 'mane'], W('morning', { tod: true })],
  [['at noon', 'at midday', 'midday'], W('noon', { tod: true })],
  [['in the afternoon', 'every afternoon'], W('afternoon', { tod: true })],
  [['in the evening', 'every evening', 'each evening'], W('evening', { tod: true })],
  [['at night', 'every night', 'each night', 'nightly', 'nocte'], W('night', { tod: true })],
  [['at bedtime', 'before bed', 'bedtime', 'qhs'], W('bedtime', { tod: true })],
  [
    ['hs'],
    W('bedtime', {
      tod: true,
      warn: UNSAFE(
        'hs',
        '"hs" can mean "at bedtime" or "half-strength" (ISMP error-prone abbreviation); write "at bedtime".'
      ),
    }),
  ],
]);

const STAT_LEX = lexicon([
  [['stat', 'immediately', 'at once'], { stat: true }],
  [
    ['once only', 'single dose', 'as a single dose', 'one dose only', 'as one dose'],
    { once: true },
  ],
]);

const ROUTES = {
  oral: ['po', 'oral', 'orally', 'by mouth', 'per os', 'via mouth'],
  sublingual: ['sl', 'sublingual', 'sublingually', 'under the tongue'],
  buccal: ['buccal', 'buccally'],
  topical: ['top', 'topical', 'topically'],
  inhalation: ['inh', 'inhaled', 'inhalation', 'by inhalation', 'nebulised', 'nebulized'],
  intramuscular: ['im', 'intramuscular', 'intramuscularly'],
  intravenous: ['iv', 'intravenous', 'intravenously'],
  subcutaneous: ['sc', 'subcut', 'subcutaneous', 'subcutaneously'],
  rectal: ['pr', 'per rectum', 'rectal', 'rectally'],
  vaginal: ['pv', 'per vaginum', 'vaginal', 'vaginally'],
  nasal: ['nasal', 'nasally', 'intranasal', 'intranasally'],
  ophthalmic: ['ophth', 'ophthalmic'],
  otic: ['otic', 'aural'],
  transdermal: ['transdermal', 'transdermally'],
};
const ROUTE_LEX = lexicon([
  ...Object.entries(ROUTES).map(([canon, keys]) => [keys, { value: canon }]),
  [
    ['sq'],
    {
      value: 'subcutaneous',
      warn: UNSAFE(
        'sq',
        '"SQ" is easily misread as "SL" or "5 every" (ISMP); write "subcutaneous".'
      ),
    },
  ],
]);

const SITE_LEX = lexicon([
  [['right eye', 'right eyes'], 'right eye'],
  [['left eye'], 'left eye'],
  [['both eyes', 'both eye', 'each eye'], 'both eyes'],
  [['right ear'], 'right ear'],
  [['left ear'], 'left ear'],
  [['both ears', 'each ear'], 'both ears'],
  [['affected area', 'affected areas'], 'affected area'],
]);

const COUNT_UNITS = {
  tablet: ['tablet', 'tablets', 'tab', 'tabs'],
  capsule: ['capsule', 'capsules', 'cap', 'caps'],
  pill: ['pill', 'pills'],
  sachet: ['sachet', 'sachets'],
  suppository: ['suppository', 'suppositories', 'supp', 'supps'],
  pessary: ['pessary', 'pessaries'],
  ampoule: ['ampoule', 'ampoules', 'ampule', 'ampules', 'amp', 'amps'],
  vial: ['vial', 'vials'],
  patch: ['patch', 'patches'],
  drop: ['drop', 'drops', 'gtt', 'gtts'],
  puff: ['puff', 'puffs'],
  spray: ['spray', 'sprays'],
  application: ['application', 'applications'],
  lozenge: ['lozenge', 'lozenges'],
  scoop: ['scoop', 'scoops'],
  dose: ['dose', 'doses'],
  nebule: ['nebule', 'nebules'],
  enema: ['enema', 'enemas'],
  teaspoon: ['teaspoon', 'teaspoons', 'teaspoonful', 'teaspoonfuls', 'tsp', 'tsps'],
  tablespoon: ['tablespoon', 'tablespoons', 'tablespoonful', 'tablespoonfuls', 'tbsp', 'tbsps'],
};
const HOUSEHOLD = new Set(['teaspoon', 'tablespoon']);
const COUNT_ALIAS = new Map();
for (const [canon, aliases] of Object.entries(COUNT_UNITS))
  for (const a of aliases) COUNT_ALIAS.set(a, canon);

const FORMS = {
  tablet: ['tablet', 'tablets', 'tab', 'tabs'],
  capsule: ['capsule', 'capsules', 'cap', 'caps'],
  syrup: ['syrup', 'syp'],
  suspension: ['suspension', 'oral suspension', 'susp'],
  solution: ['solution', 'oral solution'],
  cream: ['cream'],
  ointment: ['ointment', 'oint'],
  gel: ['gel'],
  lotion: ['lotion'],
  injection: ['injection', 'injections', 'inj'],
  inhaler: ['inhaler', 'inhalers'],
  suppository: ['suppository', 'suppositories'],
  pessary: ['pessary', 'pessaries'],
  patch: ['patch', 'patches'],
  sachet: ['sachet', 'sachets'],
  powder: ['powder'],
  spray: ['spray', 'nasal spray'],
  lozenge: ['lozenge', 'lozenges'],
  elixir: ['elixir'],
  infusion: ['infusion'],
  drops: ['drops', 'eye drops', 'ear drops', 'nasal drops'],
};
const FORM_ALIAS = new Map();
for (const [canon, aliases] of Object.entries(FORMS))
  for (const a of aliases) FORM_ALIAS.set(a, canon);

const UNIT_INFO = {
  mg: { unit: 'mg', ucum: 'mg', kind: 'mass' },
  mcg: { unit: 'mcg', ucum: 'ug', kind: 'mass' },
  g: { unit: 'g', ucum: 'g', kind: 'mass' },
  gm: { unit: 'g', ucum: 'g', kind: 'mass' },
  iu: {
    unit: 'iu',
    ucum: '[iU]',
    kind: 'potency',
    warn: UNSAFE(
      'iu',
      '"IU" can be misread as "IV" or "10" (Joint Commission Do Not Use list); write "international units".'
    ),
  },
  unit: { unit: 'unit', kind: 'potency' }, // UCUM has no single unambiguous code; bind in your terminology layer
  units: { unit: 'unit', kind: 'potency' },
  meq: { unit: 'meq', ucum: 'meq', kind: 'amount' },
  mmol: { unit: 'mmol', ucum: 'mmol', kind: 'amount' },
  ml: { unit: 'ml', ucum: 'mL', kind: 'volume' },
  cc: {
    unit: 'ml',
    ucum: 'mL',
    kind: 'volume',
    warn: UNSAFE('cc', '"cc" can be misread as "U" (ISMP); write "mL".'),
  },
  l: { unit: 'l', ucum: 'L', kind: 'volume' },
};

const STOP = new Set([
  'a',
  'an',
  'the',
  'of',
  'to',
  'be',
  'by',
  'with',
  'in',
  'on',
  'at',
  'each',
  'per',
  'and',
  'or',
  'is',
  'are',
  'it',
  'as',
  'your',
  'you',
  'for',
]);

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/* ─────────────────────────── compiled patterns ─────────────────────────── */

const R = {
  maxdose: new RegExp(
    String.raw`\(?${BW}(?:max|maximum)\.? ?${qr('m')} ?(?<u>doses?|tablets?|tabs?|capsules?|caps?|mg|mcg|g|ml)(?: ?(?:\/|per|in|a|every))? ?(?:the )?(?<p>day|24 ?h(?:ours?|rs?)?)\)?`,
    'g'
  ),
  ratio: new RegExp(String.raw`${NB}(?<a>1) ?(?::|in) ?(?<b>\d{3,})${EW}`, 'g'),
  weight: new RegExp(
    String.raw`${NB}${qr('v')} ?(?<u>mcg|mg|g|units?|iu|ml) ?(?: ?\/ ?| per )(?<per>kg|m2)(?: ?\/ ?(?<t>day|d|dose|hr|h|min))?${EW}`,
    'g'
  ),
  rate: new RegExp(
    String.raw`${NB}${qr('v')} ?(?<u>ml|l|mg|mcg|g|units?|iu) ?(?: ?\/ ?| per )(?<t>hours?|hrs?|h|minutes?|min|day|d)${EW}`,
    'g'
  ),
  conc: new RegExp(
    String.raw`${NB}(?<v>${N}) ?(?<u>${MU}) ?\/ ?(?:(?<d>${N}) ?)?(?<du>ml|l)${EW}`,
    'g'
  ),
  combo: new RegExp(
    String.raw`${NB}(?<chain>(?:${N} ?(?:(?:${MU}) ?)?\/ ?)+${N}) ?(?<u>${MU})${EW}`,
    'g'
  ),
  pct: new RegExp(String.raw`${NB}(?<v>${N}) ?%(?: ?(?<t>w\/v|w\/w|v\/v))?`, 'g'),
  single: new RegExp(String.raw`${NB}${qr('v')} ?(?<u>${MU})${EW}`, 'g'),
  each: /^ ?(?:each|per (?:tablet|tab|capsule|cap|dose|sachet)s?|\/ ?(?:tablet|tab|capsule|cap))(?![a-z])/,
  then: new RegExp(String.raw`${BW}(and then|then|followed by|thereafter)${EW}`, 'g'),
  count: new RegExp(
    String.raw`${NB}${qr('v')} ?(?<u>${[...COUNT_ALIAS.keys()].sort((a, b) => b.length - a.length).join('|')})(?:\(s\))?${EW}`,
    'g'
  ),
  form: new RegExp(
    String.raw`${BW}(?:(?<mod>dispersible|chewable|effervescent|soluble|(?:enteric|film)[- ]coated|(?:extended|sustained|modified|prolonged)[- ]release) )?(?<f>${[
      ...FORM_ALIAS.keys(),
    ]
      .sort((a, b) => b.length - a.length)
      .map(esc)
      .join('|')})${EW}`,
    'g'
  ),
  stat: lexRegex(STAT_LEX),
  offset: new RegExp(
    String.raw`${BW}after ${qr('o')} ?(?<u>hours?|hrs?|h|minutes?|mins?|days?|weeks?|wks?|months?)${EW}`,
    'g'
  ),
  whenParam: new RegExp(
    String.raw`${BW}(?<n>\d+) ?(?<u>min|mins|minutes|hour|hours|hr|hrs) (?<d>before|after) (?<m>meals?|food|eating|breakfast|lunch|dinner)${EW}`,
    'g'
  ),
  when: lexRegex(WHEN_LEX),
  freqQ: new RegExp(
    String.raw`${BW}q ?${qr('p')} ?(?<u>hours?|hrs?|h|days?|d|weeks?|wks?|w)${EW}`,
    'g'
  ),
  freqEvery: new RegExp(
    String.raw`${BW}every ${qr('p')} ?(?<u>hours?|hrs?|h|days?|d|weeks?|wks?|w|months?)${EW}`,
    'g'
  ),
  freqTimes: new RegExp(
    String.raw`${BW}${qr('n')} ?(?:x|times)(?: ?(?:a|per|\/))? ?(?<u>day|daily|week|weekly|wk|d|w)${EW}`,
    'g'
  ),
  freq: lexRegex(FREQ_LEX),
  route: lexRegex(ROUTE_LEX),
  durA: new RegExp(
    String.raw`${BW}(?:for(?: the (?:next|first|last))?|x|over(?: the (?:next|first))?) ?${qr('v')} ?(?<u>days?|d|weeks?|wks?|w|months?|mos?|mo|years?|yrs?|yr|y|hours?|hrs?|h)${EW}`,
    'g'
  ),
  durCount: new RegExp(
    String.raw`${BW}(?:x|for) ?${qr('v')} ?(?<u>doses?|tablets?|tabs?|capsules?|caps?)${EW}`,
    'g'
  ),
  durUK: new RegExp(
    String.raw`(?:${BW}(?:x|for) ?)?(?<![\d./])(?<v>\d{1,3})\/(?<d>7|52|12)(?![\d./])`,
    'g'
  ),
  durUntil: new RegExp(
    String.raw`${BW}until (?<w>finished|completed|review|reviewed|further notice)${EW}`,
    'g'
  ),
  durIndef: new RegExp(
    String.raw`${BW}(?<w>ongoing|long[- ]term|indefinitely|continuously|lifelong)${EW}`,
    'g'
  ),
  durBare: new RegExp(
    String.raw`(?<=^| )(?<!in )${qr('v')} ?(?<u>days?|weeks?|wks?|months?|mos?)${EW}`,
    'g'
  ),
  verb: new RegExp(
    String.raw`${BW}(?:to be )?(?:takes?|taken|taking|apply|applied|applying|use|used|using|inject|injected|give|given|administer|administered|instill|instil|instilled|insert|inserted|inhale|chew|dissolve|swallow|drink|put|rub|massage|infuse|infused|sprinkle|gargle|rinse|dab)${EW}`,
    'g'
  ),
  prn: new RegExp(
    String.raw`${BW}(?<w>prn|as needed|as required|when needed|when required|if needed|if required|when necessary|if necessary|sos)${EW}`,
    'g'
  ),
  site: lexRegex(SITE_LEX),
  lateral: new RegExp(String.raw`${BW}(?<t>od|os|ou)${EW}`, 'g'),
};
const NEGATION =
  /(?<![a-z0-9])(?:not|no|never|don't|dont|avoid|stop|discontinue|hold|suspend|except|unless|without|exceed|exceeding)(?![a-z0-9])/;
// words that can never be (part of) a drug name; stops "Apply thinly …" / "Do not take …" becoming drug names
const NON_NAME =
  /^(?:\w+ly|please|only|just|also|do|does|did|not|no|never|must|should|may|can|every|each|all|any|some|this|that|these|those|it|them|medicine|medication|medicines|drug|drugs|dose|doses|first|second|next|then|if|when|until|unless|except|without|before|after|during|once|twice)$/;
const EYE_CUE = /(?<![a-z])(?:eyes?|ophth(?:almic)?|ocular|ears?|otic)(?![a-z])/;
const BARE_U = /(?<![\d./])\d+(?:\.\d+)? ?u(?![a-z0-9])/g;

/* ─────────────────────────────── utilities ─────────────────────────────── */

const round = (x) => Math.round(x * 1e4) / 1e4;
function num(s) {
  if (s == null) return null;
  let m;
  if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s))) return +m[3] === 0 ? NaN : round(+m[1] + +m[2] / +m[3]);
  if ((m = /^(\d+)\/(\d+)$/.exec(s))) return +m[2] === 0 ? NaN : round(+m[1] / +m[2]);
  return parseFloat(s);
}
function rng(g, n) {
  const lo = num(g[`${n}Lo`]);
  const hi = g[`${n}Hi`] == null ? null : num(g[`${n}Hi`]);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
  if (hi != null && hi < lo) return null;
  return { lo, hi };
}
const range = (r) => (r.hi == null ? { value: r.lo } : { low: r.lo, high: r.hi });
const qty = (r, info) => {
  const q = range(r);
  q.unit = info.unit;
  if (info.ucum) q.ucum = info.ucum;
  return q;
};
const periodUnit = (u) =>
  /^h/.test(u)
    ? 'h'
    : /^mi/.test(u)
      ? 'min'
      : /^d/.test(u)
        ? 'd'
        : /^w/.test(u)
          ? 'wk'
          : /^mo/.test(u)
            ? 'mo'
            : /^y/.test(u)
              ? 'a'
              : u;
const byStart = (a, b) => a.span.start - b.span.start;

class Mask {
  constructor(n) {
    this.m = new Uint8Array(n);
  }
  free(s, e) {
    for (let i = s; i < e; i++) if (this.m[i]) return false;
    return true;
  }
  claim(s, e) {
    this.m.fill(1, s, e);
  }
}

class Ctx {
  constructor(text, opts) {
    this.text = text;
    this.opts = opts || {};
    this.mask = new Mask(text.length);
    this.items = [];
    this.warnings = [];
    this._seen = new Set();
  }
  warn(code, message, o = {}) {
    const sev = this.opts.severity || {};
    const severity = sev[`${code}:${o.token ?? ''}`] ?? sev[code] ?? o.severity ?? 'warn';
    const key = `${code}|${o.token ?? ''}|${message}`;
    if (this._seen.has(key)) return;
    this._seen.add(key);
    const w = { code, severity, message };
    if (o.token) w.token = o.token;
    if (o.span) w.span = o.span;
    this.warnings.push(w);
  }
  /** Run `re` over the text; `build(match)` returns an item (or null to skip). */
  scan(re, build) {
    for (const m of this.text.matchAll(re)) {
      const start = m.index;
      let end = start + m[0].length;
      if (!this.mask.free(start, end)) continue;
      const it = build(m, start, end);
      if (!it) continue;
      if (it.end != null) {
        if (it.end > end && this.mask.free(end, it.end)) end = it.end;
        delete it.end;
      }
      it.span = { start, end };
      if (it.warn) {
        this.warn(it.warn.code, it.warn.message, { token: it.warn.token, span: it.span });
        delete it.warn;
      }
      this.mask.claim(start, end);
      this.items.push(it);
    }
  }
  masked() {
    let s = '';
    for (let i = 0; i < this.text.length; i++) s += this.mask.m[i] ? '\u0000' : this.text[i];
    return s;
  }
  freeRuns(from, to) {
    const runs = [];
    let s = -1;
    for (let i = from; i < to; i++) {
      if (!this.mask.m[i]) {
        if (s < 0) s = i;
      } else if (s >= 0) {
        runs.push([s, i]);
        s = -1;
      }
    }
    if (s >= 0) runs.push([s, to]);
    return runs;
  }
}

/* ───────────────────────────── normalization ───────────────────────────── */

/**
 * Normalizes text without changing meaning: unicode, case, dotted
 * abbreviations (b.i.d. → bid), thousands separators, number words, vulgar
 * fractions, leading dots. Returns the text and any safety notes raised
 * while doing so (".5 mg", "5.0 mg", "0,5 mg", "µg").
 */
function normalize(raw) {
  const notes = [];
  let t = String(raw);

  if (/[\u00b5\u03bc]\s?g/i.test(t)) {
    notes.push({
      code: 'UNSAFE_ABBREVIATION',
      token: 'µg',
      message: '"µg" is easily misread as "mg" (ISMP); write "mcg".',
    });
  }
  if (/\bug\b/i.test(t)) {
    notes.push({
      code: 'UNSAFE_ABBREVIATION',
      token: 'ug',
      message: '"ug" is easily misread as "mg"; write "mcg".',
    });
  }

  t = t
    .replace(/(\d)\s*([½¼¾⅓⅔])/g, '$1 $2')
    .replace(/[½¼¾⅓⅔]/g, (c) => ({ '½': '1/2', '¼': '1/4', '¾': '3/4', '⅓': '1/3', '⅔': '2/3' })[c])
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\u2044/g, '/')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u03bc\u00b5]g\b/g, 'mcg')
    .replace(/\bug\b/g, 'mcg');

  // b.i.d. → bid, p.o. → po, t.d.s. → tds
  t = t.replace(/(?<![a-z])(?:[a-z]\.){2,4}/g, (m) => m.replace(/\./g, ''));

  // number words → digits ("one tablet", "half a tablet", "a tablet")
  t = t.replace(/\bone and (?:a )?half\b/g, '1.5').replace(/\bhalf (?:an? )?(?=[a-z])/g, '0.5 ');
  t = t.replace(
    /\b(?:a|an) (?=(?:tablet|tab|capsule|cap|sachet|suppository|pessary|ampoule|vial|patch|drop|puff|spray|lozenge|scoop|teaspoon|tablespoon|tsp|tbsp)s?\b)/g,
    '1 '
  );
  t = t.replace(new RegExp(`\\b(${Object.keys(NUMBER_WORDS).join('|')})\\b`, 'g'), (w) =>
    String(NUMBER_WORDS[w])
  );

  // thousands separators: 50,000 → 50000
  for (let prev = ''; prev !== t; ) {
    prev = t;
    t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  }
  if (/\d,\d{1,2}(?!\d)/.test(t)) {
    notes.push({
      code: 'AMBIGUOUS_DECIMAL_COMMA',
      message: 'A number like "0,5" could be a decimal comma or a list; not interpreting it.',
    });
  }

  // ".5 mg" → "0.5 mg" (flagged: the original is a classic 10× error)
  t = t.replace(/(^|[^\d.])\.(\d)/g, (_, pre, d) => {
    notes.push({
      code: 'LEADING_ZERO_MISSING',
      message:
        'A dose was written without a leading zero (".5"); interpreted as 0.5. Verify with the prescriber.',
    });
    return `${pre}0.${d}`;
  });
  if (/(?<![\d.])\d+\.0+(?!\d)/.test(t)) {
    notes.push({
      code: 'TRAILING_ZERO',
      message:
        'A dose was written with a trailing zero ("5.0"); it can be misread as 50 (Joint Commission Do Not Use list).',
    });
  }

  t = t.replace(/\s+/g, ' ').trim();
  return { text: t, notes };
}

/* ───────────────────────────── extraction ───────────────────────────── */

function extract(ctx) {
  const { text } = ctx;
  const g = (m) => m.groups;

  // 1. forms of quantity that must be claimed before bare numbers
  ctx.scan(R.maxdose, (m) => {
    const r = rng(g(m), 'm');
    if (!r) return null;
    const u = g(m).u.toLowerCase();
    const unit = COUNT_ALIAS.get(u) || u;
    return { kind: 'maxdose', maxDose: { ...range({ lo: r.lo, hi: null }), unit, per: 'd' } };
  });

  ctx.scan(R.ratio, (m) => ({
    kind: 'ratio',
    role: 'strength',
    strength: { ratio: [1, +g(m).b] },
  }));

  ctx.scan(R.weight, (m) => {
    const r = rng(g(m), 'v');
    if (!r) return null;
    const info = UNIT_INFO[g(m).u];
    const it = { kind: 'weight', qty: qty(r, info), per: g(m).per };
    if (g(m).t)
      it.perTime =
        periodUnit(g(m).t) === 'd' ? 'd' : g(m).t === 'dose' ? 'dose' : periodUnit(g(m).t);
    if (info.warn) it.warn = info.warn;
    return it;
  });

  ctx.scan(R.rate, (m) => {
    const r = rng(g(m), 'v');
    if (!r) return null;
    const info = UNIT_INFO[g(m).u];
    const it = { kind: 'rate', rate: { ...qty(r, info), per: periodUnit(g(m).t) } };
    if (info.warn) it.warn = info.warn;
    return it;
  });

  // 2. strengths / measures
  const eachSuffix = (end) => {
    const e = R.each.exec(text.slice(end));
    return e ? { each: true, end: end + e[0].length } : {};
  };
  ctx.scan(R.conc, (m, s, e) => {
    const v = num(g(m).v);
    const info = UNIT_INFO[g(m).u];
    const den = UNIT_INFO[g(m).du];
    const strength = {
      value: v,
      unit: info.unit,
      ...(info.ucum ? { ucum: info.ucum } : {}),
      per: { value: g(m).d ? num(g(m).d) : 1, unit: den.unit },
    };
    return {
      kind: 'measure',
      type: 'concentration',
      role: 'strength',
      strength,
      ...(info.warn ? { warn: info.warn } : {}),
      ...eachSuffix(e),
    };
  });
  ctx.scan(R.combo, (m, s, e) => {
    const lastInfo = UNIT_INFO[g(m).u];
    const parts = [...g(m).chain.matchAll(new RegExp(`(${N})(?: ?(${MU}))?`, 'g'))].map((p) => ({
      v: num(p[1]),
      u: p[2],
    }));
    if (parts.some((p) => Number.isNaN(p.v))) return null;
    if (lastInfo.kind === 'volume') {
      // "250/5 ml": a concentration whose numerator unit was omitted
      if (parts.length === 2 && !parts[0].u) {
        ctx.warn(
          'UNIT_MISSING',
          `"${m[0]}" looks like a concentration but the numerator unit is missing.`,
          { span: { start: s, end: e } }
        );
        return {
          kind: 'measure',
          type: 'concentration',
          role: 'strength',
          strength: {
            value: parts[0].v,
            unit: null,
            per: { value: parts[1].v, unit: lastInfo.unit },
          },
          ...eachSuffix(e),
        };
      }
      return null;
    }
    const components = parts.map((p) => {
      const info = UNIT_INFO[p.u || g(m).u];
      return { value: p.v, unit: info.unit, ...(info.ucum ? { ucum: info.ucum } : {}) };
    });
    return {
      kind: 'measure',
      type: 'combination',
      role: 'strength',
      components,
      ...(lastInfo.warn ? { warn: lastInfo.warn } : {}),
      ...eachSuffix(e),
    };
  });
  ctx.scan(R.pct, (m) => {
    const v = num(g(m).v);
    return {
      kind: 'measure',
      type: 'percentage',
      role: 'strength',
      strength: { value: v, unit: '%', ucum: '%', ...(g(m).t ? { basis: g(m).t } : {}) },
    };
  });
  ctx.scan(R.single, (m, s, e) => {
    const r = rng(g(m), 'v');
    if (!r) return null;
    const info = UNIT_INFO[g(m).u];
    return {
      kind: 'measure',
      type: 'single',
      qty: qty(r, info),
      unitKind: info.kind,
      ...(info.warn ? { warn: info.warn } : {}),
      ...eachSuffix(e),
    };
  });

  // 3. sequence markers, counted doses, dosage forms
  ctx.scan(R.then, () => ({ kind: 'then' }));
  ctx.scan(R.durCount, (m) => {
    const r = rng(g(m), 'v');
    return r && r.hi == null
      ? { kind: 'duration', duration: { count: r.lo, unit: COUNT_ALIAS.get(g(m).u) } }
      : null;
  });
  ctx.scan(R.count, (m) => {
    const r = rng(g(m), 'v');
    if (!r) return null;
    const unit = COUNT_ALIAS.get(g(m).u);
    if (HOUSEHOLD.has(unit))
      ctx.warn('HOUSEHOLD_MEASURE', 'Household spoons are imprecise; prefer mL.', {
        severity: 'info',
      });
    return { kind: 'count', qty: range(r), unit };
  });
  ctx.scan(R.form, (m) => ({
    kind: 'form',
    value: `${g(m).mod ? `${g(m).mod} ` : ''}${FORM_ALIAS.get(g(m).f)}`,
  }));

  // 4. timing
  ctx.scan(R.stat, (m) => ({ kind: 'stat', ...STAT_LEX.get(m[1]) }));
  ctx.scan(R.offset, (m) => {
    const r = rng(g(m), 'o');
    return r && r.hi == null
      ? { kind: 'offset', offset: { value: r.lo, unit: periodUnit(g(m).u) } }
      : null;
  });
  ctx.scan(R.whenParam, (m) => ({
    kind: 'when',
    when: `${g(m).n} ${/^h/.test(g(m).u) ? 'hr' : 'min'} ${g(m).d} ${/^meal/.test(g(m).m) ? 'meals' : g(m).m}`,
  }));
  ctx.scan(R.when, (m) => ({
    kind: 'when',
    ...WHEN_LEX.get(m[1]),
    ...(WHEN_LEX.get(m[1]).warn ? { warn: WHEN_LEX.get(m[1]).warn } : {}),
  }));
  ctx.scan(R.freqQ, (m) => {
    const r = rng(g(m), 'p');
    return r
      ? {
          kind: 'freq',
          frequency: 1,
          period: r.lo,
          ...(r.hi != null ? { periodMax: r.hi } : {}),
          periodUnit: periodUnit(g(m).u),
        }
      : null;
  });
  ctx.scan(R.freqEvery, (m) => {
    const r = rng(g(m), 'p');
    return r
      ? {
          kind: 'freq',
          frequency: 1,
          period: r.lo,
          ...(r.hi != null ? { periodMax: r.hi } : {}),
          periodUnit: periodUnit(g(m).u),
        }
      : null;
  });
  ctx.scan(R.freqTimes, (m) => {
    const r = rng(g(m), 'n');
    return r
      ? {
          kind: 'freq',
          frequency: r.lo,
          ...(r.hi != null ? { frequencyMax: r.hi } : {}),
          period: 1,
          periodUnit: periodUnit(g(m).u),
        }
      : null;
  });
  ctx.scan(R.freq, (m) => ({ kind: 'freq', ...FREQ_LEX.get(m[1]) }));

  // 5. route, duration
  ctx.scan(R.route, (m, s, e) => {
    if (
      m[1] === 'oral' &&
      /^ (?:suspension|solution|rehydration|contraceptive|syrup|liquid)/.test(text.slice(e))
    )
      return null;
    const v = ROUTE_LEX.get(m[1]);
    return {
      kind: 'route',
      value: v.value,
      abbreviation: m[1],
      ...(v.warn ? { warn: v.warn } : {}),
    };
  });
  ctx.scan(R.durA, (m) => {
    const r = rng(g(m), 'v');
    return r ? { kind: 'duration', duration: { ...range(r), unit: periodUnit(g(m).u) } } : null;
  });
  ctx.scan(R.durUK, (m) => ({
    kind: 'duration',
    duration: { value: +g(m).v, unit: { 7: 'd', 52: 'wk', 12: 'mo' }[g(m).d] },
  }));
  ctx.scan(R.durUntil, (m) => ({ kind: 'duration', duration: { until: g(m).w } }));
  ctx.scan(R.durIndef, () => ({ kind: 'duration', duration: { indefinite: true } }));
  ctx.scan(R.durBare, (m) => {
    const r = rng(g(m), 'v');
    return r ? { kind: 'duration', duration: { ...range(r), unit: periodUnit(g(m).u) } } : null;
  });

  // 6. verbs, PRN, eye/ear laterality
  ctx.scan(R.verb, () => ({ kind: 'verb' }));
  ctx.scan(R.prn, () => ({ kind: 'prn' }));
  ctx.scan(R.site, (m) => ({ kind: 'site', site: SITE_LEX.get(m[1]) }));
  const hasDrop = ctx.items.some((i) => i.kind === 'count' && i.unit === 'drop');
  const eyeCue = hasDrop || EYE_CUE.test(text);
  ctx.scan(R.lateral, (m) => {
    const t = g(m).t;
    if (eyeCue)
      return {
        kind: 'site',
        site: { od: 'right eye', os: 'left eye', ou: 'both eyes' }[t],
        ambiguousOd: t === 'od',
      };
    if (t === 'od') return { kind: 'freq', ...F(1, 1, 'd') };
    return null; // "os"/"ou" without an eye/ear context: leave unclaimed → reported
  });

  // 7. free-text reasons (PRN reason, then generic "for X")
  for (const p of ctx.items.filter((i) => i.kind === 'prn')) {
    const r = /^ ?(?:for |if |when |with )?([a-z][a-z \/-]*)/.exec(ctx.masked().slice(p.span.end));
    if (r) {
      const reason = r[1].replace(/(?: (?:and|or|for|x))+$/, '').trim();
      if (reason) {
        const start = p.span.end + r[0].indexOf(r[1]);
        ctx.mask.claim(p.span.end, start + reason.length);
        p.reason = reason;
        p.span.end = start + reason.length;
      }
    }
  }
  for (const m of ctx.masked().matchAll(/(?<![a-z0-9])(?:for|indication:?) ([a-z][a-z \/-]*)/g)) {
    const reason = m[1].replace(/(?: (?:and|or|for|x))+$/, '').trim();
    if (!reason) continue;
    const start = m.index;
    const end = start + m[0].indexOf(m[1]) + reason.length;
    if (!ctx.mask.free(start, end)) continue;
    ctx.mask.claim(start, end);
    ctx.items.push({ kind: 'indication', reason, span: { start, end } });
  }

  // 8. unsafe bare "u" (units): reported but not interpreted
  for (const m of ctx.masked().matchAll(BARE_U)) {
    ctx.warn(
      'UNSAFE_ABBREVIATION',
      `"${m[0]}": a bare "U" for units is on the Joint Commission Do Not Use list (mistaken for 0, 4 or cc); not interpreted.`,
      { token: 'u' }
    );
  }
}

/**
 * "pcm 2 tds 5/7": a bare number directly before a frequency/route/duration
 * marker, in a step that has no counted dose, is the dose with no unit.
 * We keep it as {value, unit: null} and flag it; we never guess the unit.
 */
const BARE_QTY = new RegExp(String.raw`(?<![a-z0-9./-])${qr('v')}(?![a-z0-9./%-])`, 'g');
const BARE_BEFORE = new Set([
  'freq',
  'when',
  'stat',
  'offset',
  'route',
  'duration',
  'prn',
  'maxdose',
  'site',
  'then',
]);
function claimBareDoses(ctx) {
  const { text } = ctx;
  const cuts = ctx.items.filter((i) => i.kind === 'then').map((i) => i.span.start);
  const segOf = (pos) => cuts.filter((c) => c <= pos).length;
  for (const m of ctx.masked().matchAll(BARE_QTY)) {
    const start = m.index;
    const end = start + m[0].length;
    if (!ctx.mask.free(start, end)) continue;
    const next = end + (text[end] === ' ' ? 1 : 0);
    if (!ctx.items.some((i) => i.span.start === next && BARE_BEFORE.has(i.kind))) continue;
    const seg = segOf(start);
    if (
      ctx.items.some(
        (i) => (i.kind === 'count' || i.kind === 'weight') && segOf(i.span.start) === seg
      )
    )
      continue;
    const r = rng(m.groups, 'v');
    if (!r) continue;
    const span = { start, end };
    ctx.mask.claim(start, end);
    ctx.items.push({ kind: 'count', qty: range(r), unit: null, span });
    ctx.warn(
      'UNIT_NOT_STATED',
      `"${m[0]}" looks like a dose but has no unit (tablet? capsule? mL?); not guessed.`,
      { span }
    );
  }
}

/* ──────────────────────── assembling the result ──────────────────────── */

const MARKER_KINDS = new Set([
  'count',
  'weight',
  'rate',
  'freq',
  'when',
  'stat',
  'offset',
  'route',
  'site',
  'duration',
  'prn',
  'maxdose',
  'verb',
  'then',
  'indication',
]);
const STEP_KINDS = new Set([
  'count',
  'weight',
  'rate',
  'freq',
  'when',
  'stat',
  'offset',
  'route',
  'site',
  'duration',
  'prn',
  'maxdose',
  'indication',
]);
const isDoseItem = (i) =>
  i.kind === 'count' || i.kind === 'weight' || (i.kind === 'measure' && i.role === 'dose');
const MASSLIKE = new Set(['mass', 'potency', 'amount']);

function classifyMeasures(ctx, productEnd, segmentOf) {
  const hasConc = ctx.items.some(
    (i) => i.kind === 'ratio' || (i.kind === 'measure' && i.type === 'concentration')
  );
  const hasCount = new Map();
  for (const i of ctx.items)
    if (i.kind === 'count' || i.kind === 'weight') hasCount.set(segmentOf(i), true);
  for (const it of ctx.items) {
    if (it.kind !== 'measure' || it.role) continue;
    const mass = MASSLIKE.has(it.unitKind);
    const seg = segmentOf(it);
    if (it.span.start < productEnd)
      it.role = mass ? 'strength' : hasConc ? 'dose' : 'unclassified'; // "125mg/5ml 5 ml tds": volume × concentration
    else if (it.each) it.role = 'strength';
    else if (hasCount.get(seg)) {
      it.role = mass ? 'strength' : 'unclassified';
      if (mass)
        ctx.warn(
          'AMBIGUOUS_QUANTITY',
          `"${ctx.text.slice(it.span.start, it.span.end)}" appears next to a counted dose; treated as product strength, but it could be a total dose.`,
          { span: it.span }
        );
    } else it.role = 'dose';
    if (it.role === 'strength') it.strength = it.qty;
    if (it.role === 'unclassified')
      ctx.warn(
        'UNCLASSIFIED_QUANTITY',
        `Could not tell what "${ctx.text.slice(it.span.start, it.span.end)}" refers to.`,
        { span: it.span }
      );
  }
}

function captureDrug(ctx, productStart, productEnd) {
  const tokens = [];
  const runs = ctx.freeRuns(productStart, productEnd);
  for (const [s, e] of runs)
    for (const m of ctx.text.slice(s, e).matchAll(/[^\s:;,()]+/g))
      tokens.push({ text: m[0], start: s + m.index, end: s + m.index + m[0].length });
  for (let i = tokens.length - 1; i >= 0; i--)
    if (!/[a-z0-9]/.test(tokens[i].text)) tokens.splice(i, 1);
  while (tokens.length && (STOP.has(tokens[0].text) || /^[-/]+$/.test(tokens[0].text)))
    tokens.shift();
  while (tokens.length && (STOP.has(tokens.at(-1).text) || /^[-/]+$/.test(tokens.at(-1).text)))
    tokens.pop();
  if (!tokens.length || tokens.some((t) => NON_NAME.test(t.text))) return null;
  for (const [s, e] of runs) ctx.mask.claim(s, e);
  return {
    text: tokens.map((t) => t.text).join(' '),
    span: { start: tokens[0].start, end: tokens.at(-1).end },
  };
}

function buildIngredients(ctx, drug, match) {
  const entries = [];
  for (const it of ctx.items.slice().sort(byStart)) {
    if (it.kind === 'measure' && it.role === 'strength') {
      if (it.type === 'combination')
        for (const c of it.components) entries.push({ strength: c, span: it.span });
      else entries.push({ strength: it.strength, span: it.span });
    } else if (it.kind === 'ratio') entries.push({ strength: it.strength, span: it.span });
  }
  let names = [];
  if (match?.entry.ingredients?.length === entries.length) names = match.entry.ingredients;
  else if (drug && drug.text.includes('/') && drug.text.split('/').length === entries.length)
    names = drug.text.split('/').map((s) => s.trim());
  else if (drug && entries.length === 1) names = [drug.text];
  return entries.map((e, i) => ({ name: names[i] ?? null, strength: e.strength, span: e.span }));
}

function buildClause(ctx, its, joinedBy, source) {
  const by = (k) => its.filter((i) => i.kind === k).sort(byStart);
  const step = {
    step: 0,
    joinedBy,
    source,
    dose: null,
    rate: null,
    timing: null,
    route: null,
    site: null,
    duration: null,
    asNeeded: null,
    maxDose: null,
    indication: null,
  };

  const doses = its.filter(isDoseItem).sort(byStart);
  if (doses.length) {
    const d = doses[0];
    if (d.kind === 'count') step.dose = { ...d.qty, unit: d.unit };
    else if (d.kind === 'weight') {
      step.dose = {
        ...d.qty,
        per: d.per,
        ...(d.perTime ? { perTime: d.perTime } : {}),
        weightBased: true,
      };
      ctx.warn(
        'WEIGHT_BASED_DOSE',
        "Weight/BSA-based dose: the absolute dose needs the patient's weight or BSA and must be calculated and checked.",
        { span: d.span }
      );
    } else step.dose = { ...d.qty };
    if (doses.length > 1)
      ctx.warn(
        'MULTIPLE_DOSES',
        `More than one dose in the same instruction ("${source}"); only the first was used.`
      );
  }
  const rate = by('rate')[0];
  if (rate) step.rate = rate.rate;

  // timing
  const timing = {};
  const freqs = by('freq');
  if (freqs.length) {
    const f = freqs[0];
    for (const k of ['frequency', 'frequencyMax', 'period', 'periodMax', 'periodUnit'])
      if (f[k] != null) timing[k] = f[k];
    if (
      freqs.some(
        (x) => x.frequency !== f.frequency || x.period !== f.period || x.periodUnit !== f.periodUnit
      )
    )
      ctx.warn('MULTIPLE_FREQUENCIES', `Conflicting frequencies in "${source}".`);
  }
  const whens = by('when');
  if (whens.length) timing.when = [...new Set(whens.map((w) => w.when))];
  const tods = [...new Set(whens.filter((w) => w.tod).map((w) => w.when))];
  const stat = by('stat')[0];
  if (stat) {
    timing.count = 1;
    if (stat.stat) timing.stat = true;
  }
  const off = by('offset')[0];
  if (off) timing.offset = off.offset;

  const site = by('site')[0];
  if (site) {
    step.site = site.site;
    const anyFreq = freqs.length > 0 || tods.length > 0;
    if (site.ambiguousOd && !anyFreq)
      ctx.warn(
        'AMBIGUOUS_OD',
        '"OD" can mean "right eye" or "once daily" and no other frequency is given; ask the prescriber.',
        { token: 'od' }
      );
    else if (site.ambiguousOd)
      ctx.warn(
        'OD_AS_LATERALITY',
        '"OD" interpreted as "right eye" because the instruction is for the eye/ear and another frequency is given.',
        { severity: 'info', token: 'od' }
      );
  }
  if (!freqs.length && !stat && tods.length) {
    timing.frequency = tods.length;
    timing.period = 1;
    timing.periodUnit = 'd';
    ctx.warn('FREQUENCY_INFERRED', `Frequency inferred from time-of-day wording in "${source}".`, {
      severity: 'info',
    });
  }
  step.timing = Object.keys(timing).length ? timing : null;

  const route = by('route');
  if (route.length) {
    step.route = { value: route[0].value, abbreviation: route[0].abbreviation };
    if (new Set(route.map((r) => r.value)).size > 1)
      ctx.warn('MULTIPLE_ROUTES', `More than one route in "${source}".`);
  }
  const dur = by('duration');
  if (dur.length) {
    step.duration = dur[0].duration;
    if (dur.length > 1)
      ctx.warn(
        'MULTIPLE_DURATIONS',
        `More than one duration in "${source}"; only the first was used.`
      );
  }
  const prn = by('prn')[0];
  if (prn) step.asNeeded = { reason: prn.reason || null };
  const mx = by('maxdose')[0];
  if (mx) step.maxDose = mx.maxDose;
  const ind = by('indication')[0];
  if (ind) step.indication = ind.reason;
  return step;
}

function buildRegimen(ctx, segs) {
  const { text } = ctx;
  const steps = [];
  segs.forEach((seg, si) => {
    const segItems = ctx.items.filter(
      (i) =>
        (STEP_KINDS.has(i.kind) || (i.kind === 'measure' && i.role === 'dose')) &&
        i.span.start >= seg.start &&
        i.span.start < seg.end
    );
    if (!segItems.length) return;
    const doses = segItems.filter(isDoseItem).sort(byStart);
    let clauses = [{ start: seg.start, end: seg.end, joinedBy: si === 0 ? null : 'then' }];
    if (doses.length > 1) {
      clauses = [];
      let from = seg.start;
      let joined = si === 0 ? null : 'then';
      for (let k = 0; k < doses.length - 1; k++) {
        const gs = doses[k].span.end;
        const gap = text.slice(gs, doses[k + 1].span.start);
        let b = null;
        for (const m of gap.matchAll(/(?<![a-z0-9])and(?![a-z0-9])|[;,]|\+/g))
          if (ctx.mask.free(gs + m.index, gs + m.index + m[0].length)) b = m;
        if (!b) continue;
        const bs = gs + b.index;
        const be = bs + b[0].length;
        clauses.push({ start: from, end: bs, joinedBy: joined });
        ctx.mask.claim(bs, be);
        from = be;
        joined = 'and';
      }
      clauses.push({ start: from, end: seg.end, joinedBy: joined });
    }
    const built = clauses.map((c) =>
      buildClause(
        ctx,
        segItems.filter((i) => i.span.start >= c.start && i.span.start < c.end),
        c.joinedBy,
        text.slice(c.start, c.end).replace(/^[\s:;,]+|[\s:;,]+$/g, '')
      )
    );
    // modifiers stated once for the whole segment apply to every clause in it
    for (const f of ['route', 'site', 'duration', 'asNeeded', 'maxDose', 'indication']) {
      const vals = new Set(built.filter((s) => s[f]).map((s) => JSON.stringify(s[f])));
      if (vals.size === 1) {
        const v = built.find((s) => s[f])[f];
        for (const s of built) if (!s[f]) s[f] = v;
      }
    }
    steps.push(...built);
  });
  // one route/site in the whole instruction applies to every step
  for (const f of ['route', 'site']) {
    const key = (s) => (f === 'route' ? s.route.value : s.site);
    const vals = new Set(steps.filter((s) => s[f]).map(key));
    if (vals.size === 1) {
      const v = steps.find((s) => s[f])[f];
      for (const s of steps) if (!s[f]) s[f] = v;
    }
  }
  steps.forEach((s, i) => (s.step = i + 1));
  return steps;
}

/* ───────────────────────── drug catalogue matching ───────────────────────── */

const squash = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const bigrams = (s) => {
  const m = new Map();
  for (let i = 0; i < s.length - 1; i++)
    m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) || 0) + 1);
  return m;
};
function dice(a, b) {
  let ta = 0;
  let tb = 0;
  let inter = 0;
  for (const v of a.values()) ta += v;
  for (const v of b.values()) tb += v;
  if (!ta || !tb) return 0;
  for (const [k, c] of a) if (b.has(k)) inter += Math.min(c, b.get(k));
  return (2 * inter) / (ta + tb);
}
const sigPart = (s) =>
  s.ratio
    ? `1:${s.ratio[1]}`
    : `${s.value ?? `${s.low}-${s.high}`}${s.unit ?? ''}${s.per ? `/${s.per.value}${s.per.unit}` : ''}`;
const signature = (ingredients) => ingredients.map((i) => sigPart(i.strength)).join('+');

function buildIndex(catalogue) {
  return {
    entries: catalogue.map((entry) => {
      const names = [entry.name, ...(entry.aliases || [])].map(squash).filter(Boolean);
      const sigs = entry.strengths
        ? new Set(entry.strengths.map((s) => signature(analyse(s, {}, null).ingredients)))
        : null;
      return { entry, names, grams: names.map(bigrams), sigs };
    }),
  };
}
function resolve(index, name, sig) {
  const q = squash(name);
  if (!q) return null;
  const qg = bigrams(q);
  const scored = index.entries
    .map((e) => ({
      e,
      score: Math.max(0, ...e.names.map((n, i) => (n === q ? 1 : dice(e.grams[i], qg)))),
    }))
    .filter((x) => x.score >= 0.85);
  if (!scored.length) return null;
  const top = Math.max(...scored.map((x) => x.score));
  let cands = scored.filter((x) => x.score === top);
  let ambiguous = false;
  if (cands.length > 1 && sig) {
    const narrowed = cands.filter((x) => x.e.sigs?.has(sig));
    if (narrowed.length) cands = narrowed;
  }
  if (cands.length > 1) ambiguous = true;
  const near = scored.filter((x) => x.score < top && top - x.score < 0.05);
  if (near.length) ambiguous = true;
  const best = cands[0];
  return { entry: best.e.entry, sigs: best.e.sigs, score: round(top), ambiguous };
}

/* ─────────────────────────────── main entry ─────────────────────────────── */

function analyse(raw, opts, index) {
  const out = {
    status: 'unparseable',
    raw: typeof raw === 'string' ? raw : null,
    normalized: null,
    drug: null,
    form: null,
    ingredients: [],
    regimen: [],
    unparsed: [],
    warnings: [],
    evidence: [],
  };
  if (typeof raw !== 'string' || !raw.trim()) {
    out.warnings.push({
      code: 'INVALID_INPUT',
      severity: 'error',
      message: 'Input must be a non-empty string.',
    });
    return out;
  }
  if (raw.length > MAX_INPUT_LENGTH) {
    out.warnings.push({
      code: 'INPUT_TOO_LONG',
      severity: 'error',
      message: `Input exceeds ${MAX_INPUT_LENGTH} characters; refusing to parse.`,
    });
    return out;
  }

  const { text, notes } = normalize(raw);
  out.normalized = text;
  const ctx = new Ctx(text, opts);
  for (const n of notes) ctx.warn(n.code, n.message, { token: n.token });

  extract(ctx);
  claimBareDoses(ctx);

  const neg = NEGATION.exec(text);
  if (neg)
    ctx.warn(
      'NEGATION_OR_EXCEPTION',
      `"${neg[0]}": negations, limits and exceptions change what an instruction means and are not interpreted.`,
      { token: neg[0], span: { start: neg.index, end: neg.index + neg[0].length } }
    );

  // where do the product (drug + strength) and the directions begin?
  const verbs = ctx.items.filter((i) => i.kind === 'verb').sort(byStart);
  let lead = null;
  if (verbs[0] && verbs[0].span.start === 0) {
    let k = verbs[0].span.end;
    while (text[k] === ' ') k++;
    const art = /^(?:the|a|an) /.exec(text.slice(k));
    if (art) k += art[0].length;
    if (k < text.length && !ctx.mask.m[k] && /[a-z]/.test(text[k])) lead = verbs[0];
  }
  let colon = -1;
  for (let i = 0; i < text.length; i++)
    if (text[i] === ':' && !ctx.mask.m[i]) {
      colon = i;
      break;
    }
  const markers = ctx.items.filter((i) => MARKER_KINDS.has(i.kind) && i !== lead);
  const productEnd = Math.min(
    colon < 0 ? Infinity : colon,
    text.length,
    ...markers.map((i) => i.span.start)
  );
  const productStart = lead ? lead.span.end : 0;

  // segments split at "then"
  const thens = ctx.items.filter((i) => i.kind === 'then').sort(byStart);
  const segs = [];
  let cur = 0;
  for (const t of thens) {
    segs.push({ start: cur, end: t.span.start });
    cur = t.span.end;
  }
  segs.push({ start: cur, end: text.length });
  const segmentOf = (it) =>
    segs.findIndex((s) => it.span.start >= s.start && it.span.start < s.end);

  classifyMeasures(ctx, productEnd, segmentOf);

  const drugCandidate = captureDrug(ctx, productStart, productEnd);
  out.form = (() => {
    const f = ctx.items.filter((i) => i.kind === 'form').sort(byStart)[0];
    return f ? { value: f.value, span: f.span } : null;
  })();
  if (lead) ctx.mask.claim(lead.span.start, lead.span.end);

  out.regimen = buildRegimen(ctx, segs);
  const provisional = buildIngredients(ctx, drugCandidate, null);

  let match = null;
  if (drugCandidate && index) {
    match = resolve(index, drugCandidate.text, signature(provisional));
    if (!match)
      ctx.warn('DRUG_NOT_IN_CATALOGUE', `"${drugCandidate.text}" was not found in the catalogue.`, {
        span: drugCandidate.span,
      });
    else {
      if (match.score < 1)
        ctx.warn(
          'DRUG_FUZZY_MATCH',
          `"${drugCandidate.text}" matched "${match.entry.name}" only approximately (score ${match.score}); confirm.`,
          { span: drugCandidate.span }
        );
      if (match.ambiguous)
        ctx.warn(
          'DRUG_MATCH_AMBIGUOUS',
          `"${drugCandidate.text}" matches more than one catalogue entry.`,
          { span: drugCandidate.span }
        );
      if (match.sigs && provisional.length && !match.sigs.has(signature(provisional)))
        ctx.warn(
          'STRENGTH_NOT_IN_CATALOGUE',
          `Strength "${signature(provisional)}" is not a listed strength of "${match.entry.name}".`,
          { span: drugCandidate.span }
        );
    }
  }
  out.drug = drugCandidate
    ? {
        text: drugCandidate.text,
        span: drugCandidate.span,
        match: match
          ? { id: match.entry.id ?? null, name: match.entry.name, score: match.score }
          : null,
      }
    : null;
  out.ingredients = buildIngredients(ctx, drugCandidate, match);
  if (out.ingredients.length > 1 && out.ingredients.every((i) => i.name == null))
    ctx.warn(
      'INGREDIENTS_UNBOUND',
      'Several strengths were found but ingredient names could not be bound (brand name or combination). Resolve against a formulary.',
      { severity: 'info' }
    );

  // completeness checks
  if (!out.drug)
    ctx.warn('DRUG_NOT_STATED', 'No drug name in the instruction.', {
      severity: opts.requireDrug ? 'warn' : 'info',
    });
  if (!out.regimen.length && (out.drug || out.ingredients.length))
    ctx.warn('NO_DIRECTIONS', 'No dose, frequency or other directions were found.');
  for (const s of out.regimen) {
    if (!s.dose && !s.rate)
      ctx.warn('DOSE_NOT_STATED', `Step ${s.step} ("${s.source}"): no dose was found.`);
    const t = s.timing || {};
    if (!s.rate && t.frequency == null && !t.count && !t.offset && !s.asNeeded)
      ctx.warn('FREQUENCY_NOT_STATED', `Step ${s.step} ("${s.source}"): no frequency was found.`);
  }

  // residue: everything nobody claimed
  for (const [s, e] of ctx.freeRuns(0, text.length)) {
    const toks = [...text.slice(s, e).matchAll(/[a-z0-9]+(?:[-'./][a-z0-9]+)*/g)].filter(
      (m) => !STOP.has(m[0])
    );
    if (toks.length) {
      const a = s + toks[0].index;
      const b = s + toks.at(-1).index + toks.at(-1)[0].length;
      out.unparsed.push({ text: text.slice(a, b), span: { start: a, end: b } });
    }
  }

  out.warnings = ctx.warnings;
  out.evidence = ctx.items
    .slice()
    .sort(byStart)
    .map((i) => ({
      kind: i.kind === 'measure' ? `measure:${i.role}` : i.kind,
      text: text.slice(i.span.start, i.span.end),
      span: i.span,
    }));

  const nothing = !out.drug && !out.ingredients.length && !out.regimen.length;
  if (nothing) {
    ctx.warn('NOTHING_PARSED', 'Nothing recognisable was found in the input.', {
      severity: 'error',
    });
    out.status = 'unparseable';
  } else
    out.status =
      out.unparsed.length || ctx.warnings.some((w) => w.severity !== 'info')
        ? 'needs_review'
        : 'ok';
  return out;
}

/**
 * Create a parser. Pass `catalogue` once so it is indexed once:
 *   createParser({ catalogue: [{ id, name, aliases?, ingredients?, strengths? }] })
 * Options: requireDrug (bool), severity ({ CODE | "CODE:token": 'info'|'warn'|'error' }).
 */
function createParser(options = {}) {
  const index = options.catalogue ? buildIndex(options.catalogue) : null;
  return {
    version: VERSION,
    parse: (raw, perCall = {}) => analyse(raw, { ...options, ...perCall }, index),
  };
}

const defaultParser = createParser();
const parsePrescription = defaultParser.parse;

export { createParser, parsePrescription, normalize, VERSION };
