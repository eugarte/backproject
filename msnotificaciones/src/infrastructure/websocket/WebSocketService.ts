import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { IWebSocketService } from './IWebSocketService';
import { LoggerService } from '../logging/LoggerService';

export class WebSocketService implements IWebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.WS_CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupHandlers();
    LoggerService.info('WebSocket server initialized');
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      LoggerService.info(`Client connected: ${socket.id}`);

      // Register user connection
      socket.on('register', (userId: string) => {
        const sockets = this.userSockets.get(userId) || [];
        sockets.push(socket.id);
        this.userSockets.set(userId, sockets);
        LoggerService.info(`User ${userId} registered with socket ${socket.id}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        // Remove socket from all user registrations
        this.userSockets.forEach((sockets, userId) => {
          const index = sockets.indexOf(socket.id);
          if (index > -1) {
            sockets.splice(index, 1);
            if (sockets.length === 0) {
              this.userSockets.delete(userId);
            }
          }
        });
        LoggerService.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  async emitToUser(userId: string, event: string, data: any): Promise<void> {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  async emitToUsers(userIds: string[], event: string, data: any): Promise<void> {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
