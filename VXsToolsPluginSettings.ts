export interface VXsToolsPluginSettings {
	templateFolder: string;
    macroFolder: string;
    fileExtensionLanguageMapping: string
}

export const DEFAULT_SETTINGS: VXsToolsPluginSettings = {
	templateFolder: '_templates',
    macroFolder: '_macros',
    fileExtensionLanguageMapping: ""
}