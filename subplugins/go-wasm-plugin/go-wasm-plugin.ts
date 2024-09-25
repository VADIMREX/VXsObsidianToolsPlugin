import { App, Modal, Setting, Plugin, PluginManifest } from "obsidian";

import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";
import VXsProxyPlugin from "subplugins/VXsProxyPlugin";

import { pluginRoot } from 'VXsToolsPluginConsts';

import { Go, FS } from "./wasm_exec";

class PickGoWasmModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        let cwd = "usr/local/bin"
        let exeutable = "usr/local/bin/go"
        let args = ""

        new Setting(contentEl)
            .setName("cwd")
            .addText((text) =>
                text.setValue(cwd)
                    .onChange((value) => {
                        cwd = value
                    }));
        new Setting(contentEl)
            .setName("executable")
            .addText((text) =>
                text.setValue(exeutable)
                    .onChange((value) => {
                        exeutable = value
                    }));
        new Setting(contentEl)
            .setName("args")
            .addText((text) =>
                text.onChange((value) => {
                    args = value
                }));
    
        new Setting(contentEl)
            .addButton((btn) =>
                btn
                .setButtonText("Submit")
                .setCta()
                .onClick(async () => {
                    this.close();
                    let go = new Go();
                    FS.bindApp(this.app)
                    try {
                        var read = await this.app.vault.adapter.readBinary(exeutable)
                        let result = await WebAssembly.instantiate(read, go.importObject)
                        let inst = result.instance;
                        if(args != "") go.argv.push(args);
                        await go.run(inst);
                    }catch(err) {
                        console.error(err);
                    }       
                }));
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

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
                new PickGoWasmModal(this.app).open();
            }
        })
    }
}