/* eslint-disable @nx/enforce-module-boundaries */
import Cors from "cors";
import initMiddleware from "@workspace/utils/init-middleware";
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const cors = initMiddleware(
  Cors({
    origin: "*",
    methods: ["*"],
    credentials: true,
  })
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await cors(req, res); // Run the middleware
  const TELEMETRY_URL = process.env.NEXT_PUBLIC_TELEMETRY_URL;

  if (!TELEMETRY_URL) {
    return res.status(500).json({ message: "Telemetry URL not configured" });
  }

  if (req.method === "POST") {
    try {
      const { event } = req.body;

      if (!event) {
        return res.status(400).json({ message: "Missing event parameter" });
      }

      if (event) {
        const eventObject = JSON.parse(event);
        if (eventObject) {
          const preparedEvent = {
            id: "api.sunbird.telemetry",
            events: [eventObject],
          };

          console.log(
            "preparedEvent size:",
            JSON.stringify(preparedEvent).length
          );

          if (preparedEvent) {
            const response = await axios.post(
              `${TELEMETRY_URL}/v1/telemetry`,
              preparedEvent,
              {
                timeout: 20000,
                headers: {
                  "Content-Type": "application/json"
                }
              }
            );

            return res.status(200).json(response.data);
          }
        }
      }
    } catch (error: any) {
      console.error("Error sending telemetry data:", error.message);
      return res.status(500).json({
        message: "Failed to forward telemetry data",
        error: error.message,
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
