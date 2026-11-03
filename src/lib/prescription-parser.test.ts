import { test } from 'vitest';
import { createParser, parsePrescription as parse, normalize } from './prescription-parser';
/* eslint-disable */
import assert from 'node:assert/strict';

/* ───────────── helpers ───────────── */

/** recursive subset match: every key in `exp` must match; arrays must match in length */
function subset(act, exp, path = 'result') {
  if (exp === null || typeof exp !== 'object')
    return assert.equal(
      act,
      exp,
      `${path}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`
    );
  assert.ok(
    act !== null && typeof act === 'object',
    `${path}: expected an object/array, got ${JSON.stringify(act)}`
  );
  if (Array.isArray(exp)) {
    assert.ok(Array.isArray(act), `${path}: expected an array`);
    assert.equal(act.length, exp.length, `${path}: array length ${act.length} != ${exp.length}`);
    exp.forEach((e, i) => subset(act[i], e, `${path}[${i}]`));
  } else for (const k of Object.keys(exp)) subset(act[k], exp[k], `${path}.${k}`);
}
const codes = (r) => r.warnings.map((w) => w.code);
const sev = (r, code) => r.warnings.find((w) => w.code === code)?.severity;
const freq = (frequency, period, periodUnit) => ({ frequency, period, periodUnit });

/* ───────────── your original four examples ───────────── */

test('original examples parse cleanly', () => {
  subset(parse('Amoxicillin 250mg/5ml: Take 10 ml PO TID for 7 days'), {
    status: 'ok',
    drug: { text: 'amoxicillin' },
    ingredients: [
      { name: 'amoxicillin', strength: { value: 250, unit: 'mg', per: { value: 5, unit: 'ml' } } },
    ],
    regimen: [
      {
        dose: { value: 10, unit: 'ml' },
        timing: freq(3, 1, 'd'),
        route: { value: 'oral' },
        duration: { value: 7, unit: 'd' },
      },
    ],
  });
  subset(parse('Augmentin 875/125 mg take 1 tablet by mouth twice daily'), {
    status: 'ok',
    drug: { text: 'augmentin' },
    ingredients: [
      { strength: { value: 875, unit: 'mg' } },
      { strength: { value: 125, unit: 'mg' } },
    ],
    regimen: [
      { dose: { value: 1, unit: 'tablet' }, timing: freq(2, 1, 'd'), route: { value: 'oral' } },
    ],
  });
  subset(parse('Hydrocortisone 1% cream: Apply 1 application TOP BID PRN for itching'), {
    status: 'ok',
    drug: { text: 'hydrocortisone' },
    form: { value: 'cream' },
    ingredients: [{ strength: { value: 1, unit: '%' } }],
    regimen: [
      {
        dose: { value: 1, unit: 'application' },
        timing: freq(2, 1, 'd'),
        route: { value: 'topical' },
        asNeeded: { reason: 'itching' },
      },
    ],
  });
  subset(parse('Take 2 tablets (500mg each) PO q6h PRN for fever'), {
    status: 'ok',
    drug: null,
    ingredients: [{ strength: { value: 500, unit: 'mg' } }],
    regimen: [
      {
        dose: { value: 2, unit: 'tablet' },
        timing: freq(1, 6, 'h'),
        asNeeded: { reason: 'fever' },
      },
    ],
  });
});

/* ───────────── regressions: every silent failure found in v1 ───────────── */

test('REGRESSION "twice daily" is no longer read as once daily', () => {
  subset(
    parse('Augmentin 875/125 mg take 1 tablet by mouth twice daily').regimen[0].timing,
    freq(2, 1, 'd')
  );
  subset(parse('Take 1 tablet three times daily').regimen[0].timing, freq(3, 1, 'd'));
  subset(parse('Take 1 tablet four times a day').regimen[0].timing, freq(4, 1, 'd'));
});

test('REGRESSION fractions are fractions, not their denominators', () => {
  subset(parse('Take 1/2 tablet PO BID').regimen[0].dose, { value: 0.5, unit: 'tablet' });
  subset(parse('Take 1 1/2 tablets PO BID').regimen[0].dose, { value: 1.5, unit: 'tablet' });
  subset(parse('Take ½ tablet at night').regimen[0].dose, { value: 0.5, unit: 'tablet' });
  subset(parse('Take 1½ tablets daily').regimen[0].dose, { value: 1.5, unit: 'tablet' });
  subset(parse('Take half a tablet at night').regimen[0].dose, { value: 0.5, unit: 'tablet' });
});

