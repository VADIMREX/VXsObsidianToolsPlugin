import { App, Editor, FuzzySuggestModal, Notice, Plugin, PluginManifest, TFile, TFolder, arrayBufferToBase64, normalizePath } from "obsidian";

import VXsToolsPluginLocale from "VXsToolsPluginLocale";
import { VXsToolsPluginSettings } from "VXsToolsPluginSettings";
import VXsProxyPlugin from "subplugins/VXsProxyPlugin";
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

/** 
 * @typedef {(this:any, options:{ pattern: string, editor: Editor, file: TFile, template: string }, args: string[])} VXsTemplateMacro
 * 
 */

type VXsTemplateOptions = { pattern: string, editor: Editor, file: TFile, template: string };


function title(options: VXsTemplateOptions, args: string[]) {
    return options.file?.basename ?? "";
}

function moment(options: VXsTemplateOptions, args: string[]) {
    let moment = window.moment;
    let now = moment();

    /** {{moment}} */
    if (0 == args.length) return now.format();

    /** {{moment|<format>}} */
    if (1 == args.length) return now.format(args[0]);

    /** {{moment|...|...}} */
    let locale = moment.locale();
    /** {{moment|<locale>|...}} */
    if (locale == args[0] || args[0] == moment.locale(args[0])) {
        now = moment();
        let result = "";

        /** {{moment|<locale>|<format>}} */
        if (isNaN(+args[1]))
            result = now.format(args.slice(1).join("|"));
        /** {{moment|<locale>|<number>}} */
        else if (2 == args.length) {
            now.add(+args[1], 'days');
            result = now.format(args[2]);
        }
        /** {{moment|<locale>|<number>|<format>}} */
        else if (![
            "year", "years", "y",
            "month", "months", "M",
            "week", "weeks", "w",
            "day", "days", "d",
            "hour", "hours", "h",
            "minute", "minutes", "m",
            "second", "seconds", "s",
            "millisecond", "milliseconds", "ms",
            "quarter", "quarters", "Q"
        ].contains(args[2])) {
            now.add(+args[1], 'days');
            result = now.format(args.slice(2).join("|"));
        }
        /** {{moment|<locale>|<number>|<unit>}} */
        else if (3 == args.length) {
            now.add(+args[1], args[2] as any);
            result = now.format();
        }
        /** {{moment|<locale>|<number>|<unit>|<format>}} */
        else {
            now.add(+args[1], args[2] as any);
            result = now.format(args.slice(3).join("|"));
        }

        moment.locale(locale);
        return result;
    }

    /** {{moment|<format>}} */
    return now.format(args.slice(1).join("|"));
}

function dateOrTime(pattern: string) {
    let n = {
        dateFormat: undefined,
        timeFormat: undefined,
    }
    let a = window.moment();
    let Fj = "YYYY-MM-DD";
    let Bj = "HH:mm";
    
    pattern = pattern.substring(2, pattern.length - 2);
    let t = pattern;
    let i = undefined;
    let delim = pattern.indexOf(":");
    if (delim > -1) {
        t = pattern.substring(2, delim);
        i = pattern.substring(delim + 1);
    }
    return i ? a.format(i) : "date" === t.toLowerCase() ? a.format(n && n.dateFormat || Fj) : a.format(n && n.timeFormat || Bj);
}

function _default(options: VXsTemplateOptions, args: string[]) {
    if (["date", "time"].contains(options.pattern.substring(2, 6))) return dateOrTime(options.pattern);
    return undefined;
}

export type VXsTemplateMacro = (this: VXsTemplatePlugin, options: VXsTemplateOptions, args: string[]) => string | undefined;

export default class VXsTemplatePlugin extends VXsProxyPlugin {
    settings: VXsToolsPluginSettings;
    locale: VXsToolsPluginLocale;

    macroses: { [key: string]: VXsTemplateMacro }

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
    }

    onunload() {

    }

    syncSettingCoreTemplatePlugin() {
        this.settings.templateFolder = getCoreTemplateFolder(this.app);
    }

    getFolder(folderPath: string) {
        if (!String.isString(folderPath)) {
            new Notice(this.locale.msgNoFolderSet())
            return;
        }

        let folderPathNormalized = normalizePath(folderPath.replace(/\u00A0/g, " ").normalize("NFC"));
        let folder = this.app.vault.getAbstractFileByPath(folderPathNormalized);

        if (!(folder instanceof TFolder)) {
            new Notice(this.locale.msgFailFolderNotFound(folderPath))
            return;
        }

        return folder;
    }

    vxsPickTemplate() {
        let templateFolder = this.getFolder(this.settings.templateFolder);

        if (!templateFolder) return;

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

        this.macroses = {
            title,
            moment,
            default: _default
        };
        
        ////

        // todo cache marcorses
        let loadMacroFile = async (file: TFile) => {
            //let content = await this.app.vault.adapter.readBinary(fileName);
            try {
                let content = await this.app.vault.readBinary(file);
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
            }catch(e) {
                new Notice(e);
            }
        };

        async function getMacroses(folder: TFolder) {
            for (let entry of folder.children) {
                if (entry instanceof TFile && "js" === entry.extension)
                    await loadMacroFile(entry);
                else if (entry instanceof TFolder)
                    await getMacroses(entry);
            }
        }

        let macroFolder = this.getFolder(this.settings.macroFolder);
        if (macroFolder) await getMacroses(macroFolder);

        ////

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