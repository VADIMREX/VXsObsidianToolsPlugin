/// <reference path="wasm_exec.d.ts" />
import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, VXsToolsPluginSettings } from 'VXsToolsPluginSettings';
import { pluginRoot } from 'VXsToolsPluginConsts';
import VXsToolsPluginLocale from 'VXsToolsPluginLocale';
import VXsToolsPluginSettingTab from 'VXsToolsPluginSettingTab';
import VXsTemplatePlugin from 'VXsTemplatePlugin';

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

			this.addSettingTab(new VXsToolsPluginSettingTab(this.app, this));
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