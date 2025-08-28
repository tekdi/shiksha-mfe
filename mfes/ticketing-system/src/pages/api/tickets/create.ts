import { NextApiRequest, NextApiResponse } from "next";

interface TicketData {
  userId: string;
  username: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  timestamp: string;
  source: string;
  appName: string;
}

// Zoho Desk ticket creation payload format
interface ZohoTicketPayload {
  subject: string;
  description: string;
  priority: string;
  status: string;
  contactId?: string;
  departmentId?: string;
  email?: string;
  phone?: string;
  customFields?: Record<string, any>;
}

// Zoho contact creation payload
interface ZohoContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ticketData: TicketData = req.body;

    // Validate required fields
    if (!ticketData.subject || !ticketData.description || !ticketData.email) {
      return res.status(400).json({
        error: "Missing required fields: subject, description, email",
      });
    }

    // Zoho Desk configuration based on the curl example format
    const zohoConfig = {
      orgId: process.env.ZOHO_ORG_ID,
      accessToken: process.env.ZOHO_ACCESS_TOKEN,
      apiUrl: "https://desk.zoho.com/api/v1",
      departmentId: process.env.ZOHO_DEPT_ID,
    };

    // Check if Zoho configuration is available
    if (!zohoConfig.accessToken || !zohoConfig.orgId) {
      console.log("Zoho API not configured, logging ticket locally");

      const ticketId = `TKT-LOCAL-${Date.now()}`;
      console.log("Ticket created locally:", {
        ticketId,
        ...ticketData,
      });

      return res.status(200).json({
        success: true,
        ticketId,
        message:
          "Ticket created successfully (local mode - Zoho not configured)",
        method: "local",
        note: "Configure ZOHO_ORG_ID and ZOHO_ACCESS_TOKEN environment variables for real Zoho integration",
      });
    }

    console.log("Using Zoho configuration:", {
      orgId: zohoConfig.orgId,
      apiUrl: zohoConfig.apiUrl,
      hasToken: !!zohoConfig.accessToken,
    });

    // Step 1: Search for existing contact by email
    let contactId;
    try {
      console.log("Searching for existing contact...");

      const contactSearchUrl = `${
        zohoConfig.apiUrl
      }/contacts/search?email=${encodeURIComponent(ticketData.email)}`;
      console.log("Contact search URL:", contactSearchUrl);

      const contactSearchResponse = await fetch(contactSearchUrl, {
        method: "GET",
        headers: {
          orgId: zohoConfig.orgId,
          Authorization: `oauthtoken ${zohoConfig.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Contact search status:", contactSearchResponse.status);

      if (contactSearchResponse.ok) {
        const contactData = await contactSearchResponse.json();
        console.log("Contact search response:", contactData);

        if (contactData.data && contactData.data.length > 0) {
          contactId = contactData.data[0].id;
          console.log("Found existing contact:", contactId);
        }
      } else {
        const errorData = await contactSearchResponse.text();
        console.log(
          "Contact search failed:",
          contactSearchResponse.status,
          errorData
        );
      }
    } catch (error) {
      console.log("Contact search error:", error);
    }

    // Step 2: Create contact if not found
    if (!contactId) {
      try {
        console.log("Creating new contact...");
        const nameParts = ticketData.username.split(" ");
        const contactPayload: ZohoContactPayload = {
          firstName: nameParts[0] || "Unknown",
          lastName: nameParts.slice(1).join(" ") || "User",
          email: ticketData.email,
          ...(ticketData.phone && { phone: ticketData.phone }),
        };

        console.log("Contact payload:", contactPayload);

        const contactCreateResponse = await fetch(
          `${zohoConfig.apiUrl}/contacts`,
          {
            method: "POST",
            headers: {
              orgId: zohoConfig.orgId,
              Authorization: `oauthtoken ${zohoConfig.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(contactPayload),
          }
        );

        console.log("Contact creation status:", contactCreateResponse.status);

        if (contactCreateResponse.ok) {
          const newContactData = await contactCreateResponse.json();
          contactId = newContactData.id;
          console.log("Created new contact:", contactId);
        } else {
          const errorData = await contactCreateResponse.text();
          console.log(
            "Contact creation failed:",
            contactCreateResponse.status,
            errorData
          );
        }
      } catch (error) {
        console.log("Contact creation error:", error);
      }
    }

    // Step 3: Create ticket using exact Zoho format
    const ticketPayload: ZohoTicketPayload = {
      subject: ticketData.subject,
      description: ticketData.description,
      priority:
        ticketData.priority.charAt(0).toUpperCase() +
        ticketData.priority.slice(1), // Capitalize first letter
      status: "Open",
      ...(contactId && { contactId }),
      ...(zohoConfig.departmentId && { departmentId: zohoConfig.departmentId }),
      // Include email and phone for cases where contact creation failed
      ...(!contactId && {
        email: ticketData.email,
        ...(ticketData.phone && { phone: ticketData.phone }),
      }),
    };

    console.log(
      "Creating ticket with payload:",
      JSON.stringify(ticketPayload, null, 2)
    );

    // Use the exact curl format for ticket creation
    const ticketCreateUrl = `${zohoConfig.apiUrl}/tickets`;
    console.log("Ticket creation URL:", ticketCreateUrl);

    const ticketResponse = await fetch(ticketCreateUrl, {
      method: "POST",
      headers: {
        orgId: zohoConfig.orgId,
        Authorization: `oauthtoken ${zohoConfig.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketPayload),
    });

    console.log("Zoho ticket creation status:", ticketResponse.status);

    if (!ticketResponse.ok) {
      const errorData = await ticketResponse.text();
      console.error("Zoho ticket creation error:", errorData);

      // Try to parse error as JSON
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch (e) {
        parsedError = { message: errorData };
      }

      return res.status(ticketResponse.status).json({
        error: "Zoho API Error",
        status: ticketResponse.status,
        details: parsedError,
        message: `Failed to create ticket in Zoho Desk: ${
          parsedError.message || errorData
        }`,
        troubleshooting: {
          checkOrgId: `Verify ZOHO_ORG_ID is correct (currently: ${zohoConfig.orgId})`,
          checkToken: "Verify ZOHO_ACCESS_TOKEN is valid and not expired",
          checkScope: "Ensure token has Desk.tickets.CREATE scope",
          checkDepartment: "Verify ZOHO_DEPT_ID if provided",
          curlTest: `Test with: curl -X GET ${
            zohoConfig.apiUrl
          }/tickets -H "orgId:${
            zohoConfig.orgId
          }" -H "Authorization:oauthtoken ${zohoConfig.accessToken.substring(
            0,
            20
          )}..."`,
        },
      });
    }

    const zohoTicketData = await ticketResponse.json();
    console.log("Ticket created successfully:", zohoTicketData);

    return res.status(200).json({
      success: true,
      ticketId: zohoTicketData.ticketNumber || zohoTicketData.id,
      zohoTicketId: zohoTicketData.id,
      contactId: contactId,
      message: "Ticket created successfully in Zoho Desk",
      method: "zoho_api",
      ticketData: zohoTicketData,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);

    const fallbackTicketId = `TKT-ERROR-${Date.now()}`;

    console.log("Ticket logged locally (API failed):", {
      ticketId: fallbackTicketId,
      ...req.body,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return res.status(500).json({
      error: "Failed to create ticket",
      fallbackTicketId,
      message: "Ticket logged locally for manual processing",
      details: error instanceof Error ? error.message : "Unknown error",
      troubleshooting: {
        networkIssue: "Check internet connection",
        serverError: "Zoho Desk API might be down",
        configIssue: "Verify all environment variables are set correctly",
        testConnection: "Test API connection with provided curl command",
      },
    });
  }
}
