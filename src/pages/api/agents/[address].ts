import { NextApiRequest, NextApiResponse } from 'next';
import { readContract } from 'wagmi/actions';
import { config } from '../../../wagmi';
import { AGENT_REGISTRY_ABI, AGENT_ABI } from '../../../contract/abi/agent';
import { AGENT_REGISTRY_ADDRESS } from '../../../contract/address';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Agent address is required' });
    }

    switch (req.method) {
      case 'GET':
        return await getAgentDetails(address, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getAgentDetails(agentAddress: string, res: NextApiResponse) {
  try {
    // Get agent details from the contract
    const agentInfo = await readContract(config, {
      abi: AGENT_ABI,
      address: agentAddress as `0x${string}`,
      functionName: 'getInfo',
    });

    // Get agent environments if any
    const envKeys = await readContract(config, {
      abi: AGENT_ABI,
      address: agentAddress as `0x${string}`,
      functionName: 'getEnvKeys',
    }) as string[];

    return res.status(200).json({ 
      status: 'success',
      data: {
        address: agentAddress,
        info: agentInfo,
        environmentKeys: envKeys
      }
    });
  } catch (error: any) {
    console.error('Error fetching agent details:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch agent details' });
  }
}
