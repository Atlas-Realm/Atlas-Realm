import type { Context } from "hono";
import { successResponse } from "@/lib/response";
import type { JWTPayload } from "@/middleware/auth";
import type { IChatService } from "./chat.types";

export class ChatController {
  constructor(private readonly chatService: IChatService) {}

  listConversations = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const conversations = await this.chatService.getConversations(user.sub);
    return c.json(successResponse(conversations), 200);
  };

  getConversation = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { userId } = c.req.valid("param" as never) as { userId: string };
    const { limit, offset } = c.req.valid("query" as never) as { limit?: number; offset?: number };
    const messages = await this.chatService.getConversation(user.sub, userId, limit, offset);
    return c.json(successResponse(messages), 200);
  };

  send = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const body = c.req.valid("json" as never) as { receiverId: string; content: string };
    const message = await this.chatService.sendMessage(user.sub, body.receiverId, body.content);
    return c.json(successResponse(message), 201);
  };

  markRead = async (c: Context) => {
    const user = c.get("user") as JWTPayload;
    const { senderId } = c.req.valid("param" as never) as { senderId: string };
    const result = await this.chatService.markRead(user.sub, senderId);
    return c.json(successResponse(result), 200);
  };
}
