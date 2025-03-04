import { NextApiRequest, NextApiResponse } from "next";
import { PinataSDK } from "pinata-web3";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// // Disable the default body parser to handle form data
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
//
// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }
//
//   try {
//     // Parse the form data
//     const form = formidable({});
//     const [fields, files] = await form.parse(req);
//
//     const uploadedFile = files.file?.[0];
//
//     if (!uploadedFile) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }
//
//     // Check if file is JSON
//     if (
//       path.extname(uploadedFile.originalFilename || "").toLowerCase() !==
//       ".json"
//     ) {
//       return res.status(400).json({ error: "Only JSON files are allowed" });
//     }
//
//     // Initialize Pinata client
//     const pinata = new PinataSDK({
//       pinataJwt: process.env.PINATA_JWT,
//       pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
//     });
//
//     // Read file content
//     const fileContent = fs.readFileSync(uploadedFile.filepath);
//
//     // Upload to IPFS via Pinata
//     const result = await pinata.pinFileToIPFS({
//       file: fileContent,
//       name: uploadedFile.originalFilename || "character.json",
//       options: {
//         cidVersion: 1,
//       },
//     });
//
//     // Construct the IPFS URI
//     const ipfsUri = `ipfs://${result.IpfsHash}`;
//     const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
//
//     // Return success response
//     return res.status(200).json({
//       status: "success",
//       data: {
//         ipfsUri,
//         gatewayUrl,
//         hash: result.IpfsHash,
//       },
//     });
//   } catch (error: any) {
//     console.error("IPFS upload error:", error);
//     return res.status(500).json({
//       error: error.message || "Error uploading to IPFS",
//     });
//   }
// }
