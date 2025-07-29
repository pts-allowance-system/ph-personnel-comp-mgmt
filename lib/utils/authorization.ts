import { type NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth-utils';
import { UserRole } from '../models';

export interface NextRequestWithAuth extends NextRequest {
  user: {
    id: string;
    role: UserRole;
    [key: string]: any;
  };
}

type AuthorizedRouteHandler = (request: NextRequestWithAuth, context: any) => Promise<NextResponse>;

export function withAuthorization(allowedRoles: UserRole[], handler: AuthorizedRouteHandler) {
  return async (request: NextRequest, context: any) => {
    const user = await verifyToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Authentication failed. Please log in.' }, { status: 401 });
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }

    const newRequest = request as NextRequestWithAuth;
    newRequest.user = user;

    return handler(newRequest, context);
  };
}
