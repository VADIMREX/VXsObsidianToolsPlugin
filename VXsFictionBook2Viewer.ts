import VXsToolsPlugin from "VXsToolsPlugin";
import { FileView, TFile, View, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_FICTIONBOOK2 = "fictionbook2";

export default class VXsFictionBook2View extends FileView {
    plugin: VXsToolsPlugin;
    editorEl: HTMLDivElement;

    doc: Document;

    constructor(leaf: WorkspaceLeaf, plugin: VXsToolsPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    /** @override */
    getViewType(): string {
        return VIEW_TYPE_FICTIONBOOK2;
    }

    /** @override */
    async onLoadFile(file: TFile): Promise<void> {
        const content = await this.plugin.app.vault.read(file);
        const parser = new DOMParser();
        this.doc = parser.parseFromString(content, "application/xml");
        const root = this.doc.firstChild as HTMLElement;
        if (!root) return;

        const _description = root.getElementsByTagName("description")[0];
        let description = {
            titleInfo: {
                genre: [] as string[],
                author: [] as {
                    firstName?: string,
                    middleName?: string,
                    lastName?: string,
                    homePage?: string
                }[],
                bookTitle: "",
                annotation: "",
                keywords: [] as string[],
                date: undefined as any as Date,
                coverpage: undefined as any,
                lang: "",
                sequence: undefined as any as {
                    name?: string,
                    number?: string
                }
            },
            documentInfo: {

            },
            publishInfo: {

            }
        };

        if (_description) {
            _description.childNodes.forEach((node:HTMLElement)=>{
                switch(node.tagName) {
                    case "title-info":
                        node.childNodes.forEach((node:HTMLElement)=>{
                            switch(node.tagName) {
                                case "genre":
                                    description.titleInfo.genre.push(node.innerHTML);
                                    break;
                                case "author":
                                    let author: {
                                        firstName?: string,
                                        middleName?: string,
                                        lastName?: string,
                                        homePage?: string
                                    } = {};
                                    node.childNodes.forEach((node:HTMLElement)=>{
                                        switch(node.tagName) {
                                            case "first-name":
                                                author.firstName = node.innerHTML;
                                                break;
                                            case "middle-name":
                                                author.middleName = node.innerHTML;
                                                break;
                                            case "last-name":
                                                author.lastName = node.innerHTML;
                                                break;
                                            case "home-page":
                                                author.homePage = node.innerHTML;
                                                break;
                                        }
                                    });
                                    description.titleInfo.author.push(author);
                                    break;
                                case "book-title":
                                    description.titleInfo.bookTitle = node.innerHTML;
                                    break;
                                case "annotation":
                                    description.titleInfo.annotation = node.innerHTML;
                                    break;
                                case "keywords":
                                    break;
                                case "date":
                                    let date = node.getAttribute("value");
                                    if (date) description.titleInfo.date = new Date(date);
                                    break;
                                case "coverpage":
                                    break;
                                case "lang":
                                    description.titleInfo.lang = node.innerHTML;
                                    break;
                                case "sequence":
                                    description.titleInfo.sequence = {};
                                    let sequenceName = node.getAttribute("name");
                                    if (sequenceName) description.titleInfo.sequence.name = sequenceName;
                                    let sequenceNumber = node.getAttribute("number");
                                    if (sequenceNumber) description.titleInfo.sequence.number = sequenceNumber;
                                    break;
                            }
                        });
                        break;
                    case "document-info":
                        node.childNodes.forEach((node:HTMLElement)=>{

                        });
                        break;
                    case "publish-info":
                        node.childNodes.forEach((node:HTMLElement)=>{

                        });
                        break;
                }
            });
        }

        const bodies = root.getElementsByTagName("body");
        if (0 == bodies.length) return;

        let body = bodies[0];
        let footnotes = null;
        if (bodies.length > 1) {

        }
        let viewDoc = this.parseBody(body);
    }

    async parseBody(node: ChildNode) {
        if (1 != node.nodeType) {
            return node;
        }
        let result: HTMLElement;
        switch((node as HTMLElement).tagName) {
            case "body":
                result = this.contentEl.createDiv("fiction-book");
                break;
            default: 
                result = document.createElement("div");
                break;
        }
        let promises: Promise<ChildNode>[] = [];
        node.childNodes.forEach(node => promises.push(this.parseBody(node)));     
        for (let p of promises) {
            let childRes = await p;
            if (childRes instanceof HTMLElement)
                result.append(childRes)
            else
                result.append(childRes);
        }
        return result;  
    }
}