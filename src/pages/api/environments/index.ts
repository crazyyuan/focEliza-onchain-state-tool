import { NextApiRequest, NextApiResponse } from 'next';
import { readContract } from 'wagmi/actions';
import { config } from '../../../wagmi';
import { AGENT_ABI } from '../../../contract/abi/agent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getEnvironments(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getEnvironments(req: NextApiRequest, res: NextApiResponse) {
  const { agent } = req.query;
  
  if (!agent) {
    return res.status(400).json({ error: 'Agent address parameter is required' });
  }

  try {
    // Get environment keys
    const envKeys = await readContract(config, {
      abi: AGENT_ABI,
      address: agent as `0x${string}`,
      functionName: 'getEnvKeys',
    }) as string[];

    // Note: We don't fetch the actual environment values here
    // as they might be sensitive and should be accessed with proper authorization
    
    return res.status(200).json({ 
      status: 'success',
      data: {
        agent,
        environmentKeys: envKeys
      }
    });
  } catch (error: any) {
    console.error('Error fetching environment keys:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch environment keys' });
  }
}
