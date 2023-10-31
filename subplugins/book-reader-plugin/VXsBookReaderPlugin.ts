import { App, Editor, FuzzySuggestModal, Notice, Plugin, PluginManifest, TFile, TFolder, arrayBufferToBase64, normalizePath } from "obsidian";
import VXsFictionBook2View, { VIEW_TYPE_FICTIONBOOK2 } from "subplugins/book-reader-plugin/VXsFictionBook2Viewer";

import VXsProxyPlugin from "subplugins/VXsProxyPlugin";
import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";

export default class VXsBookReaderPlugin extends VXsProxyPlugin {
    settings: VXsToolsPluginSettings;
    locale: VXsToolsPluginLocale;

    constructor(app: App, manifest: PluginManifest) //{ // for future splitting
    //     super(app, manifest);
    // }
    constructor(basePlugin: Plugin)
    constructor(appOrPlugin: App | Plugin, manifest?: PluginManifest) {
        if (appOrPlugin instanceof App)
            super(appOrPlugin, manifest as PluginManifest);
        else {
            super(appOrPlugin);
        }
    }

    onload() {
        this.registerView(VIEW_TYPE_FICTIONBOOK2, s => new VXsFictionBook2View(s, this));
		this.registerExtensions(["fb2"], VIEW_TYPE_FICTIONBOOK2);
    }

    onunload() {

    }
}