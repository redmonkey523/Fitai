/**
 * Event tracking service for analytics and performance monitoring
 */

type EventPayload = Record<string, any>;

interface EventListener {
  (name: string, payload: EventPayload): void;
}

class EventService {
  private listeners: Map<string, EventListener[]> = new Map();
  private eventLog: Array<{ name: string; payload: EventPayload; ts: number }> = [];
  private maxLogSize = 100;

  /**
   * Emit an event with payload
   */
  emit(name: string, payload: EventPayload = {}): void {
    const event = { name, payload, ts: Date.now() };
    this.eventLog.push(event);

    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(name) || [];
    listeners.forEach((listener) => {
      try {
        listener(name, payload);
      } catch (error) {
        console.error(`[Events] Listener error for ${name}:`, error);
      }
    });

    // Log to console in dev mode
    if (__DEV__) {
      console.log(`[Event] ${name}`, payload);
    }
  }

  /**
   * Subscribe to an event
   */
  on(name: string, listener: EventListener): () => void {
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
    this.listeners.set(name, listeners);

    // Return unsubscribe function
    return () => {
      const current = this.listeners.get(name) || [];
      const filtered = current.filter((l) => l !== listener);
      if (filtered.length > 0) {
        this.listeners.set(name, filtered);
      } else {
        this.listeners.delete(name);
      }
    };
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(limit = 20): Array<{ name: string; payload: EventPayload; ts: number }> {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get duration metrics for specific event pairs
   */
  getDuration(startEvent: string, endEvent: string): number | null {
    const events = this.eventLog;
    const start = events.find((e) => e.name === startEvent);
    const end = events.findLast((e) => e.name === endEvent);

    if (start && end && end.ts > start.ts) {
      return end.ts - start.ts;
    }

    return null;
  }

  /**
   * Clear event log
   */
  clear(): void {
    this.eventLog = [];
  }
}

// Singleton instance
const eventService = new EventService();

export default eventService;
export { eventService };
