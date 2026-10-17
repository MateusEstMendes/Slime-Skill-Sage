import { localDb } from "./db";
import type { ChatThread, ChatMessage, ProposalStatus } from "@slime-sage/shared";

export const MAIN_THREAD_ID = "main-gs-thread";

export class ChatRepository {
  public async getOrCreateMainThread(): Promise<ChatThread> {
    const existing = await localDb.get<ChatThread>("chat_thread", MAIN_THREAD_ID);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newThread: ChatThread = {
      id: MAIN_THREAD_ID,
      title: "Conselho da Grande Sábio",
      created_at: now,
      updated_at: now,
    };

    await localDb.put("chat_thread", newThread);
    return newThread;
  }

  public async getMessages(threadId: string = MAIN_THREAD_ID): Promise<ChatMessage[]> {
    const all = await localDb.getAll<ChatMessage>("chat_message");
    return all
      .filter((m) => m.thread_id === threadId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public async saveMessage(message: ChatMessage): Promise<void> {
    await localDb.put("chat_message", message);
  }

  public async updateMessageProposalStatus(
    messageId: string,
    status: ProposalStatus,
  ): Promise<void> {
    const msg = await localDb.get<ChatMessage>("chat_message", messageId);
    if (!msg) return;

    msg.status = status;
    await localDb.put("chat_message", msg);
  }

  public async clearThreadMessages(threadId: string = MAIN_THREAD_ID): Promise<void> {
    const msgs = await this.getMessages(threadId);
    for (const msg of msgs) {
      await localDb.delete("chat_message", msg.id);
    }
  }
}

export const chatRepository = new ChatRepository();
