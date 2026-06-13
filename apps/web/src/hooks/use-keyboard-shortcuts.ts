import { useEditShortcuts } from './use-edit-shortcuts';
import { useHistoryShortcuts } from './use-history-shortcuts';
import { useToolShortcuts } from './use-tool-shortcuts';

export function useKeyboardShortcuts() {
  useToolShortcuts();
  // Clipboard shortcuts removed in MinoPencil (Figma paste removed)
  useHistoryShortcuts();
  useEditShortcuts();
}
