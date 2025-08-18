import * as chrono from "chrono-node";

describe("chrono", () => {
    it("should parse dates", () => {
        const anchorDate = new Date('2025-08-08');
        const input = 'Can we do it Monday at 4 PM?';
        const parsed = chrono.parse(input, anchorDate, {forwardDate: true});
        console.log(parsed[0].start.date());
        console.log(parsed[0].end?.date());
        console.log(parsed[0].text);
    });
})