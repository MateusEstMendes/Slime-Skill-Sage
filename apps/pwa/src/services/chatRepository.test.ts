import { describe, it, expect, beforeEach } from "vitest";
import { chatRepository, MAIN_THREAD_ID } from "./chatRepository";
import { localDb } from "./db";
import type { ChatMessage } from "@slime-sage/shared";

describe("ChatRepository", () => {
  beforeEach(async () => {
    await localDb.clearTable("chat_thread");
    await localDb.clearTable("chat_message");
  });

  it("should get or create main thread", async () => {
    const thread1 = await chatRepository.getOrCreateMainThread();
    expect(thread1.id).toBe(MAIN_THREAD_ID);
    expect(thread1.title).toBe("Conselho da Grande Sábio");

    const thread2 = await chatRepository.getOrCreateMainThread();
    expect(thread2.id).toBe(thread1.id);
  });

  it("should save and retrieve messages ordered chronologically", async () => {
    const msg1: ChatMessage = {
      id: "msg-1",
      thread_id: MAIN_THREAD_ID,
      role: "user",
      content: "Primeira mensagem",
      created_at: "2026-10-17T10:00:00.000Z",
    };

    const msg2: ChatMessage = {
      id: "msg-2",
      thread_id: MAIN_THREAD_ID,
      role: "assistant",
      content: "Segunda mensagem",
      created_at: "2026-10-17T10:01:00.000Z",
    };

    await chatRepository.saveMessage(msg2);
    await chatRepository.saveMessage(msg1);

    const messages = await chatRepository.getMessages(MAIN_THREAD_ID);
    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe("msg-1");
    expect(messages[1].id).toBe("msg-2");
  });

  it("should update message proposal status", async () => {
    const msg: ChatMessage = {
      id: "msg-prop",
      thread_id: MAIN_THREAD_ID,
      role: "assistant",
      content: "Proposta",
      proposal: {
        type: "delete_mission",
        mission_id: "mis-1",
        mission_title: "Missão Teste",
      },
      status: "pendente",
      created_at: new Date().toISOString(),
    };

    await chatRepository.saveMessage(msg);
    await chatRepository.updateMessageProposalStatus("msg-prop", "aprovada");

    const updated = await chatRepository.getMessages(MAIN_THREAD_ID);
    expect(updated[0].status).toBe("aprovada");
  });

  it("should clear thread messages", async () => {
    await chatRepository.saveMessage({
      id: "msg-to-delete",
      thread_id: MAIN_THREAD_ID,
      role: "user",
      content: "Conteúdo a ser limpo",
      created_at: new Date().toISOString(),
    });

    let messages = await chatRepository.getMessages(MAIN_THREAD_ID);
    expect(messages).toHaveLength(1);

    await chatRepository.clearThreadMessages(MAIN_THREAD_ID);
    messages = await chatRepository.getMessages(MAIN_THREAD_ID);
    expect(messages).toHaveLength(0);
  });
});
