import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "@workspace/utils/cookieHelper";
import axios from "axios";


/**
* API Handler to process content URL and fetch artifact data
* @param req - Next.js API request object
* @param res - Next.js API response object
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 if (req.method === "POST") {
   try {
     const { contenturl } = req.body;


     // Extract the second last part from the URL as doId
     const parts = contenturl.split("/");
     const doId = parts.length > 2 ? parts[parts.length - 2] : null;


     if (doId) {
       const baseURL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || "";
       const authApiToken = getCookie(req, "authToken") || process.env.AUTH_API_TOKEN;
       const tenantId = getCookie(req, "tenantId") || process.env.NEXT_PUBLIC_TENANT_ID;


       console.log("Auth Token:", authApiToken);
       console.log("Tenant ID:", tenantId);


       const config = {
         method: "get",
         maxBodyLength: Infinity,
         url: `${baseURL}/api/content/v1/read/${doId}?fields=artifactUrl`,
         headers: {
           tenantid: tenantId || "",
           Authorization: `Bearer ${authApiToken || ""}`,
         },
       };


       try {
         const response = await axios.request(config);
         const artifactUrl = response?.data?.result?.content?.artifactUrl;


         res.status(200).json({ doId, success: !!artifactUrl });
       } catch (error) {
         console.error("Axios Request Failed:", error);
         res.status(200).json({ doId, success: false });
       }
     } else {
       res.status(200).json({ doId, success: false });
     }
   } catch (error: any) {
     console.error("Error:", error);
     res.status(500).json({ error: error.message });
   }
 } else {
   res.status(405).json({ error: "Method not allowed" });
 }
}