test('REGRESSION ranges are preserved, not collapsed to the upper bound', () => {
  subset(parse('Take 1-2 tablets PO q6h PRN pain').regimen[0], {
    dose: { low: 1, high: 2, unit: 'tablet' },
    asNeeded: { reason: 'pain' },
  });
  subset(parse('Take 1 tablet q4-6h').regimen[0].timing, {
    frequency: 1,
    period: 4,
    periodMax: 6,
    periodUnit: 'h',
  });
});

test('REGRESSION thousands separators: 50,000 IU is not 0 IU', () => {
  const r = parse('Vitamin D3 50,000 IU PO weekly');
  subset(r.ingredients[0], { name: 'vitamin d3', strength: { value: 50000, unit: 'iu' } });
  assert.ok(codes(r).includes('UNSAFE_ABBREVIATION')); // "IU"
  assert.ok(codes(r).includes('DOSE_NOT_STATED')); // 50,000 IU is a strength here, the dose is unstated
  assert.equal(r.status, 'needs_review');
});

test('REGRESSION leading-dot decimals are flagged, never silently ×10', () => {
  const r = parse('Take .5 mg PO daily');
  subset(r.regimen[0].dose, { value: 0.5, unit: 'mg' });
  assert.ok(codes(r).includes('LEADING_ZERO_MISSING'));
  assert.equal(r.status, 'needs_review');
});

test('REGRESSION decimal comma is refused, trailing zero is flagged', () => {
  assert.ok(codes(parse('Take 0,5 mg PO daily')).includes('AMBIGUOUS_DECIMAL_COMMA'));
  assert.ok(codes(parse('Take 5.0 mg PO daily')).includes('TRAILING_ZERO'));
});

test('REGRESSION insulin "units" are a dose, concentration is the strength', () => {
  subset(parse('Insulin glargine 100 units/ml: inject 20 units SC qhs'), {
    drug: { text: 'insulin glargine' },
    ingredients: [{ strength: { value: 100, unit: 'unit', per: { value: 1, unit: 'ml' } } }],
    regimen: [
      {
        dose: { value: 20, unit: 'unit' },
        route: { value: 'subcutaneous' },
        timing: { when: ['bedtime'] },
      },
    ],
  });
});

test('REGRESSION mg/kg is a weight-based dose and needs review, not a 5 mg strength', () => {
  const r = parse('Gentamicin 5 mg/kg IV q24h');
  subset(r.regimen[0], {
    dose: { value: 5, unit: 'mg', per: 'kg', weightBased: true },
    route: { value: 'intravenous' },
    timing: freq(1, 24, 'h'),
  });
  assert.deepEqual(r.ingredients, []);
  assert.ok(codes(r).includes('WEIGHT_BASED_DOSE'));
  assert.equal(r.status, 'needs_review');
  subset(parse('Paracetamol 15 mg/kg PO q6h').regimen[0].dose, {
    value: 15,
    per: 'kg',
    weightBased: true,
  });
  subset(parse('Amikacin 15 mg/kg/day IV').regimen[0].dose, { value: 15, per: 'kg', perTime: 'd' });
});

test('REGRESSION OD near eye drops is laterality, and ambiguity is surfaced', () => {
  subset(parse('Chloramphenicol 0.5% 1 drop OD QID').regimen[0], {
    site: 'right eye',
    timing: freq(4, 1, 'd'),
  });
  const amb = parse('Chloramphenicol 0.5% 1 drop OD');
  assert.ok(codes(amb).includes('AMBIGUOUS_OD'));
  assert.equal(amb.regimen[0].timing, null); // not guessed
  assert.equal(amb.status, 'needs_review');
  subset(parse('Take 1 tablet OD').regimen[0].timing, freq(1, 1, 'd')); // no eye context → once daily
});

