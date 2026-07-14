import { App } from "obsidian";
import { AISpiritView, VIEW_TYPE } from "../views/AISpiritView";

export function getAISpiritView(app: App): AISpiritView | null {
  const leaves = app.workspace.getLeavesOfType(VIEW_TYPE);

  for (const leaf of leaves) {
    const view = leaf.view;
    if (view instanceof AISpiritView) return view;
  }

  return null;
}