import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { AppConfig } from "@/types/config.types";
import { UserData, Ticket, TicketSubmission } from "@/types/ticket.types";
import { ExportFilters } from "@/types/export.types";

interface TicketingStore {
  // Configuration
  appConfig: AppConfig | null;
  setAppConfig: (config: AppConfig) => void;

  // User Data
  currentUser: UserData | null;
  setCurrentUser: (user: UserData) => void;
  clearCurrentUser: () => void;

  // Ticket Data
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  removeTicket: (ticketId: string) => void;

  // UI State
  isTicketFormOpen: boolean;
  isExportModalOpen: boolean;
  isLoading: boolean;
  error: string | null;

  setTicketFormOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Form Data
  currentTicketData: Partial<TicketSubmission> | null;
  setCurrentTicketData: (data: Partial<TicketSubmission>) => void;
  clearCurrentTicketData: () => void;

  // Export State
  exportFilters: ExportFilters;
  setExportFilters: (filters: ExportFilters) => void;
  exportProgress: number;
  setExportProgress: (progress: number) => void;

  // Methods
  createTicket: (ticketData: TicketSubmission) => Promise<void>;
  exportTickets: (filters: ExportFilters) => Promise<void>;
  loadUserTickets: () => Promise<void>;
  reset: () => void;
}

export const useTicketingStore = create<TicketingStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        appConfig: null,
        currentUser: null,
        tickets: [],
        isTicketFormOpen: false,
        isExportModalOpen: false,
        isLoading: false,
        error: null,
        currentTicketData: null,
        exportFilters: {},
        exportProgress: 0,

        // Configuration methods
        setAppConfig: (config) => set({ appConfig: config }),

        // User methods
        setCurrentUser: (user) => set({ currentUser: user }),
        clearCurrentUser: () => set({ currentUser: null }),

        // Ticket methods
        setTickets: (tickets) => set({ tickets }),
        addTicket: (ticket) =>
          set((state) => ({ tickets: [...state.tickets, ticket] })),
        updateTicket: (ticketId, updates) =>
          set((state) => ({
            tickets: state.tickets.map((ticket) =>
              ticket.id === ticketId ? { ...ticket, ...updates } : ticket
            ),
          })),
        removeTicket: (ticketId) =>
          set((state) => ({
            tickets: state.tickets.filter((ticket) => ticket.id !== ticketId),
          })),

        // UI methods
        setTicketFormOpen: (open) => set({ isTicketFormOpen: open }),
        setExportModalOpen: (open) => set({ isExportModalOpen: open }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),

        // Form methods
        setCurrentTicketData: (data) => set({ currentTicketData: data }),
        clearCurrentTicketData: () => set({ currentTicketData: null }),

        // Export methods
        setExportFilters: (filters) => set({ exportFilters: filters }),
        setExportProgress: (progress) => set({ exportProgress: progress }),

        // Async methods
        createTicket: async (ticketData) => {
          const { setLoading, setError, appConfig } = get();

          if (!appConfig) {
            setError("App configuration not found");
            return;
          }

          try {
            setLoading(true);
            setError(null);

            // Import service dynamically to avoid circular dependency
            const { TicketService } = await import("@/services/ticketService");
            await TicketService.createTicket(ticketData, appConfig);

            // Close form on success
            set({ isTicketFormOpen: false, currentTicketData: null });
          } catch (error) {
            console.error("Error creating ticket:", error);
            setError(
              error instanceof Error ? error.message : "Failed to create ticket"
            );
          } finally {
            setLoading(false);
          }
        },

        exportTickets: async (filters) => {
          const { setLoading, setError, setExportProgress, appConfig } = get();

          if (!appConfig) {
            setError("App configuration not found");
            return;
          }

          try {
            setLoading(true);
            setError(null);
            setExportProgress(0);

            // Import service dynamically
            const { ExportService } = await import("@/services/exportService");
            await ExportService.exportTickets(
              filters,
              appConfig,
              setExportProgress
            );

            // Close modal on success
            set({ isExportModalOpen: false });
          } catch (error) {
            console.error("Error exporting tickets:", error);
            setError(
              error instanceof Error
                ? error.message
                : "Failed to export tickets"
            );
          } finally {
            setLoading(false);
            setExportProgress(0);
          }
        },

        loadUserTickets: async () => {
          const { setLoading, setError, setTickets, currentUser, appConfig } =
            get();

          if (!currentUser || !appConfig) {
            return;
          }

          try {
            setLoading(true);
            setError(null);

            // Import service dynamically
            const { TicketService } = await import("@/services/ticketService");
            const tickets = await TicketService.getUserTickets(
              currentUser.userId,
              appConfig
            );
            setTickets(tickets);
          } catch (error) {
            console.error("Error loading tickets:", error);
            setError(
              error instanceof Error ? error.message : "Failed to load tickets"
            );
          } finally {
            setLoading(false);
          }
        },

        // Reset store
        reset: () =>
          set({
            appConfig: null,
            currentUser: null,
            tickets: [],
            isTicketFormOpen: false,
            isExportModalOpen: false,
            isLoading: false,
            error: null,
            currentTicketData: null,
            exportFilters: {},
            exportProgress: 0,
          }),
      }),
      {
        name: "ticketing-store",
        partialize: (state) => ({
          appConfig: state.appConfig,
          currentUser: state.currentUser,
          exportFilters: state.exportFilters,
        }),
      }
    ),
    {
      name: "ticketing",
    }
  )
);

// Selectors for better performance
export const useAppConfig = () => useTicketingStore((state) => state.appConfig);
export const useCurrentUser = () =>
  useTicketingStore((state) => state.currentUser);
export const useTickets = () => useTicketingStore((state) => state.tickets);
export const useUIState = () =>
  useTicketingStore((state) => ({
    isTicketFormOpen: state.isTicketFormOpen,
    isExportModalOpen: state.isExportModalOpen,
    isLoading: state.isLoading,
    error: state.error,
  }));
export const useExportState = () =>
  useTicketingStore((state) => ({
    exportFilters: state.exportFilters,
    exportProgress: state.exportProgress,
  }));