test('REGRESSION UK/Commonwealth abbreviations', () => {
  subset(parse('Paracetamol 500mg 2 tabs tds x 5 days'), {
    status: 'ok',
    regimen: [
      {
        dose: { value: 2, unit: 'tablet' },
        timing: freq(3, 1, 'd'),
        duration: { value: 5, unit: 'd' },
      },
    ],
  });
  subset(parse('Take 1 tab bd').regimen[0].timing, freq(2, 1, 'd'));
  subset(parse('Take 1 tab qds').regimen[0].timing, freq(4, 1, 'd'));
  subset(parse('Take 2 tabs nocte').regimen[0].timing, { when: ['night'], frequency: 1 });
  subset(parse('Take 1 tab bd x 5/7').regimen[0].duration, { value: 5, unit: 'd' });
  subset(parse('Take 1 tab tds 6/52').regimen[0].duration, { value: 6, unit: 'wk' });
});

test('REGRESSION dotted abbreviations and µg', () => {
  const r = parse('Amoxicillin 500mg cap b.i.d. x 5 days');
  subset(r, { regimen: [{ timing: freq(2, 1, 'd'), duration: { value: 5, unit: 'd' } }] });
  assert.ok(codes(r).includes('DOSE_NOT_STATED')); // "cap" has no count
  const u = parse('Levothyroxine 50 µg daily');
  subset(u.ingredients[0].strength, { value: 50, unit: 'mcg' });
  assert.ok(u.warnings.some((w) => w.token === 'µg'));
  assert.equal(parse('Take 1 tab p.o. t.i.d.').status, 'ok');
});

test('REGRESSION duration phrasing', () => {
  subset(parse('Metronidazole 400 mg 1 tab tds for the next 7 days').regimen[0].duration, {
    value: 7,
    unit: 'd',
  });
  subset(parse('Take 2 tablets x 2 wks').regimen[0].duration, { value: 2, unit: 'wk' });
  subset(parse('Take 1 tab bd for 7-10 days').regimen[0].duration, { low: 7, high: 10, unit: 'd' });
  subset(parse('Take 1 tab bd until finished').regimen[0].duration, { until: 'finished' });
});

test('REGRESSION sprays/units/applications are recognised dose units', () => {
  subset(parse('Salbutamol 100 mcg inhaler 2 sprays inh q4h PRN wheeze'), {
    status: 'ok',
    drug: { text: 'salbutamol' },
    form: { value: 'inhaler' },
    regimen: [
      {
        dose: { value: 2, unit: 'spray' },
        route: { value: 'inhalation' },
        timing: freq(1, 4, 'h'),
        asNeeded: { reason: 'wheeze' },
      },
    ],
  });
});

test('REGRESSION tapers become ordered steps, not a truncated first step', () => {
  subset(parse('Prednisolone 5 mg: 4 tabs daily for 3 days then 2 tabs daily for 3 days'), {
    status: 'ok',
    regimen: [
      {
        step: 1,
        joinedBy: null,
        dose: { value: 4 },
        timing: freq(1, 1, 'd'),
        duration: { value: 3, unit: 'd' },
      },
      {
        step: 2,
        joinedBy: 'then',
        dose: { value: 2 },
        timing: freq(1, 1, 'd'),
        duration: { value: 3, unit: 'd' },
      },
    ],
  });
});

test('REGRESSION different doses at different times are separate steps', () => {
  subset(parse('Metformin 500mg tablets: take 1 tablet in the morning and 2 tablets at night'), {
    drug: { text: 'metformin' },
    form: { value: 'tablet' },
    regimen: [
      { dose: { value: 1 }, timing: { when: ['morning'] }, joinedBy: null },
      { dose: { value: 2 }, timing: { when: ['night'] }, joinedBy: 'and' },
    ],
  });
});

test('REGRESSION infusion rate is a rate, not a 100 ml bolus', () => {
  subset(parse('Normal saline 0.9% infuse 100 ml/hr IV'), {
    drug: { text: 'normal saline' },
    ingredients: [{ strength: { value: 0.9, unit: '%' } }],
    regimen: [
      { dose: null, rate: { value: 100, unit: 'ml', per: 'h' }, route: { value: 'intravenous' } },
    ],
  });
});

test('REGRESSION a bare mass is a dose when no product strength is stated', () => {
  subset(parse('Take 500mg PO BID'), {
    ingredients: [],
    regimen: [{ dose: { value: 500, unit: 'mg' }, timing: freq(2, 1, 'd') }],
  });
});

test('REGRESSION max dose and slash reasons no longer break the indication', () => {
  subset(parse('Ibuprofen 400mg 1 tab q8h PRN pain/fever (max 3 doses/day)'), {
    status: 'ok',
    regimen: [
      { asNeeded: { reason: 'pain/fever' }, maxDose: { value: 3, unit: 'dose', per: 'd' } },
    ],
    unparsed: [],
  });
});

