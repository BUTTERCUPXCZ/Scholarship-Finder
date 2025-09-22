import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second

    connect(token: string) {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        this.socket = io(serverUrl, {
            auth: {
                token
            },
            transports: ['websocket', 'polling'],
            timeout: 5000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            autoConnect: true
        });

        this.setupEventListeners();
        return this.socket;
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to notification server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000; // Reset delay
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from notification server:', reason);
            this.isConnected = false;

            // Auto-reconnect with exponential backoff
            if (reason === 'io server disconnect') {
                // Server disconnected us, retry connection
                this.handleReconnection();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.handleReconnection();
        });

        // Handle ping/pong for connection health
        this.socket.on('pong', () => {
            console.log('Received pong from server');
        });
    }

    private handleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Cap at 30 seconds

        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (this.socket && !this.isConnected) {
                this.socket.connect();
            }
        }, this.reconnectDelay);
    }

    // Send periodic ping to check connection health
    ping() {
        if (this.socket && this.isConnected) {
            this.socket.emit('ping');
        }
    }

    onNewNotification(callback: (notification: any) => void) {
        if (this.socket) {
            this.socket.on('new_notification', callback);
        }
    }

    onNotificationUpdate(callback: (notification: any) => void) {
        if (this.socket) {
            this.socket.on('notification_updated', callback);
        }
    }

    onNotificationDeleted(callback: (data: { notificationId: string }) => void) {
        if (this.socket) {
            this.socket.on('notification_deleted', callback);
        }
    }

    offNewNotification(callback?: (notification: any) => void) {
        if (this.socket) {
            this.socket.off('new_notification', callback);
        }
    }

    offNotificationUpdate(callback?: (notification: any) => void) {
        if (this.socket) {
            this.socket.off('notification_updated', callback);
        }
    }

    offNotificationDeleted(callback?: (data: { notificationId: string }) => void) {
        if (this.socket) {
            this.socket.off('notification_deleted', callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.reconnectAttempts = 0;
        }
    }

    isSocketConnected(): boolean {
        return this.isConnected && this.socket?.connected === true;
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;