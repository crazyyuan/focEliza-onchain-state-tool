import { PinataSDK } from "pinata-web3";
import { ApiResponse } from "./api";
import fs from "fs";

const API_BASE_URL = "/api";
const AGENT_CLIENT_HOST = process.env.NEXT_PUBLIC_AGENT_CLIENT_HOST || "";

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "An error occurred while fetching the data.");
  }

  return data as ApiResponse<T>;
}

let pinata: PinataSDK | null = null;

export const apiClient = {
  // Agents
  getAgents: (space: string, start = 0, limit = 100) =>
    fetchAPI<string[]>(`/agents?space=${space}&start=${start}&limit=${limit}`),

  getAgentDetails: (address: string) => fetchAPI<any>(`/agents/${address}`),

  // Get agent wallet address from the agent client
  getAgentWalletAddress: async () => {
    try {
      if (!process.env.NEXT_PUBLIC_AGENT_CLIENT_HOST) {
        throw new Error("NEXT_PUBLIC_AGENT_CLIENT_HOST is not defined");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AGENT_CLIENT_HOST}/onchainstate/getWalletAddress`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch wallet address: ${response.statusText}`,
        );
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error fetching agent wallet address:", error);
      throw error;
    }
  },

  // Spaces
  getSpaces: (creator: string, start = 0, limit = 100) =>
    fetchAPI<string[]>(
      `/spaces?creator=${creator}&start=${start}&limit=${limit}`,
    ),

  // Environments
  getEnvironmentKeys: (agent: string) =>
    fetchAPI<{ agent: string; environmentKeys: string[] }>(
      `/environments?agent=${agent}`,
    ),

  // IPFS
  uploadToIpfs: async (file: File) => {
    if (pinata == null) {
      pinata = new PinataSDK({
        pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
        pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
      });
    }

    // const blob = new Blob([fs.readFileSync("./hello-world.txt")]);
    // const file = new File([blob], "hello-world.txt", { type: "text/plain"})
    const upload = await pinata.upload.file(file);
    return {
      ipfsUri: `ipfs://${upload.IpfsHash}`,
      isDuplicate: upload.isDuplicate,
    };

    // const formData = new FormData();
    // formData.append("file", file);
    //
    // const res = await fetch(`${API_BASE_URL}/ipfs/upload`, {
    //   method: "POST",
    //   body: formData,
    // });
    //
    // const data = await res.json();
    //
    // if (!res.ok) {
    //   throw new Error(data.error || "Error uploading file to IPFS");
    // }
    //
    // return data;
  },

  downloadFromIpfs: (cid: string) => fetchAPI<any>(`/ipfs/download?cid=${cid}`),

  // Generic methods
  get: <T>(endpoint: string, queryParams?: Record<string, string | number>) => {
    const queryString = queryParams
      ? "?" +
        new URLSearchParams(
          Object.entries(queryParams).map(([k, v]) => [k, String(v)]),
        ).toString()
      : "";
    return fetchAPI<T>(`${endpoint}${queryString}`);
  },

  post: <T>(endpoint: string, data: any) =>
    fetchAPI<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: any) =>
    fetchAPI<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    fetchAPI<T>(endpoint, {
      method: "DELETE",
    }),
};

export default apiClient;
