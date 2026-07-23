path = 'prisma/schema.prisma'
with open(path, encoding='utf-8') as f:
    content = f.read()

old = """model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])

  action     String   // e.g. VIEW_PATIENT, EDIT_REPORT
  entityType String
  entityId   String
  createdAt  DateTime @default(now())

  @@map("audit_logs")
}"""

new = """model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])

  action     String   // e.g. VIEW_PATIENT, EDIT_REPORT
  entityType String
  entityId   String

  ipAddress  String?
  userAgent  String?
  oldValue   Json?
  newValue   Json?

  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@map("audit_logs")
}"""

assert old in content, 'old block not found - checking exact whitespace'
content = content.replace(old, new, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
