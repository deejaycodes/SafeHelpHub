import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REPORT_EVENTS, NOTIFICATION_EVENTS } from 'src/common/events/event-names';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private ngoSockets = new Map<string, Set<string>>(); // ngoId -> Set<socketId>

  handleConnection(client: Socket) {
    const ngoId = client.handshake.query.ngoId as string;
    if (ngoId) {
      if (!this.ngoSockets.has(ngoId)) this.ngoSockets.set(ngoId, new Set());
      this.ngoSockets.get(ngoId).add(client.id);
      client.join(`ngo:${ngoId}`);
      this.logger.log(`NGO ${ngoId} connected (${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    const ngoId = client.handshake.query.ngoId as string;
    if (ngoId && this.ngoSockets.has(ngoId)) {
      this.ngoSockets.get(ngoId).delete(client.id);
      if (this.ngoSockets.get(ngoId).size === 0) this.ngoSockets.delete(ngoId);
    }
  }

  /** Notify specific NGOs to refresh their cases list */
  notifyNgos(ngoIds: string[], event: string, data?: any) {
    for (const ngoId of ngoIds) {
      this.server.to(`ngo:${ngoId}`).emit(event, data);
    }
  }

  /** Broadcast to all connected clients */
  broadcast(event: string, data?: any) {
    this.server.emit(event, data);
  }

  @OnEvent(NOTIFICATION_EVENTS.NGO_ALERT)
  handleNgoAlert(payload: any) {
    this.server.to(`ngo:${payload.ngoId}`).emit('notification', payload);
  }

  @OnEvent(REPORT_EVENTS.ANALYZED)
  handleReportAnalyzed(payload: any) {
    // All NGOs refresh — the assignment service will have updated ngo_dashboard_ids
    this.broadcast('cases:refresh');
  }
}
