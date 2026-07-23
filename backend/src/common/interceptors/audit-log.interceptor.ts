import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';

const WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

/**
 * يلتقط تلقائياً كل طلب POST/PATCH/PUT/DELETE ناجح في كامل التطبيق،
 * ويسجّله في AuditLog دون أي تعديل على كود أي خدمة أو controller حالي.
 * يُفعَّل عالمياً من app.module.ts فقط.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers, body } = request;

    if (!WRITE_METHODS.includes(method) || !user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const entityType = this.extractEntityType(url);
        const entityId = responseBody?.id ?? this.extractIdFromUrl(url) ?? 'unknown';

        this.auditLogService.record({
          userId: user.userId,
          action: `${method}_${entityType.toUpperCase()}`,
          entityType,
          entityId,
          ipAddress: ip,
          userAgent: headers['user-agent'],
          oldValue: method === 'DELETE' ? body : undefined,
          newValue: method !== 'DELETE' ? responseBody : undefined,
        });
      }),
    );
  }

  private extractEntityType(url: string): string {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    return segments[0] ?? 'unknown';
  }

  private extractIdFromUrl(url: string): string | undefined {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const uuidLike = segments.find((s) => s.length >= 20);
    return uuidLike;
  }
}
