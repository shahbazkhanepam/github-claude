export const toolLabels: Record<string, string> = {
  str_replace_editor: "Updating Code",
  file_manager: "File Management",
};

export function getToolLabel(toolName: string): string {
  return toolLabels[toolName] || toolName;
}
