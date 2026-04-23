import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";


// Initialize AWS S3 client
const s3Client = new S3Client({
 region: process.env.AWS_REGION, // e.g., "us-west-1"
 credentials: {
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
 },
});


const bucketName = process.env.AWS_BUCKET_NAME ;


// Disable default body parser
export const config = {
 api: {
   bodyParser: false,
 },
};


export default async function handler(req, res) {
 if (req.method === "PUT") {
   try {
     const Key = req.headers["key"];
     const PartNumber = parseInt(req.headers["partnumber"], 10);
     const UploadId = req.headers["uploadid"];
     const ContentLength = parseInt(req.headers["contentlength"], 10);
     const body = req; // Use the raw request stream for the body


     // Step 2: Initiate UploadPartCommand Upload
     const command = new UploadPartCommand({
       Bucket: bucketName,
       Key: Key,
       PartNumber: PartNumber,
       UploadId: UploadId,
       Body: body,
       ContentLength: ContentLength, // Ensure chunk length is set
     });
     let response = await s3Client.send(command);
     if (response?.ETag) {
       response.ETag = response.ETag.replaceAll('"', "");
     }
     res.status(200).json({ response });
   } catch (error) {
     console.error("Error creating upload ID:", error);
     res.status(500).json({ error: error.message });
   }
 } else {
   res.status(405).json({ error: "Method not allowed" });
 }
}