test('REGRESSION combination products bind ingredients; ratios are not "875 mg per 125 mg"', () => {
  subset(parse('Sulfadoxine/Pyrimethamine 500/25 mg 3 tablets stat'), {
    status: 'ok',
    ingredients: [
      { name: 'sulfadoxine', strength: { value: 500, unit: 'mg' } },
      { name: 'pyrimethamine', strength: { value: 25, unit: 'mg' } },
    ],
    regimen: [{ dose: { value: 3, unit: 'tablet' }, timing: { stat: true, count: 1 } }],
  });
  const ca = parse('Lisinopril/HCTZ 20/12.5 mg 1 tab daily'); // "12" must not become 12 months
  subset(ca, {
    ingredients: [
      { name: 'lisinopril', strength: { value: 20 } },
      { name: 'hctz', strength: { value: 12.5 } },
    ],
    regimen: [{ duration: null }],
  });
  const aug = parse('Augmentin 875/125 mg take 1 tablet by mouth twice daily');
  assert.equal(aug.ingredients[0].name, null); // brand: names unknown until a catalogue binds them
  assert.equal(sev(aug, 'INGREDIENTS_UNBOUND'), 'info');
});

test('REGRESSION multi-step regimen with a missing dose fails closed', () => {
  const r = parse(
    'Artemether/Lumefantrine 20/120mg 4 tablets stat then 4 tablets after 8 hours then BD for 2 days'
  );
  subset(r, {
    status: 'needs_review',
    ingredients: [{ name: 'artemether' }, { name: 'lumefantrine' }],
    regimen: [
      { dose: { value: 4 }, timing: { stat: true } },
      { joinedBy: 'then', dose: { value: 4 }, timing: { offset: { value: 8, unit: 'h' } } },
      { joinedBy: 'then', dose: null, timing: freq(2, 1, 'd'), duration: { value: 2, unit: 'd' } },
    ],
  });
  assert.ok(codes(r).includes('DOSE_NOT_STATED'));
});

test('REGRESSION unparsed text is reported, never dropped', () => {
  const r = parse('Take 1 tablet bd after meals and avoid alcohol');
  assert.equal(r.status, 'needs_review');
  assert.deepEqual(
    r.unparsed.map((u) => u.text),
    ['avoid alcohol']
  );
  subset(r.regimen[0].timing, { when: ['after meals'] });
});

/* ───────────── safety policy ───────────── */

test('Do-Not-Use / error-prone abbreviations are interpreted but flagged', () => {
  for (const [input, token] of [
    ['Take 1 tab qd', 'qd'],
    ['Take 1 tab qod', 'qod'],
    ['Take 1 tab hs', 'hs'],
    ['Inject 1 ml sq daily', 'sq'],
    ['Take 5 cc PO daily', 'cc'],
  ]) {
    const r = parse(input);
    assert.ok(
      r.warnings.some((w) => w.code === 'UNSAFE_ABBREVIATION' && w.token === token),
      `${input} should flag ${token}`
    );
    assert.equal(r.status, 'needs_review', input);
  }
  const u = parse('Insulin 10 U SC daily');
  assert.ok(u.warnings.some((w) => w.token === 'u'));
  assert.equal(u.status, 'needs_review'); // "U" is not interpreted at all
});

test('severity can be tuned per code or per code:token without code changes', () => {
  assert.equal(parse('Take 1000 IU PO daily').status, 'needs_review');
  assert.equal(
    parse('Take 1000 IU PO daily', { severity: { 'UNSAFE_ABBREVIATION:iu': 'info' } }).status,
    'ok'
  );
  const strict = parse('Take 1 tablet PO bd', { requireDrug: true });
  assert.equal(sev(strict, 'DRUG_NOT_STATED'), 'warn');
  assert.equal(strict.status, 'needs_review');
});

test('status "ok" means nothing was left over', () => {
  for (const input of [
    'Paracetamol 500mg 2 tabs tds x 5 days',
    'Take 1 tablet 3 times a day for 5 days',
    'Salbutamol 100 mcg inhaler 2 puffs inh q4h PRN wheeze',
  ]) {
    const r = parse(input);
    assert.equal(r.status, 'ok', input);
    assert.equal(r.unparsed.length, 0);
    assert.ok(r.warnings.every((w) => w.severity === 'info'));
  }
});

