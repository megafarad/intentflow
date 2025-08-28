import Jexl from 'jexl';
import {DateTime} from "luxon";
import {parseSmartDate} from "../inference/parseSmartDate";

function buildJexlInstance() {
    Jexl.addFunction('parseSmartDate', (input: string, anchorDateString: string, businessHourBias?: boolean) => {
        const anchorDate = DateTime.fromISO(anchorDateString);
        return parseSmartDate(input, anchorDate, businessHourBias);
    });

    Jexl.addFunction('getSpokenDate', (isoDate: string, includeDayOfWeek?: boolean, locale?: string) => {
        const date = DateTime.fromISO(isoDate);
        if (includeDayOfWeek) {
            return date.toLocaleString(DateTime.DATE_FULL, {locale: locale ?? 'en-US'});
        } else {
            return date.toLocaleString(DateTime.DATE_HUGE, {locale: locale ?? 'en-US'});
        }
    });

    Jexl.addFunction('getSpokenTime', (isoTime: string, locale?: string) => {
        const time = DateTime.fromISO(isoTime);
        return time.toLocaleString(DateTime.TIME_SIMPLE, {locale: locale ?? 'en-US'});
    })

    return Jexl;
}

export const jexlInstance = buildJexlInstance();