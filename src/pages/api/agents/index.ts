import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { readContract } from 'wagmi/actions';
import { config } from '../../../wagmi';
import { AGENT_REGISTRY_ABI } from '../../../contract/abi/agent';
import { AGENT_REGISTRY_ADDRESS } from '../../../contract/address';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getAgents(req, res);
      case 'POST':
        return await registerAgent(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getAgents(req: NextApiRequest, res: NextApiResponse) {
  const { space, start = '0', limit = '100' } = req.query;
  
  if (!space) {
    return res.status(400).json({ error: 'Space parameter is required' });
  }

  try {
    const agentIndex = Number(
      (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: 'agentIndex',
      })) as BigInt
    );

    if (agentIndex > 0) {
      const agents = (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: 'getAgentsBySpace',
        args: [space as string, Number(start), Math.min(Number(limit), agentIndex)],
      })) as string[];

      return res.status(200).json({ 
        status: 'success',
        data: agents 
      });
    }

    return res.status(200).json({ 
      status: 'success',
      data: [] 
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch agents' });
  }
}

async function registerAgent(req: NextApiRequest, res: NextApiResponse) {
  const { operator, space, name, description, characterURI } = req.body;

  if (!operator || !space || !name) {
    return res.status(400).json({ 
      error: 'Missing required fields. Please provide operator, space, and name.' 
    });
  }

  // Note: This endpoint can only validate the input data
  // Actual contract interaction should happen on the client side
  // due to wallet signature requirements
  
  return res.status(200).json({ 
    status: 'success',
    message: 'Agent data validated successfully',
    data: { operator, space, name, description, characterURI }
  });
}
