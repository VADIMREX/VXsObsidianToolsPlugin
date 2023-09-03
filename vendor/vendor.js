import * as codemirror from 'codemirror';
import * as _codemirror_langJavascript from '@codemirror/lang-javascript';
import * as _codemirror_themeOneDark from '@codemirror/theme-one-dark';

import { EditorView, basicSetup } from 'codemirror';
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";

const libs = {
    "codemirror": codemirror,
    "@codemirror": {
        "lang-javascript": _codemirror_langJavascript,
        "theme-one-dark": _codemirror_themeOneDark
    }
};

export default libs;

export {
    EditorView,
    basicSetup,
    javascript,
    oneDark 
};