/* ───────────── robustness ───────────── */

test('bad input does not throw', () => {
  for (const bad of [null, undefined, 42, {}, [], '', '   ', '???']) {
    const r = parse(bad);
    assert.equal(r.status, 'unparseable');
    assert.ok(r.warnings.length);
  }
});

test('oversized and adversarial input is rejected or parsed quickly', () => {
  let t = Date.now();
  const big = parse(`5${' '.repeat(30000)}x`);
  assert.equal(big.status, 'unparseable');
  assert.ok(codes(big).includes('INPUT_TOO_LONG'));
  assert.ok(Date.now() - t < 100);

  t = Date.now();
  for (const adv of [
    '1/'.repeat(400) + 'mg',
    '5' + ' '.repeat(900) + 'x',
    'prn '.repeat(200),
    'then '.repeat(190),
    '1 '.repeat(450),
  ])
    parse(adv);
  assert.ok(Date.now() - t < 1000, `adversarial inputs took ${Date.now() - t}ms`);
});

test('evidence spans point at the text they claim', () => {
  const r = parse('Augmentin 875/125 mg take 1 tablet by mouth twice daily');
  assert.ok(r.evidence.length >= 5);
  for (const e of r.evidence) assert.equal(r.normalized.slice(e.span.start, e.span.end), e.text);
  assert.ok(r.evidence.some((e) => e.kind === 'measure:strength' && e.text === '875/125 mg'));
  assert.ok(r.evidence.some((e) => e.kind === 'freq' && e.text === 'twice daily'));
});

test('fuzz: never throws, always a valid status, never "ok" with leftovers', () => {
  const vocab = [
    'take',
    '1',
    '2',
    '0.5',
    '1/2',
    '-',
    '500mg',
    'mg',
    'ml',
    '5',
    'tab',
    'tablets',
    'bd',
    'tds',
    'prn',
    'then',
    'and',
    'x',
    'days',
    'for',
    'po',
    'iv',
    'q6h',
    'every',
    'hours',
    ':',
    '(',
    ')',
    '%',
    '/',
    ',',
    'stat',
    'od',
    'drop',
    'units',
    'u',
    'amoxicillin',
    'cream',
    '100',
    'kg',
    'max',
    'per',
    'day',
  ];
  let seed = 12345;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < 3000; i++) {
    const s = Array.from(
      { length: 1 + Math.floor(rnd() * 14) },
      () => vocab[Math.floor(rnd() * vocab.length)]
    ).join(' ');
    const r = parse(s);
    assert.ok(['ok', 'needs_review', 'unparseable'].includes(r.status), s);
    if (r.status === 'ok') {
      assert.equal(r.unparsed.length, 0, s);
      assert.ok(
        r.warnings.every((w) => w.severity === 'info'),
        s
      );
    }
    for (const e of r.evidence)
      assert.equal(r.normalized.slice(e.span.start, e.span.end), e.text, s);
  }
});

test('normalize() on its own', () => {
  assert.equal(normalize('T.I.D.  p.o.').text, 'tid po');
  assert.equal(normalize('50,000 IU').text, '50000 iu');
  assert.equal(normalize('1½ tabs').text, '1 1/2 tabs');
  assert.equal(normalize('Take ONE tablet').text, 'take 1 tablet');
});

/* ───────────── frequency vocabulary table (no map-order bugs possible) ───────────── */

test('frequency vocabulary', () => {
  const table = [
    ['once daily', freq(1, 1, 'd')],
    ['once a day', freq(1, 1, 'd')],
    ['daily', freq(1, 1, 'd')],
    ['twice daily', freq(2, 1, 'd')],
    ['twice a day', freq(2, 1, 'd')],
    ['bid', freq(2, 1, 'd')],
    ['bd', freq(2, 1, 'd')],
    ['tid', freq(3, 1, 'd')],
    ['tds', freq(3, 1, 'd')],
    ['thrice daily', freq(3, 1, 'd')],
    ['3 times a day', freq(3, 1, 'd')],
    ['3x daily', freq(3, 1, 'd')],
    ['3x/day', freq(3, 1, 'd')],
    ['qid', freq(4, 1, 'd')],
    ['qds', freq(4, 1, 'd')],
    ['4 times daily', freq(4, 1, 'd')],
    ['weekly', freq(1, 1, 'wk')],
    ['twice weekly', freq(2, 1, 'wk')],
    ['once a week', freq(1, 1, 'wk')],
    ['q8h', freq(1, 8, 'h')],
    ['q12h', freq(1, 12, 'h')],
    ['every 6 hours', freq(1, 6, 'h')],
    ['every 2 days', freq(1, 2, 'd')],
    ['every other day', freq(1, 2, 'd')],
  ];
  for (const [phrase, expected] of table)
    subset(parse(`Take 1 tablet ${phrase}`).regimen[0].timing, expected, phrase);
});

