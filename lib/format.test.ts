import { describe, expect, it } from 'vitest';
import { formatTai, formatUsd, formatUsdPerTai } from './format';

describe('format', () => {
  it('formats usd in unified $number style', () => {
    expect(formatUsd(1000000, 'zh')).toBe('$1,000,000');
    expect(formatUsd(1000000, 'en')).toBe('$1,000,000');
  });

  it('formats usd/tai with stable output', () => {
    expect(formatUsdPerTai(0.00008, 'zh')).toBe('$0.00008 / TAI');
  });

  it('formats tai with suffix', () => {
    expect(formatTai(12500, 'zh')).toBe('12,500 TAI');
  });
});
