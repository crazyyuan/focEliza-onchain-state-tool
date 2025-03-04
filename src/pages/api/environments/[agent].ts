import { NextApiRequest, NextApiResponse } from "next";
import { readContract } from "wagmi/actions";
import { config } from "../../../wagmi";
import { AGENT_ABI } from "../../../contract/abi/agent";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     const { agent } = req.query;
//
//     if (!agent || typeof agent !== 'string') {
//       return res.status(400).json({ error: 'Agent address is required' });
//     }
//
//     switch (req.method) {
//       case 'GET':
//         return await getAgentEnvironment(agent, req, res);
//       default:
//         return res.status(405).json({ error: 'Method not allowed' });
//     }
//   } catch (error: any) {
//     console.error('API error:', error);
//     return res.status(500).json({ error: error.message || 'Internal server error' });
//   }
// }
//
// async function getAgentEnvironment(agentAddress: string, req: NextApiRequest, res: NextApiResponse) {
//   const { key } = req.query;
//
//   if (!key) {
//     return res.status(400).json({ error: 'Environment key parameter is required' });
//   }
//
//   try {
//     // Note: In a real-world application, you would want to implement
//     // proper authentication and authorization before allowing access to environment variables
//
//     // This is a simplified implementation
//     const envValue = await readContract(config, {
//       abi: AGENT_ABI,
//       address: agentAddress as `0x${string}`,
//       functionName: 'getEnv',
//       args: [key as string],
//     }) as string;
//
//     return res.status(200).json({
//       status: 'success',
//       data: {
//         agent: agentAddress,
//         key,
//         value: envValue
//       }
//     });
//   } catch (error: any) {
//     console.error('Error fetching environment value:', error);
//     return res.status(500).json({ error: error.message || 'Failed to fetch environment value' });
//   }
// }
