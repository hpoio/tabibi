path = 'src/app.module.ts'
with open(path, encoding='utf-8') as f:
    content = f.read()

old_import = "import { MeModule } from './me/me.module';"
new_import = "import { MeModule } from './me/me.module';\nimport { StaffModule } from './staff/staff.module';"

old_list = "    MeModule,"
new_list = "    MeModule,\n    StaffModule,"

assert old_import in content, 'import not found'
assert old_list in content, 'list not found'
content = content.replace(old_import, new_import, 1)
content = content.replace(old_list, new_list, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
