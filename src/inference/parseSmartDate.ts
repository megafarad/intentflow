import * as chrono from 'chrono-node';
import {DateTime} from 'luxon';

export type ParsedSingleTime = string;

export interface ParsedTimeRange {
    fromTime: string;
    toTime: string;
}

export type ParsedTime = ParsedSingleTime | ParsedTimeRange;

export interface ParsedDateTime {
    date: string;
    time?: ParsedTime;
}

export interface ParsedDateTimeRange {
    fromDate: string;
    toDate: string;
    time?: ParsedTime;
}

export type EmptyParseResult = { }

export type ParseResult = ParsedDateTime | ParsedDateTimeRange | EmptyParseResult;

function nextSunday(from: DateTime): DateTime {
    const fromDate = from.toJSDate();
    const result = new Date(fromDate);
    const day = result.getDay();
    const daysToAdd = (7 - day) % 7 || 7;
    result.setDate(result.getDate() + daysToAdd);
    return DateTime.fromJSDate(result);
}

function toISOString(date: DateTime): string | undefined {
    return date.toISODate()?.slice(0, 10);
}

function parseSmartTime(input: string, anchorDate: DateTime): ParsedTime | undefined {
    if (input.includes('morning')) {
        return {
            fromTime: '00:00',
            toTime: '12:00'
        }
    } else if (input.includes('afternoon')) {
        return {
            fromTime: '12:00',
            toTime: '18:00'
        }
    } else if (input.includes('evening')) {
        return {
            fromTime: '18:00',
            toTime: '00:00'
        }
    } else {
        const parsed = chrono.parse(input, anchorDate.toJSDate());
        if (parsed.length > 0) {
            const start = parsed[0].start.date();
            const startDateTime = DateTime.fromJSDate(start, {zone: anchorDate.zone});
            const end = parsed[0].end?.date();
            if (end) {
                const endDateTime= DateTime.fromJSDate(end, {zone: anchorDate.zone});
                if (startDateTime.toISOTime() && endDateTime.toISOTime()) {
                    return {
                        fromTime: startDateTime.toLocaleString(DateTime.TIME_24_SIMPLE),
                        toTime: endDateTime.toLocaleString(DateTime.TIME_24_SIMPLE)
                    }
                } else {
                    return undefined;
                }
            } else {
                const startDateTime = DateTime.fromJSDate(start, {zone: anchorDate.zone});
                if (startDateTime.toISOTime()) {
                    return startDateTime.toLocaleString(DateTime.TIME_24_SIMPLE);
                } else {
                    return undefined;
                }
            }
        } else {
            return undefined;
        }
    }
}

export function parseSmartDate(input: string, anchorDate: DateTime): ParseResult {
    const lower = input.toLowerCase();

    //0. Get time range
    const timeRange = parseSmartTime(input, anchorDate);

    //1. Custom rule: the following week
    if (lower.includes('next week') || lower.includes('the following week')) {
        const start = nextSunday(anchorDate);
        const end = start.plus({weeks: 1});
        return {
            fromDate: toISOString(start),
            toDate: toISOString(end),
            time: timeRange
        }
    }

    //2. Custom rule: vague month name - return month range
    const monthMatch = lower.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
    if (monthMatch) {
        const monthName = monthMatch[1];
        const parsed = chrono.parse(`${monthName} 1`, anchorDate.toJSDate());

        if (parsed.length > 0) {
            const firstDay = DateTime.fromJSDate(parsed[0].start.date(), {zone: anchorDate.zone});
            const lastDay = firstDay.endOf('month');
            return {
                fromDate: toISOString(firstDay),
                toDate: toISOString(lastDay),
                time: timeRange
            }
        }
    }

    //3. Default chrono parsing (with forward bias)
    const results = chrono.parse(input, anchorDate.toJSDate(), {forwardDate: true});
    if (results.length > 0) {
        const start = DateTime.fromJSDate(results[0].start.date(), {zone: anchorDate.zone});
        const end =  results[0].end?.date() ?
            DateTime.fromJSDate(results[0].end.date(), {zone: anchorDate.zone}) : undefined;
        if (start && end) {
            return {
                fromDate: toISOString(start),
                toDate: toISOString(end),
                time: timeRange
            }
        } else if (start) {
            return {
                date: toISOString(start),
                time: timeRange
            }
        }
    }

    return { }
}
