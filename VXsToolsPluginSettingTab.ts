import { PluginSettingTab, App, Setting } from "obsidian";
import VXsToolsPlugin from "VXsToolsPlugin";

export default class VXsToolsPluginSettingTab extends PluginSettingTab {
	plugin: VXsToolsPlugin;

	constructor(app: App, plugin: VXsToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Template folder location')
			.setDesc('Files in this folder will be available as templates.')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.templateFolder)
				.onChange(async (value) => {
					this.plugin.settings.templateFolder = value;
					await this.plugin.saveSettings();
				}))
			.addButton(btn => btn
				//.setDisabled(null == getCoreTemplatePlugin(this.app))
				.setButtonText("Sync from core template plugin")
				.onClick(async (evt) => {
					this.plugin.templatePlugin.syncSettingCoreTemplatePlugin();
					await this.plugin.saveSettings();
				}))
	}
}