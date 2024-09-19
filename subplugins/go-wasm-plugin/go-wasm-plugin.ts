import { App, Editor, FuzzySuggestModal, Notice, Plugin, PluginManifest, TFile, TFolder, arrayBufferToBase64, normalizePath } from "obsidian";

import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";
import VXsProxyPlugin from "subplugins/VXsProxyPlugin";

import { pluginRoot } from 'VXsToolsPluginConsts';

import { Go } from "./wasm-exec";

export default class GoWasmPlugin extends VXsProxyPlugin {
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
        this.addCommand({
            id: 'vxs-tools-plugin-wasm-test',
            name: "VX's WASM test",
            callback: async () => {
                let go = new Go(this.app);
                try {
                    var read = await this.app.vault.adapter.readBinary("usr/local/bin/go")
					let result = await WebAssembly.instantiate(read, go.importObject)
                    //let result = await WebAssembly.instantiateStreaming(fetch("go"), go.importObject)
                    //mod = result.module;
                    let inst = result.instance;
                    await go.run(inst);
                    //inst = await WebAssembly.instantiate(mod, go.importObject); // reset instance
                }catch(err) {
                    console.error(err);
                }       
            }
        })
    }
}