/* ───────────── drug catalogue ───────────── */

test('catalogue: alias match, ingredient binding, typo and strength checks', () => {
  const p = createParser({
    catalogue: [
      {
        id: 'AMOX-500',
        name: 'Amoxicillin',
        aliases: ['Amoxil'],
        ingredients: ['amoxicillin'],
        strengths: ['500 mg'],
      },
      {
        id: 'AUG-625',
        name: 'Augmentin',
        aliases: ['Co-amoxiclav'],
        ingredients: ['amoxicillin', 'clavulanic acid'],
        strengths: ['875/125 mg', '500/125 mg'],
      },
      { id: 'MET-500', name: 'Metformin', strengths: ['500 mg', '850 mg'] },
    ],
  });
  const ok = p.parse('Amoxil 500mg 1 cap tid x 7 days');
  subset(ok, {
    status: 'ok',
    drug: { text: 'amoxil', match: { id: 'AMOX-500', name: 'Amoxicillin', score: 1 } },
  });

  const aug = p.parse('Augmentin 875/125 mg take 1 tablet by mouth twice daily');
  subset(aug, {
    status: 'ok',
    ingredients: [
      { name: 'amoxicillin', strength: { value: 875 } },
      { name: 'clavulanic acid', strength: { value: 125 } },
    ],
  });
  assert.ok(!codes(aug).includes('INGREDIENTS_UNBOUND'));

  const typo = p.parse('Amoxicilin 500mg 1 cap tid');
  subset(typo, { status: 'needs_review', drug: { match: { id: 'AMOX-500' } } });
  assert.ok(codes(typo).includes('DRUG_FUZZY_MATCH'));

  assert.ok(codes(p.parse('Zzyzx 10mg 1 tab daily')).includes('DRUG_NOT_IN_CATALOGUE'));
  const wrongStrength = p.parse('Amoxicillin 250mg 1 cap tid');
  assert.ok(codes(wrongStrength).includes('STRENGTH_NOT_IN_CATALOGUE'));
  assert.equal(wrongStrength.status, 'needs_review');
  assert.equal(p.parse('Metformin 850mg 1 tab bd').status, 'ok');
});

test('catalogue: identical names are disambiguated by strength, otherwise flagged', () => {
  const p = createParser({
    catalogue: [
      { id: 'P-250', name: 'Paracetamol', strengths: ['250 mg'] },
      { id: 'P-500', name: 'Paracetamol', strengths: ['500 mg'] },
    ],
  });
  subset(p.parse('Paracetamol 500mg 1 tab tds'), {
    status: 'ok',
    drug: { match: { id: 'P-500' } },
  });
  const none = p.parse('Take paracetamol 1 tab tds');
  assert.ok(codes(none).includes('DRUG_MATCH_AMBIGUOUS'));
});

/* ───────────── leading drug name forms ───────────── */

test('drug-name capture handles prefixes and verbs', () => {
  subset(parse('Tab Paracetamol 500mg 2 tabs tds'), {
    drug: { text: 'paracetamol' },
    form: { value: 'tablet' },
    status: 'ok',
  });
  subset(parse('Take amoxicillin 500mg 1 cap tid'), {
    drug: { text: 'amoxicillin' },
    ingredients: [{ name: 'amoxicillin', strength: { value: 500 } }],
    regimen: [{ dose: { value: 1, unit: 'capsule' } }],
  });
  subset(parse('Syp Amoxicillin 125mg/5ml 5 ml tds x 5 days'), {
    drug: { text: 'amoxicillin' },
    form: { value: 'syrup' },
    ingredients: [{ strength: { value: 125, per: { value: 5, unit: 'ml' } } }],
    regimen: [{ dose: { value: 5, unit: 'ml' } }],
  });
  subset(parse('Epinephrine 1:1000 0.5 ml IM stat'), {
    ingredients: [{ strength: { ratio: [1, 1000] } }],
    regimen: [
      {
        dose: { value: 0.5, unit: 'ml' },
        route: { value: 'intramuscular' },
        timing: { stat: true },
      },
    ],
  });
  assert.equal(parse('Paracetamol').status, 'needs_review'); // a name alone is not a prescription
  assert.ok(codes(parse('Paracetamol')).includes('NO_DIRECTIONS'));
});

