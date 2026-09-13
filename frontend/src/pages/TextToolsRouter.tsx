import type { ToolId } from "@/lib/tool-registry";
import {
  CharacterCountTool,
  CleanTextTool,
  FindReplaceTool,
  KeyboardTool,
  MarkdownTool,
  MoneyTool,
  RemoveDuplicatesTool,
  RemoveEmptyLinesTool,
  ReverseTool,
  SlugTool,
  SortLinesTool,
  WhitespaceTool,
  WordCountTool,
} from "./TextTools";

export function TextToolsRouter({ toolId }: { toolId: ToolId }) {
  switch (toolId) {
    case "text-word-count": return <WordCountTool />;
    case "text-character-count": return <CharacterCountTool />;
    case "text-remove-duplicates": return <RemoveDuplicatesTool />;
    case "text-sort-lines": return <SortLinesTool />;
    case "text-whitespace": return <WhitespaceTool />;
    case "text-find-replace": return <FindReplaceTool />;
    case "text-markdown": return <MarkdownTool />;
    case "text-slug": return <SlugTool />;
    case "text-remove-empty": return <RemoveEmptyLinesTool />;
    case "text-reverse": return <ReverseTool />;
    case "text-keyboard": return <KeyboardTool />;
    case "text-money": return <MoneyTool />;
    case "text-clean": return <CleanTextTool />;
    default: return null;
  }
}
