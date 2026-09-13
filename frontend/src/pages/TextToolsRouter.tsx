import type { ToolId } from "@/lib/tool-registry";
import {
  FindReplaceTool,
  KeyboardTool,
  MoneyTool,
  RemoveDuplicatesTool,
  ReverseTool,
  WordCountTool,
} from "./TextTools";

export function TextToolsRouter({ toolId }: { toolId: ToolId }) {
  switch (toolId) {
    case "text-word-count": return <WordCountTool />;
    case "text-find-replace": return <FindReplaceTool />;
    case "text-remove-duplicates": return <RemoveDuplicatesTool />;
    case "text-reverse": return <ReverseTool />;
    case "text-keyboard": return <KeyboardTool />;
    case "text-money": return <MoneyTool />;
    default: return null;
  }
}
