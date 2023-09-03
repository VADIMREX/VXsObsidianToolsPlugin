import VXsToolsPlugin from "VXsToolsPlugin";
import { TextFileView, View, WorkspaceLeaf } from "obsidian";

import * as vendor from "vendor";

const { EditorView, basicSetup } = vendor.default.codemirror;
const { javascript } = vendor.default["@codemirror"]["lang-javascript"];
const { oneDark } = vendor.default["@codemirror"]["theme-one-dark"];

export const VIEW_TYPE_SOURCECODE = "sourcecode";

export default class VXsSourceCodeView extends TextFileView {
    plugin: VXsToolsPlugin;
    editorEl: HTMLDivElement;
    editor: EditorView;

    constructor(leaf: WorkspaceLeaf, plugin: VXsToolsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    newEditor(): void {
        this.editorEl = this.contentEl.createDiv("markdown-source-view mod-cm5");
        this.editor = new EditorView({
            extensions: [
                basicSetup,
                javascript(),
                oneDark
            ],
            parent: this.editorEl
        });
        this.editorEl.style.fontFamily = "Consolas";
        this.editor.dom.style.height = "100%";
    }

    onload(): void {
        super.onload();

        this.newEditor();
    }

    getViewData(): string {
        return this.data;//this.editor.state.doc.text
    }

    setViewData(data: string, clear: boolean): void {
        let spec: any = {
            changes: {
                from: 0,
                insert: data
            }
        };
        let tran = this.editor.state.update(spec);
        this.editor.update([tran]);
    }

    clear(): void {
        this.editor.destroy();

        this.newEditor();
    }

    getViewType(): string {
        return VIEW_TYPE_SOURCECODE;
    }

    async onClose(): Promise<void> {
        return await super.onClose();
    }
}