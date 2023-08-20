import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface VXsToolsPluginSettings {
	useCoreTemplateFolder: boolean;
	templateFolder: string;
}

const DEFAULT_SETTINGS: VXsToolsPluginSettings = {
	useCoreTemplateFolder: true,
	templateFolder: 'default'
}

interface CoreTemplatePlugin {
	options: { folder: string };
	templateFiles: TFile[]
}

export default class VXsToolsPlugin extends Plugin {
	settings: VXsToolsPluginSettings;

	get coreTemplatePlugin(): CoreTemplatePlugin | null {
		let coreTemplatePlugin: any = null;
		try {
			let app: any = this.app
			for (let tab of app.setting.pluginTabs) {
				if (tab.id !== "templates") continue;
				coreTemplatePlugin = tab.instance;
				break;
			}
		}
		catch (e) {

		}
		return coreTemplatePlugin;
	}

	get coreTemplateFolder() {
		let coreTemplatePlugin = this.coreTemplatePlugin;
		if (null === coreTemplatePlugin) return "";
		if (null === coreTemplatePlugin.options) return "";
		if (null === coreTemplatePlugin.options.folder) return "";
		return coreTemplatePlugin.options.folder;
	}

	get templateFolder() {
		if (this.settings.useCoreTemplateFolder) return this.coreTemplateFolder;
		else return this.settings.templateFolder;
	}

	async onload() {
		await this.loadSettings();

		if (this.settings.useCoreTemplateFolder && null === this.coreTemplatePlugin) this.settings.useCoreTemplateFolder = false;

		const vxsInsertTemplate = () => {
			var plugin = this.coreTemplatePlugin;

			var templateFolderPath = this.templateFolder;
			if (!String.isString(templateFolderPath))  {
				//plugin.
				//(new fI(tf.plugins.templates.msgNoFolderSet()),[2])
				return;
			}

			var templateFolder = this.app.vault.getAbstractFileByPath(templateFolderPath);

			//let r = 
			//this.app.vault.getAbstractFileByPath(r);
			//if ()

			//new SampleModal(this.app).open();
			//this.app.workspace.getActiveViewOfType(MarkdownView);

			/*
			var e, t, n, templateFolder, r, o, a, s = this;

			t = (e = this).app,
				n = e.options,
				(templateFolder = n.folder) && String.isString(templateFolder) ? (r = he(Od(templateFolder).normalize("NFC")),
					(o = t.vault.getAbstractFileByPath(r)) && o instanceof QE ? (this.templateFiles = [],
						(a = function (e) {
							for (var t = 0, n = e.children; t < n.length; t++) {
								var i = n[t];
								i instanceof $E && "md" === i.extension ? s.templateFiles.push(i) : i instanceof QE && a(i)
							}
						}
						)(o),
						new VQ(t, this).open(),
						[2]) : (new fI(tf.plugins.templates.msgFailFolderNotFound({
							folderOption: templateFolder
						})),
							[2])) 
													: (new fI(tf.plugins.templates.msgNoFolderSet()),[2])
			*/

			

		}

		const ribbonIconVXsTemplate = this.addRibbonIcon('lucide-files', "VX's insert template", evt => vxsInsertTemplate());
		ribbonIconVXsTemplate.addClass('vxs-plugin-ribbon-class');

		this.addCommand({
			id: 'vxs-tools-plugin-insert-template',
			name: "VX's Insert template",
			callback: () => {
				vxsInsertTemplate();
			}
		});

		this.addSettingTab(new VXsToolsPluginSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class VXsToolsPluginSettingTab extends PluginSettingTab {
	plugin: VXsToolsPlugin;

	constructor(app: App, plugin: VXsToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		let [useCoreTemplateSetting, templateFolderSetting] = [
			new Setting(containerEl)
				.setName('Use core template settings')
				.setDesc('')
				.addToggle(toggle => toggle
					.setDisabled(null == this.plugin.coreTemplatePlugin)
					.setValue(this.plugin.settings.useCoreTemplateFolder)
					.onChange(async (value) => {
						this.plugin.settings.useCoreTemplateFolder = value;
						if (value && this.plugin.coreTemplatePlugin) {
							this.plugin.settings.templateFolder = this.plugin.coreTemplateFolder;
						}
						await this.plugin.saveSettings();
					})),

			new Setting(containerEl)
				.setName('Template folder location')
				.setDesc('Files in this folder will be available as templates.')
				.addText(text => text
					.setDisabled(this.plugin.settings.useCoreTemplateFolder)
					.setPlaceholder('')
					.setValue(this.plugin.settings.templateFolder)
					.onChange(async (value) => {
						this.plugin.settings.templateFolder = value;
						await this.plugin.saveSettings();
					}))
		];
	}
}
