export class ProgressBar {

	private rootEl: HTMLDivElement;
	private fillEl: HTMLDivElement;

	constructor(parent: HTMLElement, value: number) {
		this.rootEl = parent.createDiv({
			cls: "ai-spirit-progress"
		});

		this.fillEl = this.rootEl.createDiv({
			cls: "ai-spirit-progress-fill"
		});

		this.setValue(value);
	}

	setValue(value: number) {
		const percent =
			Math.max(0, Math.min(100, value));

		this.fillEl.style.width =
			`${percent}%`;
	}
}