import * as chrono from "chrono-node";

export interface ParsedSingleTime {
    time: string;
}

export interface ParsedTimeRange {
    fromTime: string;
    toTime: string;
}

export type ParsedTime = ParsedSingleTime | ParsedTimeRange;

export interface ParsedDateTime {
    date: string;
    time: ParsedTime;
}

export interface ParsedDateTimeRange {
    fromDate: string;
    toDate: string;
    time: ParsedTime;
}

export type EmptyParseResult = { }

export type ParseResult = ParsedDateTime | ParsedDateTimeRange | EmptyParseResult;

function nextSunday(from: Date): Date {
    const result = new Date(from);
    const day = result.getDay();
    const daysToAdd = (7 - day) % 7 || 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
}

function toISOString(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function parseSmartTime(input: string, anchorDate: Date): ParsedTime {
    throw new Error('Not implemented');
}

export function parseSmartDate(input: string, anchorDate: Date): ParseResult {
    const lower = input.toLowerCase();

    //0. Get time range



    //1. Custom rule: the following week
    if (lower.includes('next week') || lower.includes('the following week')) {
        const start = nextSunday(anchorDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return {
            fromDate: toISOString(start),
            toDate: toISOString(end),
        }
    }

    //2. Custom rule: vague month name - return month range
    const monthMatch = lower.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
    if (monthMatch) {
        const monthName = monthMatch[1];
        const parsed = chrono.parse(`${monthName} 1`, anchorDate);

        if (parsed.length > 0) {
            const firstDay = parsed[0].start.date();
            const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
        }
    }
    return { }
}
