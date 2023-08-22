/// <reference path="wasm_exec.d.ts" />
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, normalizePath, FuzzySuggestModal } from 'obsidian';

/*
		AbstractTextComponent: ()=>jI,
			App: ()=>VJ,
			BaseComponent: ()=>VI,
			ButtonComponent: ()=>qI,
			ColorComponent: ()=>$I,
			Component: ()=>lf,
			DropdownComponent: ()=>XI,
			EditableFileView: ()=>vI,
			Editor: ()=>Ow,
			EditorSuggest: ()=>ag,
			Events: ()=>ug,
			ExtraButtonComponent: ()=>UI,
			FileManager: ()=>zj,
			FileSystemAdapter: ()=>Ud,
			FileView: ()=>mI,
			FuzzySuggestModal: ()=>Zj,
			HoverPopover: ()=>u_,
			ItemView: ()=>hI,
			Keymap: ()=>bm,
			MarkdownPreviewRenderer: ()=>GA,
			MarkdownPreviewSection: ()=>UA,
			MarkdownPreviewView: ()=>wP,
			MarkdownRenderChild: ()=>qA,
			MarkdownRenderer: ()=>vP,
			MarkdownSourceView: ()=>JU,
			MarkdownView: ()=>QW,
			Menu: ()=>rg,
			MenuItem: ()=>ng,
			MenuSeparator: ()=>ig,
			MetadataCache: ()=>KU,
			Modal: ()=>EU,
			MomentFormatComponent: ()=>YI,
			Notice: ()=>fI,
			Platform: ()=>ct,
			Plugin: ()=>MW,
			PluginSettingTab: ()=>TW,
			PopoverState: ()=>$U,
			PopoverSuggest: ()=>wm,
			Scope: ()=>vm,
			Setting: ()=>HI,
			SettingTab: ()=>Sj,
			SliderComponent: ()=>ZI,
			SuggestModal: ()=>Xj,
			TAbstractFile: ()=>XE,
			TFile: ()=>$E,
			TFolder: ()=>QE,
			TextAreaComponent: ()=>KI,
			TextComponent: ()=>WI,
			TextFileView: ()=>e_,
			ToggleComponent: ()=>_I,
			ValueComponent: ()=>zI,
			Vault: ()=>JE,
			View: ()=>uI,
			ViewRegistry: ()=>L_,
			Workspace: ()=>gW,
			WorkspaceContainer: ()=>nj,
			WorkspaceFloating: ()=>hW,
			WorkspaceItem: ()=>Q_,
			WorkspaceLeaf: ()=>aj,
			WorkspaceParent: ()=>J_,
			WorkspaceRibbon: ()=>cW,
			WorkspaceRoot: ()=>uW,
			WorkspaceSidedock: ()=>tj,
			WorkspaceSplit: ()=>ej,
			WorkspaceTabs: ()=>rj,
			WorkspaceWindow: ()=>pW,
			addIcon: ()=>Cf,
			apiVersion: ()=>PJ,
			arrayBufferToBase64: ()=>q,
			arrayBufferToHex: ()=>G,
			base64ToArrayBuffer: ()=>z,
			debounce: ()=>qe,
			editorEditorField: ()=>BP,
			editorInfoField: ()=>RP,
			editorLivePreviewField: ()=>HP,
			editorViewField: ()=>NP,
			finishRenderMath: ()=>TA,
			fuzzySearch: ()=>Im,
			getAllTags: ()=>xS,
			getBlobArrayBuffer: ()=>We,
			getIcon: ()=>wf,
			getIconIds: ()=>Ef,
			getLinkpath: ()=>bS,
			hexToArrayBuffer: ()=>W,
			htmlToMarkdown: ()=>NE,
			iterateCacheRefs: ()=>kS,
			iterateRefs: ()=>CS,
			livePreviewState: ()=>iF,
			loadMathJax: ()=>kA,
			loadMermaid: ()=>vA,
			loadPdfJs: ()=>dA,
			loadPrism: ()=>bA,
			moment: ()=>tF,
			normalizePath: ()=>he,
			parseFrontMatterAliases: ()=>Jb,
			parseFrontMatterEntry: ()=>$b,
			parseFrontMatterStringArray: ()=>Qb,
			parseFrontMatterTags: ()=>ew,
			parseLinktext: ()=>wS,
			parseYaml: ()=>JO,
			prepareFuzzySearch: ()=>Am,
			prepareQuery: ()=>Dm,
			prepareSimpleSearch: ()=>Nm,
			removeIcon: ()=>xf,
			renderMatches: ()=>Hm,
			renderMath: ()=>CA,
			renderResults: ()=>Rm,
			request: ()=>v_,
			requestUrl: ()=>g_,
			requireApiVersion: ()=>OJ,
			resolveSubpath: ()=>DS,
			sanitizeHTMLToDom: ()=>OM,
			setIcon: ()=>kf,
			sortSearchResults: ()=>Om,
			stringifyYaml: ()=>eF,
			stripHeading: ()=>MS,
			stripHeadingForLink: ()=>TS
		
		let Id = /\u00A0/g;
		function Od(e) {
			return e.replace(Id, " ")
		}

		*/

// Remember to rename these classes and interfaces!

interface VXsToolsPluginSettings {
	templateFolder: string;
}

const DEFAULT_SETTINGS: VXsToolsPluginSettings = {
	templateFolder: 'default'
}


