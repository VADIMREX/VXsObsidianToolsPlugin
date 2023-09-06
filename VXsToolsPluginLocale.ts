import { App } from "obsidian";
import { pluginRoot } from "VXsToolsPluginConsts";

export const Languages = {
    en: "English",
    zh: "简体中文",
    "zh-TW": "繁體中文",
    ru: "Pусский",
    ko: "한국어",
    it: "Italiano",
    id: "Bahasa Indonesia",
    ro: "Română",
    "pt-BR": "Português do Brasil",
    cs: "čeština",
    de: "Deutsch",
    es: "Español",
    fr: "Français",
    no: "Norsk",
    pl: "język polski",
    pt: "Português",
    ja: "日本語",
    da: "Dansk",
    uk: "Українська",
    sq: "Shqip",
    th: "ไทย",
    fa: "فارسی",
    tr: "Türkçe",
    nl: "Nederlands",
    am: "አማርኛ",
    ms: "Bahasa Melayu"
};

export type LanguagesEnum = keyof typeof Languages;

export function getLanguage(): LanguagesEnum {
    return localStorage.getItem("language") as any ?? "en";
}

export default class VXsToolsPluginLocale {



    
    protected app: App;
    protected templates: { [key: string]: string };

    constructor(app: App) {
        this.app = app;
    }

    async load() {
        let lang = getLanguage();
        if (!await this.app.vault.adapter.exists(`${pluginRoot}/locale/${lang}.json`)) lang = "en";
        let localeJson = await this.app.vault.adapter.read(`${pluginRoot}/locale/${lang}.json`);
        this.templates = JSON.parse(localeJson);
    }

    protected fromat(key: keyof VXsToolsPluginLocale, ...args: string[]) {
        let template = this.templates[key] ?? key;
        return template.format(...args);
    }

    msgNoFolderSet() { return this.fromat("msgNoFolderSet"); }
    msgFailFolderNotFound(folder: string) { return this.fromat("msgFailFolderNotFound", folder); }
    msgNoTemplatesFound() { return this.fromat("msgNoTemplatesFound"); }
    instructionNavigate() { return this.fromat("instructionNavigate"); }
    instructionInsert() { return this.fromat("instructionInsert"); }
    instructionDismiss() { return this.fromat("instructionDismiss"); }
    promptTypeTemplate() { return this.fromat("promptTypeTemplate"); }

	templateFolderSettingCaption(){ return this.fromat("templateFolderSettingCaption"); }
	templateFolderSettingDescription(){ return this.fromat("templateFolderSettingDescription"); }
    templateFolderSettingSyncCaption(){ return this.fromat("templateFolderSettingSyncCaption"); }
    macroFolderSettingCaption(){ return this.fromat("macroFolderSettingCaption"); }
    macroFolderSettingDescription(){ return this.fromat("macroFolderSettingDescription"); }
}

