import {App, TFile, TFolder} from "obsidian";

import { AISpiritPluginSettings } from "../settings";

export class AuthorService {
	public static readonly MIN_WORDS_FOR_ANALYSIS = 10;
	constructor(private app: App, private settings: AISpiritPluginSettings) {}

	getAuthorFolders(): TFolder[] {
		const root =
			this.app.vault.getAbstractFileByPath(this.settings.spiritFolder);

		if (!(root instanceof TFolder)) {
			return [];
		}

		return root.children.filter(
			(child): child is TFolder => child instanceof TFolder
		);
	}

	getAuthorNames(): string[] {
		return this.getAuthorFolders().map(folder => folder.name);
	}

	getAuthorFiles(author: TFolder): TFile[] {
		return this.app.vault.getMarkdownFiles().filter(file => file.path.startsWith(author.path + "/"));
	}

	async buildAuthorCorpus(author: TFolder): Promise<string> {
		const files =this.getAuthorFiles(author);

		let corpus = "";

		for (const file of files) {

			const text = await this.app.vault.read(file);

			corpus += text + "\n\n";
		}

		return corpus;
	}
}