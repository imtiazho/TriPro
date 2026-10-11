import { Request } from 'express';
import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

export interface AuditParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  organizationId?: string | Types.ObjectId;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

const SENSITIVE_FIELDS = new Set(['password', 'token', 'secret', 'privateKey', 'credential']);

function sanitizeChanges(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return undefined;
  const sanitized: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(k.toLowerCase())) {
      sanitized[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      sanitized[k] = sanitizeChanges(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export class AuditService {
  static async log(req: Request, params: AuditParams): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        return; // Unauthenticated actions skip audit or log with system tag
      }

      const orgId = params.organizationId || (req as any).organizationId || user.currentOrgId;

      await AuditLog.create({
        organizationId: orgId ? new Types.ObjectId(orgId.toString()) : undefined,
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        changes: {
          before: sanitizeChanges(params.changes?.before),
          after: sanitizeChanges(params.changes?.after),
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestId: (req as any).id,
      });

      logger.debug(
        { action: params.action, resourceType: params.resourceType, resourceId: params.resourceId },
        'Audit log recorded'
      );
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to record audit log');
      // Append-only audit logger does not disrupt primary request flow
    }
  }
}
