import { useMemo, useCallback } from "react";
import { useTicketingStore } from "@/store/ticketingStore";
import { checkPermission } from "@/utils/roleUtils";
import { TicketSubmission } from "@/types/ticket.types";
import { ExportFilters } from "@/types/export.types";

export const useTicketing = () => {
  const store = useTicketingStore();
  const { appConfig, currentUser } = store;

  // Permission checks
  const canCreateTicket = useMemo(() => {
    return checkPermission("createTicket", appConfig, currentUser);
  }, [appConfig, currentUser]);

  const canExportData = useMemo(() => {
    return checkPermission("exportTickets", appConfig, currentUser);
  }, [appConfig, currentUser]);

  const canManageTickets = useMemo(() => {
    return checkPermission("manageTickets", appConfig, currentUser);
  }, [appConfig, currentUser]);

  const canViewTickets = useMemo(() => {
    return checkPermission("viewTickets", appConfig, currentUser);
  }, [appConfig, currentUser]);

  // Feature availability
  const isTicketCreationEnabled = useMemo(() => {
    return appConfig?.features.ticketCreation === true;
  }, [appConfig]);

  const isExportEnabled = useMemo(() => {
    return appConfig?.features.csvExport === true;
  }, [appConfig]);

  const isManagementEnabled = useMemo(() => {
    return appConfig?.features.ticketManagement === true;
  }, [appConfig]);

  // Actions
  const openTicketForm = useCallback(() => {
    store.setTicketFormOpen(true);
  }, [store]);

  const closeTicketForm = useCallback(() => {
    store.setTicketFormOpen(false);
    store.clearCurrentTicketData();
  }, [store]);

  const openExportModal = useCallback(() => {
    store.setExportModalOpen(true);
  }, [store]);

  const closeExportModal = useCallback(() => {
    store.setExportModalOpen(false);
  }, [store]);

  const createTicket = useCallback(
    async (ticketData: TicketSubmission) => {
      await store.createTicket(ticketData);
    },
    [store]
  );

  const exportTickets = useCallback(
    async (filters: ExportFilters) => {
      await store.exportTickets(filters);
    },
    [store]
  );

  const loadTickets = useCallback(async () => {
    await store.loadUserTickets();
  }, [store]);

  const updateTicketData = useCallback(
    (data: Partial<TicketSubmission>) => {
      store.setCurrentTicketData(data);
    },
    [store]
  );

  const clearError = useCallback(() => {
    store.setError(null);
  }, [store]);

  // App categories
  const categories = useMemo(() => {
    return appConfig?.categories || [];
  }, [appConfig]);

  return {
    // State
    appConfig,
    currentUser,
    tickets: store.tickets,
    isLoading: store.isLoading,
    error: store.error,
    currentTicketData: store.currentTicketData,

    // UI State
    isTicketFormOpen: store.isTicketFormOpen,
    isExportModalOpen: store.isExportModalOpen,
    exportProgress: store.exportProgress,

    // Permissions
    canCreateTicket,
    canExportData,
    canManageTickets,
    canViewTickets,

    // Features
    isTicketCreationEnabled,
    isExportEnabled,
    isManagementEnabled,

    // Data
    categories,

    // Actions
    openTicketForm,
    closeTicketForm,
    openExportModal,
    closeExportModal,
    createTicket,
    exportTickets,
    loadTickets,
    updateTicketData,
    clearError,

    // Store methods for advanced usage
    setAppConfig: store.setAppConfig,
    setCurrentUser: store.setCurrentUser,
    reset: store.reset,
  };
};
