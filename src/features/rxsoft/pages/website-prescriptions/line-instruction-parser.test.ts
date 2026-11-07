import { describe, expect, it } from 'vitest';
import { parsePrescription } from '@/lib/prescription-parser';
import { mapParsedInstruction, summariseParse } from './line-instruction-parser';

describe('mapParsedInstruction', () => {
  it('distributes a simple instruction into the line fields', () => {
    const result = parsePrescription(
      'Amoxicillin 500mg: take 1 capsule by mouth three times daily for 7 days'
    );
    const mapped = mapParsedInstruction(result);

    expect(mapped.freetextName).toBe('Amoxicillin');
    expect(mapped.strength).toBe('500mg');
    expect(mapped.frequency).toBe('3x daily');
    expect(mapped.durationDays).toBe(7);
    expect(mapped.quantity).toBe(21);
    expect(mapped.instruction).toContain('oral');
  });

  it('formats interval frequencies and weekly durations', () => {
    const result = parsePrescription('Take 1 tablet every 6 hours for 2 weeks');
    const mapped = mapParsedInstruction(result);

    expect(mapped.frequency).toBe('every 6 hours');
    expect(mapped.durationDays).toBe(14);
    expect(mapped.quantity).toBe(56);
  });

  it('summarises warnings and unparsed text', () => {
    const result = parsePrescription('Take 1 tablet bd after meals and avoid alcohol');
    const summary = summariseParse(result);

    expect(summary.status).toBe('needs_review');
    expect(summary.unparsed.some((text) => text.includes('avoid alcohol'))).toBe(true);
  });
});
