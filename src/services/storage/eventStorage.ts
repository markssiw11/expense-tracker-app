import AsyncStorage from "@react-native-async-storage/async-storage";
import { Event } from "../../types/event.types";

const STORAGE_KEY = "@expense_tracker:events";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

class EventStorageService {
  /**
   * Retry helper function for storage operations
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    attempts: number = MAX_RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Storage operation failed (attempt ${i + 1}/${attempts}):`,
          lastError.message
        );

        // Wait before retrying (except on last attempt)
        if (i < attempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * (i + 1))
          );
        }
      }
    }

    throw lastError || new Error("Operation failed after retries");
  }

  /**
   * Validate event object structure
   */
  private isValidEvent(event: any): event is Event {
    return (
      event &&
      typeof event === "object" &&
      typeof event.id === "string" &&
      typeof event.title === "string" &&
      typeof event.date === "string" &&
      typeof event.time === "string" &&
      typeof event.category === "string" &&
      typeof event.reminderEnabled === "boolean" &&
      typeof event.reminderMinutes === "number" &&
      typeof event.createdAt === "string" &&
      typeof event.updatedAt === "string"
    );
  }

  /**
   * Sanitize and validate events array
   */
  private sanitizeEvents(data: any): Event[] {
    if (!Array.isArray(data)) {
      console.warn("Invalid events data structure, expected array");
      return [];
    }

    const validEvents = data.filter((event) => {
      const isValid = this.isValidEvent(event);
      if (!isValid) {
        console.warn("Skipping invalid event:", event);
      }
      return isValid;
    });

    return validEvents;
  }

  /**
   * Save events array to AsyncStorage with retry mechanism
   */
  async saveEvents(events: Event[]): Promise<void> {
    try {
      await this.retryOperation(async () => {
        const jsonValue = JSON.stringify(events);
        await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      });
    } catch (error) {
      console.error("Error saving events after retries:", error);
      throw new Error(
        "Không thể lưu sự kiện. Vui lòng kiểm tra bộ nhớ thiết bị."
      );
    }
  }

  /**
   * Load events from AsyncStorage with retry mechanism and data validation
   */
  async loadEvents(): Promise<Event[]> {
    try {
      return await this.retryOperation(async () => {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (jsonValue === null) {
          return [];
        }

        try {
          const parsedData = JSON.parse(jsonValue);
          return this.sanitizeEvents(parsedData);
        } catch (parseError) {
          console.error("Error parsing events data:", parseError);
          // Corrupted data - backup and clear
          await this.backupCorruptedData(jsonValue);
          return [];
        }
      });
    } catch (error) {
      console.error("Error loading events after retries:", error);
      throw new Error(
        "Không thể tải sự kiện. Vui lòng kiểm tra kết nối và thử lại."
      );
    }
  }

  /**
   * Backup corrupted data for debugging
   */
  private async backupCorruptedData(corruptedData: string): Promise<void> {
    try {
      const backupKey = `${STORAGE_KEY}_corrupted_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, corruptedData);
      console.log("Corrupted data backed up to:", backupKey);
    } catch (error) {
      console.error("Failed to backup corrupted data:", error);
    }
  }

  /**
   * Clear all events from AsyncStorage with retry mechanism
   */
  async clearEvents(): Promise<void> {
    try {
      await this.retryOperation(async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);
      });
    } catch (error) {
      console.error("Error clearing events after retries:", error);
      throw new Error("Không thể xóa dữ liệu sự kiện.");
    }
  }
}

export default new EventStorageService();
