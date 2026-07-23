path = 'src/app.module.ts'
with open(path, encoding='utf-8') as f:
    content = f.read()

old_import = "import { SettingsModule } from './settings/settings.module';"
new_import = """import { SettingsModule } from './settings/settings.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditLogService } from './common/services/audit-log.service';"""

old_providers = "  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],"
new_providers = """  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    AuditLogService,
  ],"""

assert old_import in content, 'import not found'
assert old_providers in content, 'providers not found'
content = content.replace(old_import, new_import, 1)
content = content.replace(old_providers, new_providers, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
