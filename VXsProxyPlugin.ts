import { App, Command, Plugin, PluginManifest } from "obsidian";

export default class VXsProxyPlugin {
    proxyPlugin: Plugin;

    get app() { return this.proxyPlugin.app; }

    constructor(app: App, manifest: PluginManifest) 
    constructor(basePlugin: Plugin) 
    constructor(appOrPlugin: App | Plugin, manifest?: PluginManifest) {
        if (appOrPlugin instanceof App) {
            throw new Error("not supported");
        }
        this.proxyPlugin = appOrPlugin;
    }

    addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => any): HTMLElement {
        return this.proxyPlugin.addRibbonIcon.apply(this.proxyPlugin, arguments);
    }

    addCommand(command: Command): Command {
        return this.proxyPlugin.addCommand.apply(this.proxyPlugin, arguments);
    }
}