class FileSuggestModal extends FuzzySuggestModal<TFile> {
	private items;
	private onChooseCallback;
	constructor(app: App, items: TFile[], onChooseCallback: (item: TFile) => void) {
		super(app);
		this.items = items;
		this.onChooseCallback = onChooseCallback;
		this.emptyStateText = "tf.plugins.templates.msgNoTemplatesFound()",
			this.setInstructions([{
				command: "↑↓",
				purpose: "tf.plugins.templates.instructionNavigate()"
			}, {
				command: "↵",
				purpose: "tf.plugins.templates.instructionInsert()"
			}, {
				command: "esc",
				purpose: "tf.plugins.templates.instructionDismiss()"
			}]),
			this.setPlaceholder("tf.plugins.templates.promptTypeTemplate())");
		this.scope.register([], "Tab", () => !1);
	}
	getItems() {
		return this.items;
	}
	onChooseItem(item: TFile) {
		this.onChooseCallback(item);
	}
	getItemText(item: TFile) {
		return item.basename
	}
}

interface CoreTemplatePlugin {
	options: { folder: string };
	templateFiles: TFile[]
}

function getCoreTemplatePlugin(app: App): CoreTemplatePlugin | null {
    try {
        for (let tab of (app as any).setting.pluginTabs) {
            if (tab.id !== "templates") continue;
            return tab.instance;
        }
    }
    catch (e) {
        // todo notice
    }
    return null;
}

function getCoreTemplateFolder(app: App) {
    let coreTemplatePlugin = getCoreTemplatePlugin(app);
    if (null === coreTemplatePlugin) return "";
    if (null === coreTemplatePlugin.options) return "";
    if (null === coreTemplatePlugin.options.folder) return "";
    return coreTemplatePlugin.options.folder;
}

interface ifsPromises {
	readFile(path: string, options: any): Promise<Buffer>;
	readFile(path: string, options: any&{encoding: "utf-8"}): Promise<string>;
}
interface ifs {
	promises: ifsPromises;
}

export default class VXsToolsPlugin extends Plugin {
	settings: VXsToolsPluginSettings;

	fs: ifs;

	syncSettingCoreTemplatePlugin() {
		this.settings.templateFolder = getCoreTemplateFolder(this.app);
	}

	vxsPickTemplate() {
		let templateFolderPath = this.settings.templateFolder;

		if (!String.isString(templateFolderPath)) {
			new Notice("tf.plugins.templates.msgNoFolderSet()),[2]")
			return;
		}

		let templateFolderPathNormalized = normalizePath(templateFolderPath.replace(/\u00A0/g, " ").normalize("NFC"));
		let templateFolder = this.app.vault.getAbstractFileByPath(templateFolderPathNormalized);

		if (!(templateFolder instanceof TFolder)) {
			new Notice("tf.plugins.templates.msgFailFolderNotFound({\n\
			// 	folderOption: templateFolderPath\n\
			// })");
			return;
		}

		let templateFiles: TFile[] = [];
		function getTemplates(folder: TFolder) {
			for (let i = 0; i < folder.children.length; i++) {
				let entry = folder.children[i];
				if (entry instanceof TFile && "md" === entry.extension)
					templateFiles.push(entry);
				else if (entry instanceof TFolder)
					getTemplates(entry);
			}
		}
		getTemplates(templateFolder);

		new FileSuggestModal(this.app, templateFiles, this.vxsApplyTemplate).open();
	}

	async vxsApplyTemplate(templateFile: TFile) {
		if (!this.app.workspace.activeEditor) {
			return;
		}
		let activeEditor = this.app.workspace.activeEditor;
		let editor = activeEditor.editor;
		let file = activeEditor.file;
		let template = await this.app.vault.cachedRead(templateFile);
		template = template.replace(new RegExp("{{title}}"), file?.basename ?? "")
		template = template.replace(/{{(date|time)(?::(.*?))?}}/gi, (function (e, t, i) {
			let n = {
				dateFormat: undefined,
				timeFormat: undefined,
			}
			let a = window.moment();
			let Fj = "YYYY-MM-DD";
			let Bj = "HH:mm";
			return i ? a.format(i) : "date" === t.toLowerCase() ? a.format(n && n.dateFormat || Fj) : a.format(n && n.timeFormat || Bj);
		}
		))
		editor?.replaceSelection(template);
		editor?.focus();
	}

	async onload() {
		require("wasm_exec");

		await this.loadSettings();

		this.fs = window.require("original-fs");

		const ribbonIconVXsTemplate = this.addRibbonIcon('lucide-files', "VX's insert template", evt => this.vxsPickTemplate());
		ribbonIconVXsTemplate.addClass('vxs-plugin-ribbon-class');

		this.addCommand({
			id: 'vxs-tools-plugin-insert-template',
			name: "VX's Insert template",
			callback: () => this.vxsPickTemplate()
		});

		this.addCommand({
			id: 'vxs-tools-plugin-wasm-test',
			name: "VX's WASM test",
			callback: async () => {
				if (!WebAssembly) 
					return new Notice("WebAssembly is not supported");;
				const go = new Go();
				var read = await this.app.vault.adapter.readBinary(".obsidian/plugins/vxs-obsidian-tools-plugin/testgowasm/hello.wasm")
				WebAssembly.instantiate(read, go.importObject).then((result) => {
					go.run(result.instance);
					new Notice((window as any).hello())
				});
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

class VXsToolsPluginSettingTab extends PluginSettingTab {
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
				.setDisabled(null == getCoreTemplatePlugin(this.app))
				.setButtonText("Sync from core template plugin")
				.onClick(async (evt) => {
					this.plugin.syncSettingCoreTemplatePlugin();
					await this.plugin.saveSettings();
				}))
	}
}
