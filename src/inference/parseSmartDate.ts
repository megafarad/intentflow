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

export type EmptyParseResult = {}

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

function parseSmartTime(input: string, anchorDate: DateTime, businessHourBias?: boolean): ParsedTime | undefined {
    const replacedSpokenNumbers = input.replace('one', '1')
        .replace('two', '2')
        .replace('three', '3')
        .replace('four', '4')
        .replace('five', '5')
        .replace('six', '6')
        .replace('seven', '7')
        .replace('eight', '8')
        .replace('nine', '9')
        .replace('ten', '10')
        .replace('eleven', '11')
        .replace('twelve', '12');

    if (replacedSpokenNumbers.includes('morning') && !replacedSpokenNumbers.match(/[0-9]/)) {
        return {
            fromTime: '00:00',
            toTime: '12:00'
        }
    } else if (replacedSpokenNumbers.includes('afternoon') && !replacedSpokenNumbers.match(/[0-9]/)) {
        return {
            fromTime: '12:00',
            toTime: '18:00'
        }
    } else if (replacedSpokenNumbers.includes('evening') && !replacedSpokenNumbers.match(/[0-9]/)) {
        return {
            fromTime: '18:00',
            toTime: '00:00'
        }
    } else if (replacedSpokenNumbers.includes('after') && !replacedSpokenNumbers.includes('afternoon')) {
        const timePart = replacedSpokenNumbers.split('after')[1];
        const parsed = chrono.parse(`at ${timePart}`, {
            instant: anchorDate.toJSDate()
        });
        if (parsed.length > 0) {
            const start = parsed[0].start.date();
            const startDateTime = DateTime.fromJSDate(start);
            const startDateTimeWithBias = businessHourBias ? resolveBusinessHourBias(startDateTime) : startDateTime;
            if (startDateTimeWithBias.toISOTime()) {
                return {
                    fromTime: startDateTimeWithBias.toFormat('HH:mm'),
                    toTime: startDateTimeWithBias.endOf('day').toFormat('HH:mm')
                }
            }
        }
    } else if (replacedSpokenNumbers.includes('before')) {
        const timePart = replacedSpokenNumbers.split('before')[1];
        const parsed = chrono.parse(`at ${timePart}`, {
            instant: anchorDate.toJSDate()
        });
        if (parsed.length > 0) {
            const end = parsed[0].start.date();
            const endDateTime = DateTime.fromJSDate(end);
            const endDateTimeWithBias = businessHourBias ? resolveBusinessHourBias(endDateTime) : endDateTime;
            if (endDateTimeWithBias.toISOTime()) {
                return {
                    fromTime: endDateTimeWithBias.startOf('day').toFormat('HH:mm'),
                    toTime: endDateTimeWithBias.toFormat('HH:mm')
                }
            }
        }
    } else if (replacedSpokenNumbers.includes('between')) {
        const timeParts = replacedSpokenNumbers.split('between')[1].split('and');
        const parsedStart = chrono.parse(`at ${timeParts[0]}`, {
            instant: anchorDate.toJSDate()
        });
        const parsedEnd = chrono.parse(`at ${timeParts[1]}`, {
            instant: anchorDate.toJSDate()
        });
        if (parsedStart.length > 0 && parsedEnd.length > 0) {
            const start = parsedStart[0].start.date();
            const startDateTime = DateTime.fromJSDate(start);
            const startDateTimeWithBias = businessHourBias ? resolveBusinessHourBias(startDateTime) : startDateTime;
            const end = parsedEnd[0].start.date();
            const endDateTime = DateTime.fromJSDate(end);
            const endDateTimeWithBias = businessHourBias ? resolveBusinessHourBias(endDateTime) : endDateTime;
            if (startDateTimeWithBias.toISOTime() && endDateTimeWithBias.toISOTime()) {
                return {
                    fromTime: startDateTimeWithBias.toFormat('HH:mm'),
                    toTime: endDateTimeWithBias.toFormat('HH:mm')
                }
            }
        }
    } else {
        const parsed = chrono.parse(replacedSpokenNumbers, {
            instant: anchorDate.toJSDate()
        });
        if (parsed.length > 0) {
            const start = parsed[0].start.date();
            const startDateTime = DateTime.fromJSDate(start);
            const startDateTimeWithBias = businessHourBias ? resolveBusinessHourBias(startDateTime) : startDateTime;
            const end = parsed[0].end?.date();
            if (end) {
                const endDateTime = DateTime.fromJSDate(end);
                const endDateTimeWithBias = businessHourBias ? resolveBusinessHourBias(endDateTime) : endDateTime;
                if (startDateTimeWithBias.toISOTime() && endDateTimeWithBias.toISOTime()) {
                    return {
                        fromTime: startDateTimeWithBias.toFormat('HH:mm'),
                        toTime: endDateTimeWithBias.toFormat('HH:mm')
                    }
                } else {
                    return undefined;
                }
            } else {
                if (startDateTimeWithBias.toISOTime()) {
                    return startDateTimeWithBias.toFormat('HH:mm');
                } else {
                    return undefined;
                }
            }
        } else {
            return undefined;
        }
    }
}

function resolveBusinessHourBias(dateTime: DateTime) {
    if (dateTime.hour < 6) {
        return dateTime.plus({hours: 12});
    } else if (dateTime.hour > 17) {
        return dateTime.plus({hours: -12});
    } else {
        return dateTime;
    }
}

export function parseSmartDate(input: string, anchorDate: DateTime, businessHourBias?: boolean): ParseResult {
    const lower = input.toLowerCase();

    //0. Get time range
    const timeRange = parseSmartTime(input, anchorDate, businessHourBias);

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
        const parsed = chrono.parse(`${monthName} 1`, {
            instant: anchorDate.toJSDate()
        });

        if (parsed.length > 0) {
            const firstDay = DateTime.fromJSDate(parsed[0].start.date());
            const lastDay = firstDay.endOf('month');
            return {
                fromDate: toISOString(firstDay),
                toDate: toISOString(lastDay),
                time: timeRange
            }
        }
    }

    //3. Default chrono parsing (with forward bias)

    const results = chrono.parse(input, {
        instant: anchorDate.toJSDate()
    }, {forwardDate: true});
    if (results.length > 0) {
        const start = DateTime.fromJSDate(results[0].start.date());
        const end = results[0].end?.date() ?
            DateTime.fromJSDate(results[0].end.date()) : undefined;
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

    return {}
}
