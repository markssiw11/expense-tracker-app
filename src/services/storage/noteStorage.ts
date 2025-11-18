import AsyncStorage from "@react-native-async-storage/async-storage";
import { Note } from "../../types";

const STORAGE_KEY = "@expense_tracker:notes";

class NoteStorageService {
  /**
   * Save notes array to AsyncStorage
   */
  async saveNotes(notes: Note[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(notes);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error("Error saving notes:", error);
      throw new Error("Failed to save notes");
    }
  }

  /**
   * Load notes from AsyncStorage
   */
  async loadNotes(): Promise<Note[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue === null) {
        return [];
      }
      const notes = JSON.parse(jsonValue);

      // Validate data structure
      if (!Array.isArray(notes)) {
        console.warn("Invalid notes data structure, returning empty array");
        return [];
      }

      return notes;
    } catch (error) {
      console.error("Error loading notes:", error);
      throw new Error("Failed to load notes");
    }
  }

  /**
   * Add a single note
   */
  async addNote(note: Note): Promise<void> {
    try {
      const notes = await this.loadNotes();
      notes.push(note);
      await this.saveNotes(notes);
    } catch (error) {
      console.error("Error adding note:", error);
      throw new Error("Failed to add note");
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(id: string, updatedNote: Partial<Note>): Promise<void> {
    try {
      const notes = await this.loadNotes();
      const index = notes.findIndex((n) => n.id === id);

      if (index === -1) {
        throw new Error("Note not found");
      }

      notes[index] = {
        ...notes[index],
        ...updatedNote,
        id, // Ensure id doesn't change
        updatedAt: new Date().toISOString(),
      };

      await this.saveNotes(notes);
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note");
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.loadNotes();
      const filteredNotes = notes.filter((n) => n.id !== id);

      if (filteredNotes.length === notes.length) {
        throw new Error("Note not found");
      }

      await this.saveNotes(filteredNotes);
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error("Failed to delete note");
    }
  }

  /**
   * Search notes by query (title, content, tags)
   */
  async searchNotes(query: string): Promise<Note[]> {
    try {
      const notes = await this.loadNotes();
      const lowerQuery = query.toLowerCase();

      return notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(lowerQuery);
        const contentMatch = note.content.toLowerCase().includes(lowerQuery);
        const tagsMatch =
          note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
          false;

        return titleMatch || contentMatch || tagsMatch;
      });
    } catch (error) {
      console.error("Error searching notes:", error);
      throw new Error("Failed to search notes");
    }
  }
}

export default new NoteStorageService();
