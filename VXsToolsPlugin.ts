import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, VXsToolsPluginSettings } from 'VXsToolsPluginSettings';
import { pluginRoot } from 'VXsToolsPluginConsts';
import VXsToolsPluginLocale from 'VXsToolsPluginLocale';
import VXsToolsPluginSettingTab from 'VXsToolsPluginSettingTab';

import VXsTemplatePlugin from 'subplugins/template-plugin/VXsTemplatePlugin';
import VXsSourceViewPlugin from 'subplugins/source-view-plugin/VXsSourceViewPlugin';
import VXsBookReaderPlugin from 'subplugins/book-reader-plugin/VXsBookReaderPlugin';
import GoWasmPlugin from 'subplugins/go-wasm-plugin/go-wasm-plugin';

import VXsSourceCodeView, { VIEW_TYPE_SOURCECODE } from 'subplugins/source-view-plugin/VXsSourceCodeView';
import VXsFictionBook2View, { VIEW_TYPE_FICTIONBOOK2 } from 'subplugins/book-reader-plugin/VXsFictionBook2Viewer';

export default class VXsToolsPlugin extends Plugin {
	settings: VXsToolsPluginSettings;
	locale: VXsToolsPluginLocale;

	templatePlugin: VXsTemplatePlugin;
	sourceViewPlugin: VXsSourceViewPlugin;
	bookReaderPlugin: VXsBookReaderPlugin;
	goWasmPlugin: GoWasmPlugin;
	

	async onload() {
		try {
			await this.loadSettings();
			this.locale = new VXsToolsPluginLocale(this.app);
            await this.locale.load()

			this.templatePlugin = new VXsTemplatePlugin(this);
			this.templatePlugin.locale = this.locale;
			this.templatePlugin.settings = this.settings;
			this.templatePlugin.onload();

			this.sourceViewPlugin = new VXsSourceViewPlugin(this);
			this.sourceViewPlugin.locale = this.locale;
			this.sourceViewPlugin.settings = this.settings;
			this.sourceViewPlugin.onload();

			this.bookReaderPlugin = new VXsBookReaderPlugin(this);
			this.bookReaderPlugin.locale = this.locale;
			this.bookReaderPlugin.settings = this.settings;
			this.bookReaderPlugin.onload();

			this.goWasmPlugin = new GoWasmPlugin(this);
			this.goWasmPlugin.locale = this.locale;
			this.goWasmPlugin.settings = this.settings;
			this.goWasmPlugin.onload();

			this.registerMarkdownPostProcessor((el, ctx)=>{
				console.log(arguments);
			});

			let plugins = (this.app as any)?.plugins
			if (plugins && plugins.plugins) {
				let liveSyncPlugin = plugins.plugins["obsidian-livesync"]
				if (liveSyncPlugin) {
					this.addCommand({
						id: 'vxs-tools-plugin-sync-plugin-resolve-all-conflicts',
						name: "VX's: Resolve all Live Sync conflicts",
						callback: async () => {
							for await (const r of liveSyncPlugin.localDatabase.findAllDocs({
								conflicts: true
							})) {
								await liveSyncPlugin.resolveConflicted(r.path);
							}
						}
					})
					const ICHeader = "i:"
					const PSCHeader = "ps:"
					const ICXHeader = "ix:"
					function isInternalMetadata(s: string) {
						return s.startsWith(ICHeader);
					}
					function isPluginMetadata(s: string) {
						return s.startsWith(PSCHeader);
					}
					function isCustomisationSyncMetadata(s: string) {
						return s.startsWith(ICXHeader);
					}
					this.addCommand({
						id: 'vxs-tools-plugin-sync-plugin-auto-resolve-conflicts',
						name: "VX's: Try automerge all Live Sync conflicts",
						callback: async () => {
							for await (const r of liveSyncPlugin.localDatabase.findAllDocs({
								conflicts: true
							})) {
								if (isInternalMetadata(r.path)) 
									await liveSyncPlugin.addOnHiddenFileSync.resolveConflictOnInternalFile(r.path);
								else if (isPluginMetadata(r.path))
									await liveSyncPlugin.resolveConflictByNewerEntry(r.path);
								else if (isCustomisationSyncMetadata(r.path))
									await liveSyncPlugin.resolveConflictByNewerEntry(r.path);
								else {
									// await serialized("conflicted", (async () => {
									// 	const r = await this.getConflictedStatus(s);
									// 	if (false !== r) if (true !== r) await this.showMergeDialog(s, r); else {
									// 	  if (this.settings.syncAfterMerge && !this.suspended) await this.replicate();
									// 	  Logger("conflict:Automatically merged, but we have to check it again");
									// 	  setTimeout((() => {
									// 		this.showIfConflicted(s);
									// 	  }), 50);
									// 	}
									// }));
								}
							}
						}
					})
				}
			}

			this.addSettingTab(new VXsToolsPluginSettingTab(this.app, this, this.locale));
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