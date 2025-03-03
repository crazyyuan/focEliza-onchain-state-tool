import { NextApiResponse } from 'next';

export type ApiResponse<T = any> = {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
};

export function successResponse<T>(res: NextApiResponse, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    data,
    message
  } as ApiResponse<T>);
}

export function errorResponse(res: NextApiResponse, error: string, statusCode = 400) {
  return res.status(statusCode).json({
    status: 'error',
    error
  } as ApiResponse);
}

export function validateMethod(req: Request, allowedMethods: string[]) {
  const method = req.method?.toUpperCase() || '';
  return allowedMethods.includes(method);
}

export function handleApiError(error: any, res: NextApiResponse) {
  console.error('API error:', error);
  const message = error.message || 'Internal server error';
  const statusCode = error.statusCode || 500;
  return errorResponse(res, message, statusCode);
}
