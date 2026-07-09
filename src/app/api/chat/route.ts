import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, appendResponseMessages } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { generationPrompt } from "@/lib/prompts/generation";
import { trackUsage } from "@/lib/usage-tracker";

export async function POST(req: Request) {
  const {
    messages,
    files,
    projectId,
  }: { messages: any[]; files: Record<string, FileNode>; projectId?: string } =
    await req.json();

  messages.unshift({
    role: "system",
    content: generationPrompt,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  });

  // Reconstruct the VirtualFileSystem from serialized data
  const fileSystem = new VirtualFileSystem();
  fileSystem.deserializeFromNodes(files);

  const model = getLanguageModel();
  // Use fewer steps for mock provider to prevent repetition
  const isMockProvider = !process.env.ANTHROPIC_API_KEY;
  const startTime = Date.now();

  const result = streamText({
    model,
    messages,
    maxTokens: 10_000,
    maxSteps: isMockProvider ? 4 : 40,
    onError: (err: any) => {
      console.error(err);
    },
    tools: {
      str_replace_editor: buildStrReplaceTool(fileSystem),
      file_manager: buildFileManagerTool(fileSystem),
    },
    onFinish: async ({ response, usage, finishReason }) => {
      const duration = Date.now() - startTime;
      const session = await getSession().catch(() => null);

      // Track AI usage
      try {
        await trackUsage({
          model: isMockProvider ? "mock" : "claude-haiku-4-5",
          inputTokens: usage?.promptTokens || 0,
          outputTokens: usage?.completionTokens || 0,
          totalTokens: usage?.totalTokens || 0,
          duration,
          userId: session?.userId,
          projectId,
          status: finishReason === "error" ? "error" : "success",
          metadata: {
            finishReason,
            maxSteps: isMockProvider ? 4 : 40,
            messageCount: messages.length,
          },
        });
      } catch (error) {
        console.error("Failed to track usage:", error);
      }

      // Save to project if projectId is provided and user is authenticated
      if (projectId) {
        try {
          // Check if user is authenticated
          if (!session) {
            console.error("User not authenticated, cannot save project");
            return;
          }

          // Get the messages from the response
          const responseMessages = response.messages || [];
          // Combine original messages with response messages
          const allMessages = appendResponseMessages({
            messages: [...messages.filter((m) => m.role !== "system")],
            responseMessages,
          });

          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(allMessages),
              data: JSON.stringify(fileSystem.serialize()),
            },
          });
        } catch (error) {
          console.error("Failed to save project data:", error);
        }
      }
    },
  });

  return result.toDataStreamResponse();
}

export const maxDuration = 120;
