import { App, Editor, FuzzySuggestModal, Notice, Plugin, PluginManifest, TFile, TFolder, arrayBufferToBase64, normalizePath } from "obsidian";

import VXsProxyPlugin from "subplugins/VXsProxyPlugin";
import VXsSourceCodeView, { VIEW_TYPE_SOURCECODE } from "subplugins/source-view-plugin/VXsSourceCodeView";
import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";

export default class VXsSourceViewPlugin extends VXsProxyPlugin {
    settings: VXsToolsPluginSettings;
    locale: VXsToolsPluginLocale;

    public customLanguageMapping: { [key: string]: string };

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
        this.customLanguageMapping = {};
    }

    onload() {
        this.registerView(VIEW_TYPE_SOURCECODE, s => new VXsSourceCodeView(s, this));

        this.registerExtensions(["js", "sql"], VIEW_TYPE_SOURCECODE);

        for (let el of this.settings.fileExtensionLanguageMapping.split(';')) {
            let [extension, language] = el.split('=');
            if (!extension || !language) continue;
            this.customLanguageMapping[extension] = language;

            this.registerExtensions([extension], VIEW_TYPE_SOURCECODE);
        }
    }

    onunload() {

    }
}