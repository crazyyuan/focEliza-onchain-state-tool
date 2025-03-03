import { NextApiRequest, NextApiResponse } from 'next';
import { readContract } from 'wagmi/actions';
import { config } from '../../../wagmi';
import { AGENT_REGISTRY_ABI } from '../../../contract/abi/agent';
import { AGENT_REGISTRY_ADDRESS } from '../../../contract/address';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getSpaces(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function getSpaces(req: NextApiRequest, res: NextApiResponse) {
  const { creator, start = '0', limit = '100' } = req.query;
  
  if (!creator) {
    return res.status(400).json({ error: 'Creator address parameter is required' });
  }

  try {
    const spaceIndex = Number(
      (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: 'spaceIndex',
      })) as BigInt
    );

    if (spaceIndex > 0) {
      const spaces = (await readContract(config, {
        abi: AGENT_REGISTRY_ABI,
        address: AGENT_REGISTRY_ADDRESS,
        functionName: 'getCreatorAllSpaces',
        args: [creator as string, Number(start), Math.min(Number(limit), spaceIndex)],
      })) as string[];

      return res.status(200).json({ 
        status: 'success',
        data: spaces 
      });
    }

    return res.status(200).json({ 
      status: 'success',
      data: [] 
    });
  } catch (error: any) {
    console.error('Error fetching spaces:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch spaces' });
  }
}
