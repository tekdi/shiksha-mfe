import { useState, useEffect, useCallback } from "react";

interface ZohoTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdTime: string;
  modifiedTime: string;
  departmentId?: string;
  contactId?: string;
  assigneeId?: string;
  category?: string;
  email?: string;
  phone?: string;
}

interface TicketListResponse {
  success: boolean;
  tickets: ZohoTicket[];
  totalRecords?: number;
  from?: number;
  limit?: number;
  hasMore?: boolean;
  method: "zoho_api" | "local";
  message?: string;
}

interface UseTicketListProps {
  limit?: number;
  autoFetch?: boolean;
  filters?: {
    priority?: string;
    status?: string;
  };
}

export const useTicketList = ({
  limit = 20,
  autoFetch = false,
  filters,
}: UseTicketListProps = {}) => {
  const [tickets, setTickets] = useState<ZohoTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true); // Default to true
  const [from, setFrom] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchTickets = useCallback(
    async (fromIndex = 0, reset = false) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: limit.toString(),
          from: fromIndex.toString(),
        });

        // Add filters to params
        if (filters?.priority) {
          params.append("priority", filters.priority);
        }
        if (filters?.status) {
          params.append("status", filters.status);
        }

        console.log(
          `Fetching tickets: from=${fromIndex}, limit=${limit}, reset=${reset}, filters=`,
          filters
        );

        const response = await fetch(
          `/mfe_ticketing/api/tickets/list?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tickets");
        }

        const data: TicketListResponse = await response.json();
        console.log("API Response:", data);

        if (data.success) {
          setTickets((prev) => {
            const newTickets = reset
              ? data.tickets
              : [...prev, ...data.tickets];
            console.log(`Updated tickets: ${newTickets.length} total`);
            return newTickets;
          });

          // Set hasMore based on API response or data availability
          const hasMoreData = data.hasMore || false;
          setHasMore(hasMoreData);
          setTotalRecords(data.totalRecords || 0);

          // Update from index for next fetch
          const newFromIndex = reset
            ? data.tickets.length
            : fromIndex + data.tickets.length;
          setFrom(newFromIndex);

          console.log(
            `Pagination state: hasMore=${hasMoreData}, totalRecords=${data.totalRecords}, nextFrom=${newFromIndex}, returnedCount=${data.tickets.length}`
          );
        } else {
          throw new Error(data.message || "Failed to fetch tickets");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching tickets:", err);
        // On error, keep hasMore as it was to allow retry
      } finally {
        setLoading(false);
      }
    },
    [limit, filters]
  );

  const loadMore = useCallback(() => {
    console.log(
      `loadMore called: loading=${loading}, hasMore=${hasMore}, from=${from}`
    );
    if (!loading && hasMore) {
      fetchTickets(from, false);
    } else {
      console.log("Load more skipped:", { loading, hasMore, from });
    }
  }, [fetchTickets, from, hasMore, loading]);

  const refresh = useCallback(() => {
    console.log("Refreshing tickets list with filters:", filters);
    setTickets([]);
    setFrom(0);
    setHasMore(true); // Reset to true when refreshing
    fetchTickets(0, true);
  }, [fetchTickets]);

  // Auto-refresh when filters change
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // Refresh when filters change (but only if we have data already)
  useEffect(() => {
    if (tickets.length > 0 || loading) {
      refresh();
    }
  }, [filters?.priority, filters?.status]); // Only depend on filter values

  return {
    tickets,
    loading,
    error,
    hasMore,
    totalRecords,
    fetchTickets: () => fetchTickets(0, true),
    loadMore,
    refresh,
  };
};
