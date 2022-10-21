import { DateTime } from "luxon";

export const toCurrency = (str) => {
    const num = Number(str);
    return num.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
};

export const toDateTime = (str) => {
    return DateTime.fromISO(str).toLocaleString(DateTime.DATETIME_MED);
};
