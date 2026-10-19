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

  public async deleteMessage(messageId: string): Promise<void> {
    await localDb.delete("chat_message", messageId);
  }

  public async truncateMessagesAfter(
    messageId: string,
    includeTarget: boolean = false,
    threadId: string = MAIN_THREAD_ID,
  ): Promise<ChatMessage[]> {
    const msgs = await this.getMessages(threadId);
    const idx = msgs.findIndex((m) => m.id === messageId);
    if (idx === -1) return msgs;

    const cutIndex = includeTarget ? idx : idx + 1;
    const toDelete = msgs.slice(cutIndex);
    for (const msg of toDelete) {
      await localDb.delete("chat_message", msg.id);
    }
    return msgs.slice(0, cutIndex);
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
