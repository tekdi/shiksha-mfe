import { NextApiRequest, NextApiResponse } from "next";

interface TicketListParams {
  limit?: number;
  from?: number;
  status?: string;
  priority?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchText?: string;
  email?: string;
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    TicketListResponse | { error: string; [key: string]: any }
  >
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse query parameters
    const {
      limit = 50,
      from = 0,
      status,
      priority,
      department,
      searchText,
      email,
    } = req.query as Partial<TicketListParams & { [key: string]: string }>;

    // Validate limit parameter
    const numericLimit = Math.min(
      Math.max(parseInt(limit.toString()) || 50, 1),
      200
    );
    const numericFrom = Math.max(parseInt(from.toString()) || 0, 0);
    const NEXT_PUBLIC_ZOHO_PORTAL_URL =
      process.env.NEXT_PUBLIC_ZOHO_PORTAL_URL || "https://desk.zoho.in";

    // Zoho Desk configuration
    const zohoConfig = {
      orgId: process.env.ZOHO_ORG_ID,
      accessToken: process.env.ZOHO_ACCESS_TOKEN,
      apiUrl: `${NEXT_PUBLIC_ZOHO_PORTAL_URL}/api/v1`,
      departmentId: process.env.ZOHO_DEPT_ID,
    };
    console.log("zohoConfig", zohoConfig);
    // Check if Zoho configuration is available
    if (!zohoConfig.accessToken || !zohoConfig.orgId) {
      console.log("Zoho API not configured, returning mock ticket data");

      // Return mock data when Zoho is not configured
      const mockTickets: ZohoTicket[] = [
        {
          id: "1001",
          ticketNumber: "TKT-LOCAL-001",
          subject: "Sample Ticket 1",
          description: "This is a sample ticket for demonstration",
          status: "Open",
          priority: "High",
          createdTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          modifiedTime: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          email: "user1@example.com",
          category: "Technical Support",
        },
        {
          id: "1002",
          ticketNumber: "TKT-LOCAL-002",
          subject: "Sample Ticket 2",
          description: "Another sample ticket",
          status: "In Progress",
          priority: "Medium",
          createdTime: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          modifiedTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          email: "user2@example.com",
          category: "General Inquiry",
        },
      ];

      // Apply basic filtering on mock data
      let filteredTickets = mockTickets;
      if (status) {
        filteredTickets = filteredTickets.filter(
          (ticket) => ticket.status.toLowerCase() === status.toLowerCase()
        );
      }
      if (priority) {
        filteredTickets = filteredTickets.filter(
          (ticket) => ticket.priority.toLowerCase() === priority.toLowerCase()
        );
      }
      if (email) {
        filteredTickets = filteredTickets.filter((ticket) =>
          ticket.email?.toLowerCase().includes(email.toLowerCase())
        );
      }

      // Apply pagination
      const paginatedTickets = filteredTickets.slice(
        numericFrom,
        numericFrom + numericLimit
      );

      return res.status(200).json({
        success: true,
        tickets: paginatedTickets,
        totalRecords: filteredTickets.length,
        from: numericFrom,
        limit: numericLimit,
        hasMore: numericFrom + numericLimit < filteredTickets.length,
        method: "local",
        message:
          "Mock ticket data (Zoho not configured). Configure ZOHO_ORG_ID and ZOHO_ACCESS_TOKEN environment variables for real Zoho integration",
      });
    }

    console.log("Fetching tickets from Zoho Desk...");

    // Build Zoho API URL with query parameters
    const apiUrl = new URL(`${zohoConfig.apiUrl}/tickets`);

    // Add pagination parameters
    apiUrl.searchParams.append("limit", numericLimit.toString());
    apiUrl.searchParams.append("from", numericFrom.toString());

    // Add sorting parameters
    // apiUrl.searchParams.append("sortBy", sortBy);
    // apiUrl.searchParams.append("sortOrder", sortOrder);

    // Add filter parameters if provided
    if (status) {
      apiUrl.searchParams.append("status", status);
    }
    if (priority) {
      apiUrl.searchParams.append("priority", priority);
    }
    if (department || zohoConfig.departmentId) {
      apiUrl.searchParams.append(
        "departmentId",
        department || zohoConfig.departmentId!
      );
    }
    if (searchText) {
      apiUrl.searchParams.append("searchStr", searchText);
    }
    if (email) {
      apiUrl.searchParams.append("email", email);
    }

    console.log("Zoho API URL:", apiUrl.toString());

    // Make request to Zoho Desk API
    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        orgId: zohoConfig.orgId,
        Authorization: `Zoho-oauthtoken ${zohoConfig.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Zoho API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Zoho API error:", errorData);

      // Try to parse error as JSON
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch (e) {
        parsedError = { message: errorData };
      }

      return res.status(response.status).json({
        error: "Zoho API Error",
        status: response.status,
        details: parsedError,
        message: `Failed to fetch tickets from Zoho Desk: ${
          parsedError.message || errorData
        }`,
        // troubleshooting: {
        //   checkOrgId: `Verify ZOHO_ORG_ID is correct (currently: ${zohoConfig.orgId})`,
        //   checkToken:
        //     "Verify ZOHO_ACCESS_TOKEN is valid and not expired (currently: " +
        //     zohoConfig.accessToken +
        //     ")",
        //   checkScope: "Ensure token has Desk.tickets.READ scope",
        //   checkDepartment: `Verify ZOHO_DEPT_ID if provided (currently: ${zohoConfig.departmentId})`,
        //   curlTest: `Test with: curl -X GET ${apiUrl.toString()} -H "orgId:${
        //     zohoConfig.orgId
        //   }" -H Authorization:Zoho-oauthtoken ${zohoConfig.accessToken.substring(
        //     0,
        //     20
        //   )}..."`,
        // },
      });
    }

    const zohoResponse = await response.json();

    // Set hasMore based on API response or data availability
    let hasMoreData = true;
    if (zohoResponse.hasMore !== undefined) {
      // Use API's hasMore if provided
      hasMoreData = zohoResponse.hasMore;
    } else if (zohoResponse.data.length === 0) {
      // No tickets returned, no more data
      hasMoreData = false;
    } else if (zohoResponse.data.length < numericLimit) {
      // Returned fewer tickets than requested, likely last page
      hasMoreData = false;
    } else if (zohoResponse.totalRecords !== undefined) {
      // Check against total records if available
      const currentTotal = numericFrom
        ? zohoResponse.data.length
        : numericFrom + zohoResponse.data.length;
      hasMoreData = currentTotal < zohoResponse.totalRecords;
    }

    // Transform Zoho response to our format
    const tickets: ZohoTicket[] = zohoResponse.data || [];

    return res.status(200).json({
      success: true,
      tickets,
      totalRecords: zohoResponse.totalRecords,
      from: numericFrom,
      limit: numericLimit,
      hasMore: hasMoreData,
      method: "zoho_api",
      message: "Tickets fetched successfully from Zoho Desk",
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);

    return res.status(500).json({
      error: "Failed to fetch tickets",
      message: "An error occurred while fetching tickets",
      details: error instanceof Error ? error.message : "Unknown error",
      troubleshooting: {
        networkIssue: "Check internet connection",
        serverError: "Zoho Desk API might be down",
        configIssue: "Verify all environment variables are set correctly",
        retryAdvice: "Please try again in a few moments",
      },
    });
  }
}
