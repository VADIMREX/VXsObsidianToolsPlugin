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
        let localeJson = await this.app.vault.adapter.read(`${pluginRoot}/${lang}.json`);
        if (null == localeJson) localeJson = await this.app.vault.adapter.read(`${pluginRoot}/en.json`);
        this.templates = JSON.parse(localeJson);
    }

    protected __format(key: keyof VXsToolsPluginLocale, ...args: string[]) {
        let template = this.templates[key];
        return template.format(...args);
    }

    msgNoFolderSet() { return this.__format("msgNoFolderSet"); }
    msgFailFolderNotFound(folder: string) { return this.__format("msgFailFolderNotFound", folder); }
    msgNoTemplatesFound() { return this.__format("msgNoTemplatesFound"); }
    instructionNavigate() { return this.__format("instructionNavigate"); }
    instructionInsert() { return this.__format("instructionInsert"); }
    instructionDismiss() { return this.__format("instructionDismiss"); }
    promptTypeTemplate() { return this.__format("promptTypeTemplate"); }
}

