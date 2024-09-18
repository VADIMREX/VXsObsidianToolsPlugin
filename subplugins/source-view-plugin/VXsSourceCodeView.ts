import VXsSourceViewPlugin from "subplugins/source-view-plugin/VXsSourceViewPlugin";
import VXsToolsPlugin from "VXsToolsPlugin";
import { TextFileView, View, WorkspaceLeaf } from "obsidian";

import libs, { 
    EditorView, basicSetup, 
    javascript,
    go,
    sql,
    markdown,
    oneDark,
} from "vendor";

let { EditorState } = libs["@codemirror"].state;
let { search } = libs["@codemirror"].search;

export const VIEW_TYPE_SOURCECODE = "sourcecode";

export default class VXsSourceCodeView extends TextFileView {
    plugin: VXsSourceViewPlugin;
    editorEl: HTMLDivElement;
    editor: EditorView;

    constructor(leaf: WorkspaceLeaf, plugin: VXsSourceViewPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    newEditor(data: string, lang?: string): void {
        if (this.editor) this.editor.destroy();

        let langSupport;
        switch(lang) {
            case "js":
                langSupport = javascript();
                break;
            case "go":
                langSupport = go();
                break;
            case "sql":
                langSupport = sql();
                break;
            default:
                langSupport = markdown();
                break;
        }

        this.editorEl = this.editorEl || this.contentEl.createDiv("markdown-source-view mod-cm5");
        this.editor = new EditorView({
            doc: data,
            extensions: [
                basicSetup,
                langSupport,
                oneDark, 
                search()
            ],
            parent: this.editorEl
        });
        // some kostyls, todo: move to CSS
        this.editorEl.style.fontFamily = "Consolas";
        this.editorEl.style.padding = "0px";
        this.editor.dom.style.height = "100%";
    }

    /** @override */
    onload(): void {
        super.onload();
        this.newEditor("");
    }
    /** @override */
    getViewData(): string {
        return this.editor.state.doc.toString()
    }
    /** @override */
    setViewData(data: string, clear: boolean): void {
        if (clear) {
            let lang;
            if (!this.file) lang = undefined;
            else switch(this.file.extension) {
                case "js": 
                    lang = "js";
                    break;
                case "mod": 
                case "go": 
                    lang = "go";
                    break;
                case "sql": 
                    lang = "sql";
                    break;
                default:
                    lang = this.plugin.customLanguageMapping[this.file.extension];
                break;
            }
            return this.newEditor(data, lang);
        }

        const state = this.editor.state;
        const changes = {changes: {from: 0, to: state.doc.length, insert: data}};
        const tran = state.update(changes);
        this.editor.update([tran]);
    }
    /** @override */
    clear(): void {
        this.editor.destroy();
        this.newEditor("");
    }
    /** @override */
    getViewType(): string {
        return VIEW_TYPE_SOURCECODE;
    }
    /** @override */
    async onClose(): Promise<void> {
        return await super.onClose();
    }
}