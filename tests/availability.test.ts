import { describe, it, expect } from 'vitest';
import { isTimeIntervalOverlapping } from '../lib/services/availabilityService';

describe('Availability Engine: [start, end) Half-Open Interval Math', () => {
  it('should detect direct overlapping bookings', () => {
    // 16:00 - 23:00 vs 18:00 - 22:00 -> Overlaps
    expect(isTimeIntervalOverlapping('16:00', '23:00', '18:00', '22:00')).toBe(true);
  });

  it('should detect partial overlap at the start', () => {
    // 10:00 - 15:00 vs 08:00 - 12:00 -> Overlaps between 10:00 and 12:00
    expect(isTimeIntervalOverlapping('10:00', '15:00', '08:00', '12:00')).toBe(true);
  });

  it('should detect partial overlap at the end', () => {
    // 14:00 - 18:00 vs 17:00 - 21:00 -> Overlaps between 17:00 and 18:00
    expect(isTimeIntervalOverlapping('14:00', '18:00', '17:00', '21:00')).toBe(true);
  });

  it('should ALLOW adjacent/back-to-back intervals without conflict', () => {
    // Booking A: 10:00 - 14:00
    // Booking B: 14:00 - 20:00
    // In [s, e) math, interval A ends exactly when B starts, no overlap!
    expect(isTimeIntervalOverlapping('10:00', '14:00', '14:00', '20:00')).toBe(false);
    expect(isTimeIntervalOverlapping('14:00', '20:00', '10:00', '14:00')).toBe(false);
  });

  it('should ALLOW completely disjoint intervals', () => {
    // Morning 08:00 - 12:00 vs Evening 18:00 - 23:00
    expect(isTimeIntervalOverlapping('08:00', '12:00', '18:00', '23:00')).toBe(false);
  });

  it('should detect identical intervals as conflict', () => {
    expect(isTimeIntervalOverlapping('18:00', '23:00', '18:00', '23:00')).toBe(true);
  });
});
