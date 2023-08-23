import { App, FuzzySuggestModal, Notice, Plugin, PluginManifest, TFile, TFolder, normalizePath } from "obsidian";

import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";
import VXsProxyPlugin from "VXsProxyPlugin";

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

export default class VXsTemplatePlugin extends VXsProxyPlugin {
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

    onload(): void {
        const ribbonIconVXsTemplate = this.addRibbonIcon('lucide-files', "VX's insert template", evt => this.vxsPickTemplate());
        ribbonIconVXsTemplate.addClass('vxs-plugin-ribbon-class');

        this.addCommand({
            id: 'vxs-tools-plugin-insert-template',
            name: "VX's Insert template",
            callback: () => this.vxsPickTemplate()
        });
    }

    onunload() {
        
	}

    syncSettingCoreTemplatePlugin() {
        this.settings.templateFolder = getCoreTemplateFolder(this.app);
    }

    vxsPickTemplate() {
        let templateFolderPath = this.settings.templateFolder;

        if (!String.isString(templateFolderPath)) {
            new Notice(this.locale.msgNoFolderSet())
            return;
        }

        let templateFolderPathNormalized = normalizePath(templateFolderPath.replace(/\u00A0/g, " ").normalize("NFC"));
        let templateFolder = this.app.vault.getAbstractFileByPath(templateFolderPathNormalized);

        if (!(templateFolder instanceof TFolder)) {
            new Notice(this.locale.msgFailFolderNotFound(templateFolderPath))
            return;
        }

        let templateFiles: TFile[] = [];
        function getTemplates(folder: TFolder) {
            for (let entry of folder.children) {
                if (entry instanceof TFile && "md" === entry.extension)
                    templateFiles.push(entry);
                else if (entry instanceof TFolder)
                    getTemplates(entry);
            }
        }
        getTemplates(templateFolder);
        
        let onChooseCallback = this.vxsApplyTemplate.bind(this);
        let pickupModal = new class extends FuzzySuggestModal<TFile> {
            getItems() {
                return templateFiles;
            }
            onChooseItem(item: TFile) {
                onChooseCallback(item);
            }
            getItemText(item: TFile) {
                return item.basename
            }
        }(this.app);
        pickupModal.emptyStateText = this.locale.msgNoTemplatesFound();
        pickupModal.setInstructions([{
            command: "↑↓",
            purpose: this.locale.instructionNavigate()
        }, {
            command: "↵",
            purpose: this.locale.instructionInsert()
        }, {
            command: "esc",
            purpose: this.locale.instructionDismiss()
        }]);
        pickupModal.setPlaceholder(this.locale.promptTypeTemplate());
        pickupModal.scope.register([], "Tab", () => !1);
        pickupModal.open();
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
}