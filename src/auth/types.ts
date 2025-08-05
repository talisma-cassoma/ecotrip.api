// src/auth/types.ts

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  session?: {
    refresh_token?: string;
    access_token?: string;
  }; 
  user?: any; // Ou um tipo mais específico do JWT
}
