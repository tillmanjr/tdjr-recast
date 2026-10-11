import { describe, it, expect } from 'vitest';
import { TYPES, parseTimestamp, detectType, convert } from '../../src/lib/timestamp.js';

const names = Object.fromEntries(TYPES.map((t) => [t.key, t.name]));

describe('parseTimestamp', () => {
  it('splits digits into an integer part and a fraction, ignoring surrounding space', () => {
    expect(parseTimestamp('1700000000')).toEqual({ int: 1700000000n, frac: '' });
    expect(parseTimestamp(' 2460000.25 ')).toEqual({ int: 2460000n, frac: '25' });
    expect(parseTimestamp('0')).toEqual({ int: 0n, frac: '' });
  });

  it('rejects anything that is not digits with an optional fraction', () => {
    const msg = 'Expected a string of digits, e.g. "1700000000"';
    for (const bad of ['abc', '', '1.2.3', '-5', '1e5', '1,700']) {
      expect(() => parseTimestamp(bad)).toThrow(msg);
    }
  });
});

describe('detectType', () => {
  it.each([
    ['2460000', 'julian'],
    ['0', 'coredata'],
    ['700000000', 'coredata'],
    ['12345678', 'coredata'],
    ['1700000000', 'unix-s'],
    ['170000000012', 'unix-ms'],
    ['1700000000123', 'unix-ms'],
    ['170000000012345', 'unix-us'],
    ['1700000000123456', 'unix-us'],
    ['13300000000000000', 'webkit'],
    ['132000000000000000', 'filetime'],
    ['1700000000123456789', 'unix-ns'],
  ])('%s is %s', (input, key) => {
    expect(detectType(input).key).toBe(key);
  });

  it('counts digits of the integer part only', () => {
    expect(detectType('1700000000.999').key).toBe('unix-s');
  });

  it('rejects digit counts that match nothing', () => {
    expect(() => detectType('17000000001')).toThrow('No known timestamp type has 11 digits');
    expect(() => detectType('17000000001234')).toThrow('No known timestamp type has 14 digits');
    expect(() => detectType('17000000001234567890')).toThrow('No known timestamp type has 20 digits');
  });

  it('gives every type a distinct name, a digit list and an example that detects as itself', () => {
    expect(new Set(TYPES.map((t) => t.name)).size).toBe(TYPES.length);
    for (const t of TYPES) {
      expect(t.digits.length).toBeGreaterThan(0);
      expect(detectType(t.example).key).toBe(t.key);
    }
  });
});

describe('convert', () => {
  it('unix seconds, with any given fraction shown up to 9 digits', () => {
    expect(convert('unix-s', '1700000000')).toBe('2023-11-14T22:13:20Z');
    expect(convert('unix-s', '1700000000.5')).toBe('2023-11-14T22:13:20.5Z');
    expect(convert('unix-s', '1700000000.1234567891')).toBe('2023-11-14T22:13:20.123456789Z');
  });

  it('unix milliseconds, microseconds and nanoseconds at their native precision', () => {
    expect(convert('unix-ms', '1700000000123')).toBe('2023-11-14T22:13:20.123Z');
    expect(convert('unix-ms', '1700000000123.4')).toBe('2023-11-14T22:13:20.1234Z');
    expect(convert('unix-us', '1700000000123456')).toBe('2023-11-14T22:13:20.123456Z');
    expect(convert('unix-ns', '1700000000123456789')).toBe('2023-11-14T22:13:20.123456789Z');
  });

  it('Windows FILETIME', () => {
    expect(convert('filetime', '116444736000000000')).toBe('1970-01-01T00:00:00.0000000Z');
    expect(convert('filetime', '132000000000000000')).toBe('2019-04-17T18:40:00.0000000Z');
  });

  it('Chrome / WebKit', () => {
    expect(convert('webkit', '11644473600000000')).toBe('1970-01-01T00:00:00.000000Z');
    expect(convert('webkit', '13300000000000000')).toBe('2022-06-18T04:26:40.000000Z');
  });

  it('CoreData', () => {
    expect(convert('coredata', '0')).toBe('2001-01-01T00:00:00Z');
    expect(convert('coredata', '700000000')).toBe('2023-03-08T20:26:40Z');
    expect(convert('coredata', '700000000.25')).toBe('2023-03-08T20:26:40.25Z');
  });

  it('SQLite Julian Day, including dates before 1970', () => {
    expect(convert('julian', '2451545')).toBe('2000-01-01T12:00:00Z');
    expect(convert('julian', '2440587.5')).toBe('1970-01-01T00:00:00Z');
    expect(convert('julian', '2460000.25')).toBe('2023-02-24T18:00:00Z');
    expect(convert('julian', '2000000')).toBe('0763-09-18T12:00:00Z');
    expect(convert('julian', '2440587.2500001')).toBe('1969-12-31T18:00:00Z');
  });

  it('reports values the calendar cannot represent', () => {
    expect(() => convert('unix-s', '9999999999999999999')).toThrow(`${names['unix-s']}: 9999999999999999999 is out of range`);
  });

  it('rejects an unknown type key', () => {
    expect(() => convert('nope', '1')).toThrow('Unknown timestamp type "nope"');
  });

  it('rejects bad input with the parse message', () => {
    expect(() => convert('unix-s', 'soon')).toThrow('Expected a string of digits');
  });
});
