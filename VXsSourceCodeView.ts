import VXsToolsPlugin from "VXsToolsPlugin";
import { TextFileView, View, WorkspaceLeaf } from "obsidian";

import libs, { 
    EditorView, basicSetup, 
    javascript, 
    oneDark,
} from "vendor";

let { EditorState } = libs["@codemirror"].state;
let { search } = libs["@codemirror"].search;

export const VIEW_TYPE_SOURCECODE = "sourcecode";

export default class VXsSourceCodeView extends TextFileView {
    plugin: VXsToolsPlugin;
    editorEl: HTMLDivElement;
    editor: EditorView;

    constructor(leaf: WorkspaceLeaf, plugin: VXsToolsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    newEditor(data: string): void {
        if (this.editor) this.editor.destroy();

        this.editorEl = this.editorEl || this.contentEl.createDiv("markdown-source-view mod-cm5");
        this.editor = new EditorView({
            doc: data,
            extensions: [
                basicSetup,
                javascript(),
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
        if (clear) 
            return this.newEditor(data);

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