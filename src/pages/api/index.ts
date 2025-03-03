import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    status: 'success',
    message: 'API is running',
    endpoints: [
      '/api/agents',
      '/api/spaces',
      '/api/environments'
    ]
  });
}
