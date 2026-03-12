import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { REPORT_EVENTS } from '../events/event-names';

interface RetryTask {
  reportId: string;
  attempts: number;
  maxAttempts: number;
  lastAttempt: Date;
  payload: any;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private retryQueue: Map<string, RetryTask> = new Map();
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds

  constructor(private readonly eventEmitter: EventEmitter2) {
    // Start retry processor
    this.startRetryProcessor();
  }

  /**
   * Add a failed task to retry queue
   */
  addToRetryQueue(reportId: string, eventName: string, payload: any) {
    const existing = this.retryQueue.get(reportId);
    
    if (existing && existing.attempts >= this.MAX_ATTEMPTS) {
      this.logger.error(`Report ${reportId} exceeded max retry attempts (${this.MAX_ATTEMPTS})`);
      return;
    }

    this.retryQueue.set(reportId, {
      reportId,
      attempts: existing ? existing.attempts + 1 : 1,
      maxAttempts: this.MAX_ATTEMPTS,
      lastAttempt: new Date(),
      payload: { eventName, ...payload },
    });

    this.logger.warn(`Added report ${reportId} to retry queue (attempt ${existing ? existing.attempts + 1 : 1}/${this.MAX_ATTEMPTS})`);
  }

  /**
   * Remove from retry queue (success)
   */
  removeFromRetryQueue(reportId: string) {
    if (this.retryQueue.has(reportId)) {
      this.retryQueue.delete(reportId);
      this.logger.log(`Report ${reportId} removed from retry queue (success)`);
    }
  }

  /**
   * Process retry queue periodically
   */
  private startRetryProcessor() {
    setInterval(() => {
      const now = new Date();
      
      for (const [reportId, task] of this.retryQueue.entries()) {
        const timeSinceLastAttempt = now.getTime() - task.lastAttempt.getTime();
        
        if (timeSinceLastAttempt >= this.RETRY_DELAY_MS) {
          this.logger.log(`Retrying report ${reportId} (attempt ${task.attempts}/${task.maxAttempts})`);
          
          // Re-emit the event
          this.eventEmitter.emit(task.payload.eventName, task.payload);
          
          // Update last attempt time
          task.lastAttempt = now;
        }
      }
    }, this.RETRY_DELAY_MS);
  }

  /**
   * Get retry queue status
   */
  getRetryQueueStatus() {
    return {
      queueSize: this.retryQueue.size,
      tasks: Array.from(this.retryQueue.values()).map(task => ({
        reportId: task.reportId,
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
        lastAttempt: task.lastAttempt,
      })),
    };
  }
}