/* ───────────── found by adversarial probing after v2 was "done" ───────────── */

test('PROBE negations and exceptions can never be swallowed', () => {
  const r = parse('Do not take 1 tablet daily');
  assert.equal(r.status, 'needs_review');
  assert.equal(r.drug, null); // "do not" must not become a drug name
  assert.ok(codes(r).includes('NEGATION_OR_EXCEPTION'));
  assert.ok(
    parse('Take 1 tablet daily, no more than 4 tablets in 24 hours').warnings.some(
      (w) => w.code === 'NEGATION_OR_EXCEPTION'
    )
  );
  assert.equal(parse('Take 1 tablet bd, avoid alcohol').status, 'needs_review');
  assert.equal(parse('Take 1 tablet q6h prn pain do not exceed 4 doses').status, 'needs_review');
});

test('PROBE adverbs and filler are not drug names', () => {
  const r = parse('Apply thinly to affected area twice daily');
  assert.equal(r.drug, null);
  assert.ok(r.unparsed.some((u) => u.text.includes('thinly')));
  assert.equal(r.status, 'needs_review');
});

test('PROBE "x 4 doses" is a duration count, not a dose of 4 doses', () => {
  const r = parse('Dexamethasone 4mg IV q6h x 4 doses');
  subset(r.regimen[0], {
    dose: null,
    duration: { count: 4, unit: 'dose' },
    timing: freq(1, 6, 'h'),
  });
  assert.ok(codes(r).includes('DOSE_NOT_STATED')); // 4 mg here is a strength; the dose is unstated
  assert.equal(r.status, 'needs_review');
});

test('PROBE "after 4 weeks" is an offset, not a 4-week duration', () => {
  subset(parse('Give 1 ml IM stat then 1 ml after 4 weeks'), {
    status: 'ok',
    regimen: [
      { timing: { stat: true } },
      {
        joinedBy: 'then',
        dose: { value: 1, unit: 'ml' },
        timing: { offset: { value: 4, unit: 'wk' } },
        duration: null,
      },
    ],
  });
});

test('PROBE bare-number dose ("pcm 2 tds 5/7") is a unit-less dose, not part of the drug name', () => {
  const r = parse('pcm 2 tds 5/7');
  subset(r, {
    status: 'needs_review',
    drug: { text: 'pcm' },
    regimen: [
      {
        dose: { value: 2, unit: null },
        timing: freq(3, 1, 'd'),
        duration: { value: 5, unit: 'd' },
      },
    ],
  });
  assert.ok(codes(r).includes('UNIT_NOT_STATED'));
  assert.equal(r.unparsed.length, 0);

  const p = createParser({
    catalogue: [
      { id: 'PARA-500', name: 'Paracetamol', aliases: ['PCM', 'Panadol'], strengths: ['500 mg'] },
    ],
  });
  const c = p.parse('pcm 2 tds 5/7');
  subset(c, { drug: { text: 'pcm', match: { id: 'PARA-500', name: 'Paracetamol', score: 1 } } });
  assert.ok(!codes(c).includes('DRUG_NOT_IN_CATALOGUE'));
  assert.equal(c.status, 'needs_review'); // the unit is still not guessed, even though the catalogue knows it is a tablet

  subset(parse('Paracetamol 500mg 2 tds'), {
    drug: { text: 'paracetamol' },
    ingredients: [{ strength: { value: 500, unit: 'mg' } }],
    regimen: [{ dose: { value: 2, unit: null }, timing: freq(3, 1, 'd') }],
  });
  subset(parse('Take 2 tds').regimen[0].dose, { value: 2, unit: null });
  // a counted dose elsewhere means a trailing number belongs to the name
  subset(parse('Omega 3 1 cap daily'), {
    drug: { text: 'omega 3' },
    regimen: [{ dose: { value: 1, unit: 'capsule' } }],
  });
});
