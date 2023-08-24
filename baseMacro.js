/// <reference path="./node_modules/obsidian/obsidian.d.ts" />

/** 
 * @typedef {(this:any, options:{ pattern: string, editor: Editor, file: TFile, template: string }, args: string[])} VXsTemplateMacro
 * 
 */

/** @type {VXsTemplateMacro} */
function title(options, args) {
    return options.file?.basename ?? "";
}

/** @type {VXsTemplateMacro} */
function moment(options, args) {
    let moment = window.moment;
    let now = moment();

    /** {{moment}} */
    if (0 == args.length) return now.format();

    /** {{moment|<format>}} */
    if (1 == args.length) return now.format(args[0]);

    /** {{moment|...|...}} */
    let locale = moment.locale();
    /** {{moment|<locale>|...}} */
    if (locale == args[0] || args[0] == moment.locale(args[0])) {
        now = moment();
        let result = "";

        /** {{moment|<locale>|<format>}} */
        if (isNaN(+args[1]))
            result = now.format(args.slice(1).join("|"));
        /** {{moment|<locale>|<number>}} */
        else if (2 == args.length) {
            now.add(+args[1], 'days');
            result = now.format(args[2]);
        }
        /** {{moment|<locale>|<number>|<format>}} */
        else if (![
            "year", "years", "y",
            "month", "months", "M",
            "week", "weeks", "w",
            "day", "days", "d",
            "hour", "hours", "h",
            "minute", "minutes", "m",
            "second", "seconds", "s",
            "millisecond", "milliseconds", "ms",
            "quarter", "quarters", "Q"
        ].contains(args[2])) {
            now.add(+args[1], 'days');
            result = now.format(args.slice(2).join("|"));
        }
        /** {{moment|<locale>|<number>|<unit>}} */
        else if (3 == args.length) {
            now.add(+args[1], args[2]);
            result = now.format();
        }
        /** {{moment|<locale>|<number>|<unit>|<format>}} */
        else {
            now.add(+args[1], args[2]);
            result = now.format(args.slice(3).join("|"));
        }

        moment.locale(locale);
        return result;
    }

    /** {{moment|<format>}} */
    return now.format(args.slice(1).join("|"));
}

/**
 * @param {string} pattern 
 */
function dateOrTime(pattern) {
    let n = {
        dateFormat: undefined,
        timeFormat: undefined,
    }
    let a = window.moment();
    let Fj = "YYYY-MM-DD";
    let Bj = "HH:mm";
    
    pattern = pattern.substring(2, pattern.length - 2);
    let t = pattern;
    let i = undefined;
    let delim = pattern.indexOf(":");
    if (delim > -1) {
        t = pattern.substring(2, delim);
        i = pattern.substring(delim + 1);
    }
    return i ? a.format(i) : "date" === t.toLowerCase() ? a.format(n && n.dateFormat || Fj) : a.format(n && n.timeFormat || Bj);
}

/** @type {VXsTemplateMacro} */
function _default(options, args) {
    if (["date", "time"].contains(options.pattern.substring(2, 6))) return dateOrTime(options.pattern);
    return undefined;
}

export {
    title,
    moment,
    _default
}