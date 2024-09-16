import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { v4 as uuidv4 } from 'uuid'; // For generating session IDs
import { CreateChatMessageDto } from './dto/createChats.dto';

@WebSocketGateway(3001)
export class ChatsGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly chatsService: ChatsService) {}

  @SubscribeMessage('joinChat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() { userId }: any) {
    let sessionId = client.handshake.query.sessionId || uuidv4(); 

    if (!userId) {
      client.handshake.query.sessionId = sessionId;
    }

    const room = userId || sessionId;

    client.join(room);
    client.join('customer-service');

    const messages = await this.chatsService.getMessages(userId, sessionId);
   client.emit('chatHistory', messages);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() messageData: CreateChatMessageDto,
    @ConnectedSocket() client: Socket,
  ) { 
  
    const { sender, content, userId, sessionId } = messageData;
  
    if (!sender || !content) {
        client.emit('error', { message: 'Sender and content are required' })
    }
  
    // Continue saving the message
    const savedMessage = await this.chatsService.saveMessage({
      sender,
      content,
      userId,
      sessionId,
    });
  
    client.emit('receiveMessage', savedMessage);
    this.server.to('customer-service').emit('receiveMessage', savedMessage);
  
    return savedMessage;
  }
  
  @SubscribeMessage('leaveChat')
  handleLeaveChat(@ConnectedSocket() client: Socket, @MessageBody() { userId }: any) {
    let sessionId = client.handshake.query.sessionId;
    const room = userId || sessionId;

    client.leave(room);
    client.leave('customer-service');

    this.server.to(room).emit('leftChat', `A user has left the chat.`);
  }
}
