import { App, Editor, FuzzySuggestModal, Notice, Plugin, PluginManifest, TFile, TFolder, arrayBufferToBase64, normalizePath } from "obsidian";

import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";
import VXsProxyPlugin from "VXsProxyPlugin";
import { pluginRoot } from "VXsToolsPluginConsts";
import { constants } from "buffer";

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

export type VXsTemplateMacro = (this: VXsTemplatePlugin, options: { pattern: string, editor: Editor, file: TFile, template: string }, args: string[]) => string;

export default class VXsTemplatePlugin extends VXsProxyPlugin {
    settings: VXsToolsPluginSettings;
    locale: VXsToolsPluginLocale;

    macroses: { [key: string]: VXsTemplateMacro };

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
        const ribbonIconVXsTemplate = this.addRibbonIcon('lucide-files', "VX's insert template", evt => this.vxsPickTemplate());
        ribbonIconVXsTemplate.addClass('vxs-plugin-ribbon-class');

        this.addCommand({
            id: 'vxs-tools-plugin-insert-template',
            name: "VX's Insert template",
            callback: () => this.vxsPickTemplate()
        });

        this.macroses = {};

        let loadMacroFile = async (fileName: string) => {
            let content = await this.app.vault.adapter.readBinary(fileName);
            let base64Content = arrayBufferToBase64(content);
            let macroFile = await import(`data:application/javascript;base64, ${base64Content}`) as {[key: string]: any};
            for (let key in macroFile) {
                let macro = macroFile[key];
                if (!(macro instanceof Function)) continue;
                if ("_default" !== key) {
                    this.macroses[key] = macro;
                    continue;
                }
                let def = this.macroses["default"] || ((o, a) => undefined);
                this.macroses["default"] = (options, args) => {
                    let res = macro.call(this, options, args);
                    if (undefined !== res) return res;
                    return def.call(this, options, args);
                }
            }
        };
        loadMacroFile(`${pluginRoot}/baseMacro.js`);
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

        template = template.replace(/{{[^}]+}}/gi, (pattern, args) => {
            let macroArgs = pattern.substring(2, pattern.length - 2).split('|');
            let macroName = macroArgs.shift() as string;
            
            let macro = (this.macroses[macroName] ?
                            this.macroses[macroName] : 
                            this.macroses["default"]);
            
            let res = macro.call(this, {pattern, editor, file, template}, macroArgs);
                
            return undefined === res ? pattern : res;
        });
        editor?.replaceSelection(template);
        editor?.focus();
    }
}