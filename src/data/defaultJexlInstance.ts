// SPDX-License-Identifier: LGPL-3.0-only
// Copyright (c) 2026 Chris Carrington
import {Jexl} from "@pawel-up/jexl";
import {DateTime} from "luxon";
import {parseSmartDate} from "../inference/parseSmartDate";

function buildJexlInstance() {
    const jexl = new Jexl();
    jexl.addFunction('parseSmartDate', (input: string, anchorDateString: string, businessHourBias?: boolean) => {
        const anchorDate = DateTime.fromISO(anchorDateString);
        return parseSmartDate(input, anchorDate, businessHourBias);
    });

    jexl.addFunction('formatDate', (isoDate: string, format: string) =>
        (DateTime.fromISO(isoDate, {setZone: true}).toFormat(format)));

    jexl.addFunction('getSpokenDate', (isoDate: string, includeDayOfWeek?: boolean, locale?: string) => {
        const date = DateTime.fromISO(isoDate, {setZone: true});
        if (includeDayOfWeek) {
            return date.toLocaleString(DateTime.DATE_HUGE, {locale: locale ?? 'en-US'});
        } else {
            return date.toLocaleString(DateTime.DATE_FULL, {locale: locale ?? 'en-US'});
        }
    });

    jexl.addFunction('getSpokenTime', (isoTime: string, locale?: string) => {
        const time = DateTime.fromISO(isoTime, {setZone: true});
        return time.toLocaleString(DateTime.TIME_SIMPLE, {locale: locale ?? 'en-US'});
    })

    return jexl;

}

export const defaultJexlInstance = buildJexlInstance();
