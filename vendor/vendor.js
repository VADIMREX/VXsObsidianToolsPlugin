import * as codemirror from 'codemirror';
import * as _codemirror_autocomplete from "@codemirror/autocomplete";
import * as _codemirror_commands from "@codemirror/commands";
import * as _codemirror_langJavascript from '@codemirror/lang-javascript'; 
import * as _codemirror_langGo from '@codemirror/lang-go'; 
import * as _codemirror_language from "@codemirror/language";
import * as _codemirror_lint from "@codemirror/lint";
import * as _codemirror_ssearch from "@codemirror/search";
import * as _codemirror_state from "@codemirror/state";
import * as _codemirror_themeOneDark from '@codemirror/theme-one-dark';
import * as _codemirror_view from "@codemirror/view";

import { EditorView, basicSetup } from 'codemirror';
import { javascript } from "@codemirror/lang-javascript";
import { go } from "@codemirror/lang-go";
import { sql } from "@codemirror/lang-sql";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

const libs = {
    "codemirror": codemirror,
    "@codemirror": {
        "autocomplete": _codemirror_autocomplete,
        "commands": _codemirror_commands,
        'lang-javascript': _codemirror_langJavascript,
        'lang-go': _codemirror_langGo,
        "language": _codemirror_language,
        "lint": _codemirror_lint,
        "search": _codemirror_ssearch,
        "state": _codemirror_state,
        'theme-one-dark': _codemirror_themeOneDark,
        "view": _codemirror_view,
    }
};

export default libs;

export {
    EditorView,
    basicSetup,
    javascript,
    go,
    sql,
    markdown,
    oneDark 
};