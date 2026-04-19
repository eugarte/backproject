export interface IWebSocketService {
  emitToUser(userId: string, event: string, data: any): Promise<void>;
  emitToUsers(userIds: string[], event: string, data: any): Promise<void>;
  broadcast(event: string, data: any): void;
}
