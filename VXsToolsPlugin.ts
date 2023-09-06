/// <reference path="wasm_exec.d.ts" />
import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, VXsToolsPluginSettings } from 'VXsToolsPluginSettings';
import { pluginRoot } from 'VXsToolsPluginConsts';
import VXsToolsPluginLocale from 'VXsToolsPluginLocale';
import VXsToolsPluginSettingTab from 'VXsToolsPluginSettingTab';
import VXsTemplatePlugin from 'VXsTemplatePlugin';
import VXsSourceCodeView, { VIEW_TYPE_SOURCECODE } from 'VXsSourceCodeView';
import VXsFictionBook2View, { VIEW_TYPE_FICTIONBOOK2 } from 'VXsFictionBook2Viewer';

export default class VXsToolsPlugin extends Plugin {
	settings: VXsToolsPluginSettings;
	locale: VXsToolsPluginLocale;
	templatePlugin: VXsTemplatePlugin;

	async onload() {
		try {
			require("wasm_exec");
			await this.loadSettings();
			this.locale = new VXsToolsPluginLocale(this.app);
            await this.locale.load()

			this.templatePlugin = new VXsTemplatePlugin(this);
			this.templatePlugin.locale = this.locale;
			this.templatePlugin.settings = this.settings;
			this.templatePlugin.onload();

			this.addCommand({
				id: 'vxs-tools-plugin-wasm-test',
				name: "VX's WASM test",
				callback: async () => {
					if (!WebAssembly)
						return new Notice("WebAssembly is not supported");;
					const go = new Go();
					var read = await this.app.vault.adapter.readBinary(`${pluginRoot}/testgowasm/hello.wasm`)
					WebAssembly.instantiate(read, go.importObject).then((result) => {
						go.run(result.instance);
						new Notice((window as any).hello())
					});
				}
			});

			this.addSettingTab(new VXsToolsPluginSettingTab(this.app, this, this.locale));

			this.registerView(VIEW_TYPE_SOURCECODE, s => new VXsSourceCodeView(s, this));
			this.registerExtensions(["js"], VIEW_TYPE_SOURCECODE);

			this.registerView(VIEW_TYPE_FICTIONBOOK2, s => new VXsFictionBook2View(s, this));
			this.registerExtensions(["fb2"], VIEW_TYPE_FICTIONBOOK2);
		}
		catch (e) {
			new Notice(`${e}: ${(e as Error).stack}`);
		}
	}

	onunload() {
        this.templatePlugin.onunload();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}