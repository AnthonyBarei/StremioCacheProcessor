import * as fs from 'fs-extra';
import { Server as SocketIOServer } from 'socket.io';

interface CopyTask {
    source: string;
    destination: string;
}

class CopyManager {
    private io: SocketIOServer;
    private copyQueue: CopyTask[] = [];
    private concurrentCopies: number = 0;
    private maxConcurrentCopies: number = 5; // Adjust based on system capabilities

    constructor(io: SocketIOServer) {
        this.io = io;
    }

    public enqueueCopy(source: string, destination: string): void {
        this.copyQueue.push({ source, destination });
        this.processQueue();
    }

    private async processQueue(): Promise<void> {
        if (this.concurrentCopies < this.maxConcurrentCopies && this.copyQueue.length > 0) {
            const task = this.copyQueue.shift();
            if (task) {
                this.concurrentCopies++;
                this.copy(task.source, task.destination).finally(() => {
                    this.concurrentCopies--;
                    this.processQueue(); // Process the next task in the queue
                });
            }
        }
    }

    private async copy(source: string, destination: string): Promise<void> {
        try {
            this.io.emit('copy:start', { source, destination });
            await fs.copy(source, destination, {
                filter: (src, dest) => {
                    return true; // Customizable filter function
                }
            });
            console.log('Copied successfully');
            this.io.emit('copy:complete', { source, destination, status: 'success' });
        } catch (error: any) {
            console.error('Copy operation failed:', error);
            this.io.emit('copy:error', { source, destination, status: 'error', error: error.message });
        }
    }
}

export default CopyManager;