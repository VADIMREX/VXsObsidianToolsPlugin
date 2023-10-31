import { PluginSettingTab, App, Setting } from "obsidian";
import VXsToolsPlugin from "VXsToolsPlugin";
import VXsToolsPluginLocale from "VXsToolsPluginLocale";

export default class VXsToolsPluginSettingTab extends PluginSettingTab {
	plugin: VXsToolsPlugin;
	locale: VXsToolsPluginLocale;

	constructor(app: App, plugin: VXsToolsPlugin, locale: VXsToolsPluginLocale) {
		super(app, plugin);
		this.plugin = plugin;
		this.locale = locale;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(this.locale.templateFolderSettingCaption())
			.setDesc(this.locale.templateFolderSettingDescription())
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.templateFolder)
				.onChange(async (value) => {
					this.plugin.settings.templateFolder = value;
					await this.plugin.saveSettings();
				}))
			.addButton(btn => btn
				//.setDisabled(null == getCoreTemplatePlugin(this.app))
				.setButtonText(this.locale.templateFolderSettingSyncCaption())
				.onClick(async (evt) => {
					this.plugin.templatePlugin.syncSettingCoreTemplatePlugin();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.locale.macroFolderSettingCaption())
			.setDesc(this.locale.macroFolderSettingDescription())
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.macroFolder)
				.onChange(async (value) => {
					this.plugin.settings.macroFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.locale.fileExtensionLanguageMapping())
			.setDesc(this.locale.fileExtensionLanguageMapping())
			.addTextArea(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.fileExtensionLanguageMapping)
				.onChange(async (value) => {
					this.plugin.settings.fileExtensionLanguageMapping = value;
					await this.plugin.saveSettings();
				}));
	}
}