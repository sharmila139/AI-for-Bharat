/**
 * Property-Based Tests for Grievance Ticket Generation
 * Tests Property 29: Unique Ticket Generation
 * 
 * Property 29: For any submitted grievance, the generated ticket number should be 
 * unique across all grievances in the system.
 */

import * as fc from 'fast-check';

describe('Property 29: Unique Ticket Generation', () => {
  /**
   * Property 29.1: All generated ticket numbers are unique when date+sequence pairs are unique
   */
  test('Property 29.1: Generated ticket numbers are unique for unique date+sequence pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            sequence: fc.integer({ min: 1, max: 999999 })
          }),
          { minLength: 2, maxLength: 100 }
        ),
        async (grievances) => {
          // Remove duplicates based on date (day) + sequence
          const uniqueGrievances = Array.from(
            new Map(
              grievances.map(g => [
                `${g.date.toISOString().split('T')[0]}-${g.sequence}`,
                g
              ])
            ).values()
          );

          fc.pre(uniqueGrievances.length >= 2);

          // Generate ticket numbers
          const ticketNumbers = uniqueGrievances.map(g => 
            generateTicketNumber(g.date, g.sequence)
          );

          // Property: All ticket numbers should be unique
          const uniqueTickets = new Set(ticketNumbers);
          expect(uniqueTickets.size).toBe(ticketNumbers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29.2: Ticket format is consistent (GRV + YYYYMMDD + 6-digit sequence)
   */
  test('Property 29.2: Ticket numbers follow correct format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        fc.integer({ min: 1, max: 999999 }),
        async (date, sequence) => {
          const ticketNumber = generateTicketNumber(date, sequence);

          // Property: Format should be GRV + YYYYMMDD + 6-digit sequence
          expect(ticketNumber).toMatch(/^GRV\d{8}\d{6}$/);
          
          // Verify date component
          const year = date.getFullYear().toString();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const expectedDate = `${year}${month}${day}`;
          
          expect(ticketNumber.substring(3, 11)).toBe(expectedDate);
          
          // Verify sequence component
          const expectedSequence = sequence.toString().padStart(6, '0');
          expect(ticketNumber.substring(11)).toBe(expectedSequence);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29.3: Same date with different sequences produces different tickets
   */
  test('Property 29.3: Different sequences on same date produce unique tickets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.array(fc.integer({ min: 1, max: 999999 }), { minLength: 2, maxLength: 50 }),
        async (date, sequences) => {
          // Ensure sequences are unique
          const uniqueSequences = Array.from(new Set(sequences));
          fc.pre(uniqueSequences.length >= 2);

          const ticketNumbers = uniqueSequences.map(seq => 
            generateTicketNumber(date, seq)
          );

          // Property: All tickets should be unique even on same date
          const uniqueTickets = new Set(ticketNumbers);
          expect(uniqueTickets.size).toBe(uniqueSequences.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29.4: Different dates with same sequence produces different tickets
   */
  test('Property 29.4: Same sequence on different dates produce unique tickets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          { minLength: 2, maxLength: 50 }
        ),
        fc.integer({ min: 1, max: 999999 }),
        async (dates, sequence) => {
          // Ensure dates are unique (by day)
          const uniqueDates = Array.from(
            new Set(dates.map(d => d.toISOString().split('T')[0]))
          ).map(dateStr => new Date(dateStr));
          
          fc.pre(uniqueDates.length >= 2);

          const ticketNumbers = uniqueDates.map(date => 
            generateTicketNumber(date, sequence)
          );

          // Property: All tickets should be unique even with same sequence
          const uniqueTickets = new Set(ticketNumbers);
          expect(uniqueTickets.size).toBe(uniqueDates.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29.5: Sequence padding is consistent
   */
  test('Property 29.5: Sequence numbers are always 6 digits with leading zeros', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }), // Reasonable year range
        fc.integer({ min: 1, max: 999999 }),
        async (date, sequence) => {
          const ticketNumber = generateTicketNumber(date, sequence);
          
          // Extract sequence part (last 6 characters)
          const sequencePart = ticketNumber.substring(11);
          
          // Property: Sequence should always be 6 digits
          expect(sequencePart).toHaveLength(6);
          expect(sequencePart).toMatch(/^\d{6}$/);
          
          // Property: Leading zeros should be preserved
          if (sequence < 10) {
            expect(sequencePart).toMatch(/^00000\d$/);
          } else if (sequence < 100) {
            expect(sequencePart).toMatch(/^0000\d{2}$/);
          } else if (sequence < 1000) {
            expect(sequencePart).toMatch(/^000\d{3}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29.6: Ticket numbers are sortable chronologically
   */
  test('Property 29.6: Ticket numbers maintain chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            sequence: fc.integer({ min: 1, max: 999999 })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        async (grievances) => {
          // Normalize dates to day precision (remove time component)
          const normalized = grievances.map(g => ({
            date: new Date(g.date.toISOString().split('T')[0]),
            sequence: g.sequence
          }));

          // Sort by date and sequence
          const sorted = [...normalized].sort((a, b) => {
            const dateDiff = a.date.getTime() - b.date.getTime();
            if (dateDiff !== 0) return dateDiff;
            return a.sequence - b.sequence;
          });

          const ticketNumbers = sorted.map(g => 
            generateTicketNumber(g.date, g.sequence)
          );

          // Property: Ticket numbers should be in lexicographic order
          const sortedTickets = [...ticketNumbers].sort();
          expect(ticketNumbers).toEqual(sortedTickets);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29.7: Maximum sequence number is handled correctly
   */
  test('Property 29.7: Maximum sequence number (999999) is valid', () => {
    const date = new Date('2024-02-28');
    const maxSequence = 999999;
    
    const ticketNumber = generateTicketNumber(date, maxSequence);
    
    expect(ticketNumber).toBe('GRV20240228999999');
    expect(ticketNumber).toHaveLength(17); // GRV(3) + YYYYMMDD(8) + 6-digit(6)
  });

  /**
   * Property 29.8: Minimum sequence number is handled correctly
   */
  test('Property 29.8: Minimum sequence number (1) is valid', () => {
    const date = new Date('2024-02-28');
    const minSequence = 1;
    
    const ticketNumber = generateTicketNumber(date, minSequence);
    
    expect(ticketNumber).toBe('GRV20240228000001');
    expect(ticketNumber).toHaveLength(17);
  });

  /**
   * Property 29.9: Leap year dates are handled correctly
   */
  test('Property 29.9: Leap year dates produce valid tickets', () => {
    const leapYearDate = new Date('2024-02-29'); // 2024 is a leap year
    const sequence = 123;
    
    const ticketNumber = generateTicketNumber(leapYearDate, sequence);
    
    expect(ticketNumber).toBe('GRV20240229000123');
  });

  /**
   * Property 29.10: Year boundaries are handled correctly
   */
  test('Property 29.10: Year boundaries produce unique tickets', () => {
    const lastDayOfYear = new Date('2024-12-31');
    const firstDayOfYear = new Date('2025-01-01');
    const sequence = 1;
    
    const ticket2024 = generateTicketNumber(lastDayOfYear, sequence);
    const ticket2025 = generateTicketNumber(firstDayOfYear, sequence);
    
    expect(ticket2024).toBe('GRV20241231000001');
    expect(ticket2025).toBe('GRV20250101000001');
    expect(ticket2024).not.toBe(ticket2025);
  });
});

/**
 * Helper function to generate ticket number
 * Mimics the database trigger logic: GRV + YYYYMMDD + 6-digit sequence
 */
function generateTicketNumber(date: Date, sequence: number): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const seq = sequence.toString().padStart(6, '0');
  
  return `GRV${year}${month}${day}${seq}`;
}
