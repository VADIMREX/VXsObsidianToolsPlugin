import { App, FuzzySuggestModal, TFile } from "obsidian";
import VXsToolsPluginLocale from "VXsToolsPluginLocale";

export default class FileSuggestModal extends FuzzySuggestModal<TFile> {
    private items;
    private onChooseCallback;
    private locale: VXsToolsPluginLocale;
    constructor(app: App, locale: VXsToolsPluginLocale, items: TFile[], onChooseCallback: (item: TFile) => void) {
        super(app);
        this.items = items;
        this.locale = locale;
        this.onChooseCallback = onChooseCallback;
        this.emptyStateText = this.locale.msgNoTemplatesFound();
        this.setInstructions([{
            command: "↑↓",
            purpose: this.locale.instructionNavigate()
        }, {
            command: "↵",
            purpose: this.locale.instructionInsert()
        }, {
            command: "esc",
            purpose: this.locale.instructionDismiss()
        }]);
        this.setPlaceholder(this.locale.promptTypeTemplate());
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