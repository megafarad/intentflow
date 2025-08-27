import {DateTime} from 'luxon';
import {parseSmartDate} from '../src/inference/parseSmartDate';

const anchorDate = DateTime.fromISO('2025-08-01');

describe('parseSmartDate', () => {
    it('should parse next week', () => {
        const result = parseSmartDate('next week', anchorDate, true);
        expect(result).toEqual({
            fromDate: '2025-08-03',
            toDate: '2025-08-10',
            time: '12:00'
        })
    });

    it('should parse next week with mornings', () => {
        const result = parseSmartDate('next week in the mornings', anchorDate, true);
        expect(result).toEqual({
            fromDate: '2025-08-03',
            toDate: '2025-08-10',
            time: {
                fromTime: '00:00',
                toTime: '12:00'
            }
        })
    });

    it('should parse next week with afternoons', () => {
        const result = parseSmartDate('next week in the afternoons', anchorDate, true);
        expect(result).toEqual({
            fromDate: '2025-08-03',
            toDate: '2025-08-10',
            time: {
                fromTime: '12:00',
                toTime: '18:00'
            }
        })
    });

    it('should parse next week with evenings', () => {
        const result = parseSmartDate('next week in the evenings', anchorDate, true);
        expect(result).toEqual({
            fromDate: '2025-08-03',
            toDate: '2025-08-10',
            time: {
                fromTime: '18:00',
                toTime: '00:00'
            }
        })
        expect(result).toEqual({
            fromDate: '2025-08-03',
            toDate: '2025-08-10',
            time: {
                fromTime: '18:00',
                toTime: '00:00'
            }
        });
    });

    it('should parse a time', () => {
        const result = parseSmartDate('Friday at two in the afternoon', anchorDate, true);
        expect(result).toEqual({
            date: '2025-08-01',
            time: '14:00'
        })
    });

    it('should apply business hours bias', () => {
        const parsedAfternoon = parseSmartDate('Friday at two', anchorDate, true);
        expect(parsedAfternoon).toEqual({
            date: '2025-08-01',
            time: '14:00'
        });
        const parsedMorning = parseSmartDate('Friday at two', anchorDate, false);
        expect(parsedMorning).toEqual({
            date: '2025-08-01',
            time: '02:00'
        });
    });

    it('parse a time range', () => {
        const result = parseSmartDate('Friday between two and four', anchorDate, true);
        expect(result).toEqual({
            date: '2025-08-01',
            time: {
                fromTime: '14:00',
                toTime: '16:00'
            }
        });
    });

    it('parse a time range with morning', () => {
        const result = parseSmartDate('Friday after two', anchorDate, true);
        expect(result).toEqual({
            date: '2025-08-01',
            time: {
                fromTime: '14:00',
                toTime: '23:59'
            }
        });
    });

});