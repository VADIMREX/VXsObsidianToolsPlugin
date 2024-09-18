import VXsBookReaderPlugin from "subplugins/book-reader-plugin/VXsBookReaderPlugin";
import { FileView, TFile, View, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_FICTIONBOOK2 = "fictionbook2";

export default class VXsFictionBook2View extends FileView {
    plugin: VXsBookReaderPlugin;
    editorEl: HTMLDivElement;

    doc: Document;

    constructor(leaf: WorkspaceLeaf, plugin: VXsBookReaderPlugin) {
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
            _description.childNodes.forEach((node: HTMLElement) => {
                switch (node.tagName) {
                    case "title-info":
                        node.childNodes.forEach((node: HTMLElement) => {
                            switch (node.tagName) {
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
                                    node.childNodes.forEach((node: HTMLElement) => {
                                        switch (node.tagName) {
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
                        node.childNodes.forEach((node: HTMLElement) => {

                        });
                        break;
                    case "publish-info":
                        node.childNodes.forEach((node: HTMLElement) => {

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
            footnotes = bodies[1];
        }
        let binaries = root.getElementsByTagName("binary");
        let blobList = {} as { [key: string]: Promise<Blob> };
        for (let i = 0; i < binaries.length; i++) {
            binaries[i].innerHTML;
            blobList[binaries[i].id] = fetch(`data:${binaries[i].getAttribute("content-type")};base64,${binaries[i].innerHTML}`).then(res => res.blob())
        }
        this.contentEl.empty();
        let viewRoot = this.contentEl.createDiv("fiction-book");
        viewRoot.style["userSelect"] = "text"
        let viewDoc = await this.parseBody(body, blobList);
        viewRoot.append(viewDoc);
    }

    async parseBody(node: ChildNode, blobList: { [key: string]: Promise<Blob> }) {
        if (1 != node.nodeType) {
            return node;
        }
        let result: HTMLElement;
        switch ((node as HTMLElement).tagName) {
            case "body":
                result = document.createElement("div");
                result.addClass("fb2-body");
                break;
            case "title":
                result = document.createElement("h2");
                result.addClass("fb2-title");
                break;
            case "subtitle":
                result = document.createElement("h3");
                result.addClass("fb2-subtitle");
                break;
            case "p":
                result = document.createElement("p");
                result.addClass("fb2-p");
                break;
            case "emphasis": // курсив
                result = document.createElement("i");
                result.addClass("fb2-emphasis");
                break;
            case "section":
                result = document.createElement("div");
                result.addClass("fb2-section");
                break;
            case "epigraph": 
                result = document.createElement("blockquote");
                result.addClass("fb2-epigraph");
                break;
            case "text-author":
                result = document.createElement("span");
                result.addClass("fb2-text-author");
                break;
            case "a":
                result = document.createElement("a");
                result.addClass("fb2-a");
                break;
            case "empty-line":
                result = document.createElement("br");
                result.addClass("fb2-empty-line");
                break;
            case "image":
                result = document.createElement("img");
                result.addClass("fb2-image");
                let href = (node as any).getAttributeNS("http://www.w3.org/1999/xlink", "href") as string;
                if (!href) {
                    href = (node as any).getAttribute("l:href") as string;
                }
                if (!href) break;
                if (!href.length) break;
                if ('#' === href[0]) href = href.substring(1);
                if (!blobList[href]) break;
                let blob = await blobList[href];
                (result as HTMLImageElement).src = URL.createObjectURL(blob);
                break;
            case "strong": // жирный
                result = document.createElement("b");
                result.addClass("fb2-strong");
                break;
            case "sub":
                result = document.createElement("sub");
                result.addClass("fb2-sub");
                break;
            case "sup":
                result = document.createElement("sup");
                result.addClass("fb2-sup");
                break;
            case "table":
                result = document.createElement("table");
                result.addClass("fb2-table");
                break;
            case "tr":
                result = document.createElement("tr");
                result.addClass("fb2-tr");
                break;
            case "th":
                result = document.createElement("th");
                result.addClass("fb2-th");
                break;
            case "td":
                result = document.createElement("td");
                result.addClass("fb2-td");
                break;
            case "cite": // Цитата
                result = document.createElement("blockquote");
                result.addClass("fb2-cite");
                break;
            case "poem": // Стихотворение
                result = document.createElement("poem");
                result.addClass("fb2-poem");
                break;
            case "stanza": // Строфа 
                result = document.createElement("stanza");
                result.addClass("fb2-stanza");
                break;
            case "v": // Строка стихотворения
                result = document.createElement("v");
                result.addClass("fb2-v");
                break;
            default:
                result = document.createElement("div");
                result.addClass(`fb2-${(node as HTMLElement).tagName}`);
                console.log(`fb2 unknown tag: ${(node as HTMLElement).tagName}`);
                break;
        }
        let promises: Promise<ChildNode>[] = [];
        node.childNodes.forEach(node => promises.push(this.parseBody(node, blobList)));
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