import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cid } = req.query;

  if (!cid || typeof cid !== "string") {
    return res.status(400).json({ error: "IPFS CID is required" });
  }

  try {
    // Create cache directory if it doesn't exist
    const cacheDir = path.join("/tmp", "ipfs-cache");
    console.log('cacheDir:', cacheDir);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Generate a filename based on the CID
    const filename = `${cid}.json`;
    const filePath = path.join(cacheDir, filename);

    // Check if file already exists in cache
    if (fs.existsSync(filePath)) {
      // Read file from cache
      const fileContent = fs.readFileSync(filePath, "utf-8");
      return res.status(200).json({
        status: "success",
        data: JSON.parse(fileContent),
        source: "cache",
      });
    }

    // Try to get the file from Pinata gateway
    const gatewayUrl = `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${cid}`;
    const response = await axios.get(gatewayUrl);

    if (response.status !== 200) {
      throw new Error("Failed to fetch file from IPFS");
    }

    // Save file to cache
    fs.writeFileSync(filePath, JSON.stringify(response.data));

    // Return the file content
    return res.status(200).json({
      status: "success",
      data: response.data,
      source: "gateway",
    });
  } catch (error: any) {
    console.error("IPFS download error:", error);
    return res.status(500).json({
      error: error.message || "Error downloading from IPFS",
    });
  }
}
