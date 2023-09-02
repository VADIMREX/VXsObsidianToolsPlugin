import VXsToolsPlugin from "VXsToolsPlugin";
import { TextFileView, View, WorkspaceLeaf } from "obsidian";

import { EditorView, basicSetup } from "codemirror-local";
import { javascript } from "@codemirror-local/lang-javascript";
import { oneDark } from "@codemirror-local/theme-one-dark/dist";

// import { Extension, StateField } from '@codemirror/state';
// import { EditorView, ViewPlugin } from '@codemirror/view';
// import * as CodeMirror from 'codemirror';

export const VIEW_TYPE_SOURCECODE = "sourcecode";

export default class VXsSourceCodeView extends TextFileView {
    plugin: VXsToolsPlugin;
    editor: EditorView;

    constructor(leaf: WorkspaceLeaf, plugin: VXsToolsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    newEditor(): void {
        this.editor = new EditorView({
            extensions: [
                basicSetup,
                javascript(),
                oneDark
            ],
            parent: this.contentEl
        });
        this.editor.contentDOM.style.fontFamily = "Consolas";
        this.editor.dom.style.fontFamily = "Consolas";
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