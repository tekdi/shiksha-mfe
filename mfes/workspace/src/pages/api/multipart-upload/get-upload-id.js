import {
 S3Client,
 CreateMultipartUploadCommand,
} from "@aws-sdk/client-s3";


// Initialize AWS S3 client
const s3Client = new S3Client({
 region: process.env.AWS_REGION, // e.g., "us-west-1"
 credentials: {
   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
   secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
 },
});


const bucketName = process.env.AWS_BUCKET_NAME ;


export default async function handler(req, res) {
 if (req.method === "POST") {
   try {
     const { keyPath, type } = req.body;


     // Step 1: Initiate Multipart Upload
     const command = new CreateMultipartUploadCommand({
       Bucket: bucketName,
       Key: keyPath,
       ContentType: type,
     });
     const response = await s3Client.send(command);
     const uploadId = response.UploadId;


     res.status(200).json({ uploadId });
   } catch (error) {
     console.error("Error creating upload ID:", error);
     res.status(500).json({ error: error.message });
   }
 } else {
   res.status(405).json({ error: "Method not allowed" });
 }
}



