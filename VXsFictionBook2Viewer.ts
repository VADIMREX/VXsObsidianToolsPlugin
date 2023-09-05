import VXsToolsPlugin from "VXsToolsPlugin";
import { FileView, View, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_FICTIONBOOK2 = "fictionbook2";

export default class VXsFictionBook2View extends FileView {
    plugin: VXsToolsPlugin;
    editorEl: HTMLDivElement;

    constructor(leaf: WorkspaceLeaf, plugin: VXsToolsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    /** @override */
    getViewType(): string {
        return VIEW_TYPE_FICTIONBOOK2;
    }
}