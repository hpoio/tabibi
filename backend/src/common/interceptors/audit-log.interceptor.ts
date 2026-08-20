import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../services/audit-log.service';

const WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

// حقول آمنة فقط يُسمح بتخزينها في newValue/oldValue داخل سجل العمليات.
// أي حقل آخر (أسماء أدوية، تشخيص، فحص، محتوى رسائل، عناوين...) يُعتبر PHI
// ولا يُخزَّن أبداً هنا - سجل العمليات يثبت "من فعل ماذا ومتى" فقط، وليس
// نسخة كاملة من البيانات الطبية الحساسة (SEC-013 / يتقاطع مع SEC-005).
const SAFE_METADATA_FIELDS = ['id', 'status', 'createdAt', 'updatedAt'];

function toSafeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const field of SAFE_METADATA_FIELDS) {
    if (source[field] !== undefined) safe[field] = source[field];
  }
  return Object.keys(safe).length > 0 ? safe : undefined;
}

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
          oldValue: method === 'DELETE' ? toSafeMetadata(body) : undefined,
          newValue: method !== 'DELETE' ? toSafeMetadata(responseBody) : undefined,
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
