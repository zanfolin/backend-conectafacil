# Plan: Backend ConectaFácil — Node 24 + Express + SQLite nativo

**TL;DR**: API REST em JavaScript ESM sobre Node 24+, Express 5, SQLite via módulo nativo `node:sqlite` gerenciado pelo Knex (dialeto customizado de ~100 linhas, sem dependências externas), JWT sem refresh, zod, bcryptjs, nodemailer e multer. Migrations/seeds reproduzem o `conectaFacilDB.dbml` (FKs RESTRICT, triggers `updated_at`, índices, timestamps ISO-8601 UTC) com os ajustes aprovados: `interests` reutilizada como candidatura **com status (PENDING/ACCEPTED/REJECTED)**, `status` + `deleted_at` em vagas, verificação de e-mail obrigatória antes do login e recuperação de senha por e-mail.

Raiz do projeto: `c:\Users\Graziani Zanfolin\Documents\backend-conectafacil`

## Steps

### Fase 1 — Fundação do projeto ✅ CONCLUÍDA
1. `package.json` — "type": "module"; dependências: express 5.2.1, zod 4.6.5, knex 3.3.0, bcryptjs 3.0.3, jsonwebtoken 9.0.3, nodemailer 10.0.10, multer 2.4.0; scripts `dev`/`start` com `node --env-file-if-exists=.env --watch src/server.js`, scripts `migrate:*`/`seed` via knex CLI.
2. `.env_example` (PORT, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, DATABASE_PATH, SMTP_HOST/PORT/SECURE/USER/PASS/FROM, UPLOAD_DIR, MAX_AVATAR_MB) + `.gitignore` (.env, node_modules, *.db, data/, uploads/avatars/).
3. `src/config/env.js` — schema zod validando process.env com defaults seguros.
4. `src/db/dialects/NodeSqliteClient.js` — dialeto knex customizado: estende o client better-sqlite3 do knex (deep import `knex/lib/dialects/better-sqlite3`); `_driver` → `node:sqlite`; `acquireRawConnection` → `new DatabaseSync(filename, { enableForeignKeyConstraints: true })`; `_query` → `prepare().run()/.all()` detectando reader via regex no SQL (StatementSync não tem `.reader`); `_formatBindings` convertendo boolean→número; pool min/max 1. *(paralelo com 1-3)*
5. `knexfile.js` (ESM, usa o dialeto customizado, dirs de migrations/seeds) + `src/config/database.js` (singleton knex, cria o diretório do banco com mkdirSync recursive). *depende de 3 e 4*
6. `src/app.js` + `src/server.js` — Express 5 (erros de handlers async propagam automaticamente), static `/uploads`, mount de rotas, listen e graceful shutdown. *depende de 5*

### Fase 2 — Banco de dados (conforme DBML) ✅ CONCLUÍDA
7. Migration `users`: colunas do DBML + `code_expires_at`; índices idx_user_email, idx_user_type, idx_user_full_name, idx_user_document_number; trigger `trg_users_updated_at`; `created_at` default `strftime('%Y-%m-%dT%H:%M:%SZ','now')`.
8. Migration `vacancies`: colunas do DBML + `status` (OPEN/CLOSED) + `deleted_at`; índices idx_vacancy_job_title, idx_vacancy_company_sector, idx_vacancy_salary_value, idx_vacancy_created_at, idx_vacancy_job_description; trigger `trg_vacancies_updated_at`; FK user_id → users RESTRICT.
9. Migration `interests`: colunas do DBML + `status` (text NOT NULL default 'PENDING', CHECK IN ('PENDING','ACCEPTED','REJECTED')) + UNIQUE(user_id, vacancy_id); trigger `trg_interests_updated_at`; FKs RESTRICT para users e vacancies. *depende de 7 e 8*
10. Seeds: `01_admin.js` (admin@admin.com, Senha123! com hash bcrypt, verified_email=1, CPF placeholder válido — DBML omite document_number apesar de NOT NULL) + `02_dev_data.js` (recrutador CNPJ, candidato CPF, vagas de exemplo — dev).
11. *(Opcional)* Atualizar `conectaFacilDB.dbml` para refletir os desvios aprovados (status em interests; status/deleted_at em vacancies; code_expires_at em users), mantendo a spec em sync com o schema real.

### Fase 3 — Infraestrutura de API ✅ CONCLUÍDA
12. `src/middlewares/auth.js` (verifica JWT → req.user {id, type}) + `src/middlewares/requireRole.js` (CANDIDATE/RECRUITER/ADMIN).
13. `src/middlewares/validate.js` — wrapper zod (body/query/params → 400 com detalhes).
14. `src/middlewares/errorHandler.js` — ZodError→400, SQLITE_CONSTRAINT_UNIQUE→409, FK RESTRICT→409, 401/403/404; shape JSON consistente.
15. `src/middlewares/upload.js` — multer disk storage em uploads/avatars, filtro jpg/png/webp, limite MAX_AVATAR_MB (default 2MB).
16. `src/utils/` — `cpfCnpj.js` (dígitos verificadores), `mailer.js` (transporter nodemailer; jsonTransport/log no console quando SMTP ausente), `jwt.js` (sign/verify, payload {sub, type}).

### Fase 4 — Módulo auth ✅ CONCLUÍDA
17. `src/modules/auth/` — POST /api/auth/register (só CANDIDATE/RECRUITER; CANDIDATE exige CPF válido, RECRUITER CPF ou CNPJ; hash bcrypt; código 6 dígitos + code_expires_at; e-mail), POST /verify-email (verified_email=1, limpa código), POST /resend-verification, POST /login (bloqueia e-mail não verificado; retorna JWT), POST /forgot-password, POST /reset-password (valida código, troca hash), GET /me.

### Fase 5 — Módulos por perfil ✅ CONCLUÍDA
18. `src/modules/users/` — POST /api/users/me/avatar (multer; atualiza avatar_url; remove arquivo antigo; serve via /uploads/avatars).
19. `src/modules/candidates/` — GET/PUT /api/candidates/profile; GET /api/candidates/vacancies (filtros job_title/company_sector/salary, exclui deletadas); GET /api/candidates/vacancies/:id; POST /api/candidates/vacancies/:id/apply (cria interest com status PENDING; e-mail ao recrutador; resposta inclui e-mail da empresa); GET /api/candidates/applications (lista com status de cada candidatura); DELETE /api/candidates/applications/:vacancyId; PATCH toggle active_notification.
20. `src/modules/recruiters/` — GET/PUT /api/recruiters/profile; CRUD das próprias vagas (403 em vaga de outro; update dispara e-mails a interessados com active_notification=1; delete = soft delete status CLOSED + deleted_at); GET /api/recruiters/vacancies/:id/candidates (lista candidatos com status da candidatura); PATCH /api/recruiters/vacancies/:id/candidates/:userId/status (body {status: ACCEPTED|REJECTED}; 403 em vaga alheia; e-mail ao candidato com o resultado); GET /api/recruiters/candidates/:id (perfil do candidato).
21. `src/modules/admin/` — GET/PUT/DELETE /api/admin/users (filtros; delete → 409 se FK RESTRICT bloquear); GET /api/admin/vacancies + gestão (status, soft delete).

### Fase 6 — Verificação end-to-end 🔄 EM ANDAMENTO
22. **PENDENTE**: Corrigir `knexfile.js` para carregar `.env` corretamente (top-level await não funciona em ESM comum; usar `import.meta.env` ou carregar dotenv antes do import dinâmico).
23. **PENDENTE**: `npm run migrate:latest` → inspecionar schema com node:sqlite.
24. **PENDENTE**: `npm run seed` → POST /api/auth/login com admin@admin.com / Senha123! retorna JWT.
25. **PENDENTE**: `npm run dev` → servidor na PORT; e-mails "enviados" aparecem no console (jsonTransport sem SMTP).
26. **PENDENTE**: Fluxo manual (REST Client/curl): registrar candidato (CPF válido) → código no console → verify-email → login → candidatar-se à vaga do recrutador (CNPJ) → recrutador recebe notificação → lista candidatos (com status PENDING) e vê perfil → recrutador aceita/rejeita via PATCH status → candidato recebe e-mail e consulta status em /api/candidates/applications → recrutador atualiza vaga → interessado com active_notification=1 recebe e-mail → admin tenta excluir usuário com vínculos → 409.
27. **PENDENTE**: Testes negativos: e-mail duplicado 409; CPF/CNPJ inválido 400; login não verificado 403; candidato criando vaga 403; recrutador candidatando 403; recrutador alterando status em vaga alheia 403; status inválido no body 400; JWT inválido/expirado 401; avatar >2MB ou tipo errado 400; candidatura duplicada 409 (UNIQUE).
28. **PENDENTE**: FKs: insert em interests com vacancy_id inexistente → erro de constraint (PRAGMA foreign_keys ON).

## Relevant files
- `conectaFacilDB.dbml` — especificação-fonte: tabelas, índices, triggers, FKs RESTRICT, seed admin, regras de negócio.
- `package.json`, `.env_example`, `.gitignore`, `knexfile.js` — configuração.
- `src/config/env.js`, `src/config/database.js` — env validado + singleton knex.
- `src/db/dialects/NodeSqliteClient.js` — dialeto knex ↔ node:sqlite (crítico; knex 3.3.0 não suporta node:sqlite nativamente).
- `src/db/migrations/` (users, vacancies, interests) e `src/db/seeds/` (01_admin, 02_dev_data).
- `src/middlewares/` (auth, requireRole, validate, errorHandler, upload).
- `src/modules/` (auth, users, candidates, recruiters, admin) com routes/controller/service/schemas por módulo.
- `src/utils/` (cpfCnpj, mailer, jwt); `src/uploads/avatars/` (gitignored).
- `src/app.js`, `src/server.js`.

## Verification
1. `npm install` + `npm run migrate:latest` → inspecionar schema com node:sqlite (`node --input-type=module -e`): tabelas users/vacancies/interests, triggers trg_*_updated_at, índices, FKs ativas, CHECK de status em interests.
2. `npm run seed` → POST /api/auth/login com admin@admin.com / Senha123! retorna JWT.
3. `npm run dev` → servidor na PORT; e-mails "enviados" aparecem no console (jsonTransport sem SMTP).
4. Fluxo manual (REST Client/curl): registrar candidato (CPF válido) → código no console → verify-email → login → candidatar-se à vaga do recrutador (CNPJ) → recrutador recebe notificação → lista candidatos (com status PENDING) e vê perfil → recrutador aceita/rejeita via PATCH status → candidato recebe e-mail e consulta status em /api/candidates/applications → recrutador atualiza vaga → interessado com active_notification=1 recebe e-mail → admin tenta excluir usuário com vínculos → 409.
5. Testes negativos: e-mail duplicado 409; CPF/CNPJ inválido 400; login não verificado 403; candidato criando vaga 403; recrutador candidatando 403; recrutador alterando status em vaga alheia 403; status inválido no body 400; JWT inválido/expirado 401; avatar >2MB ou tipo errado 400; candidatura duplicada 409 (UNIQUE).
6. FKs: insert em interests com vacancy_id inexistente → erro de constraint (PRAGMA foreign_keys ON).

## Decisions
- **interests = candidaturas com status** (escolha do usuário + consideração futura incorporada): coluna `status` (PENDING/ACCEPTED/REJECTED) criada já na migration; recrutador aceita/rejeita com e-mail ao candidato; candidato acompanha status; UNIQUE(user_id, vacancy_id) impede duplicatas.
- **Cadastro completo**: registro exige user_type + document_type + document_number com validação de dígitos (CANDIDATE→CPF; RECRUITER→CPF ou CNPJ); registro só permite CANDIDATE/RECRUITER (ADMIN via seed).
- **JavaScript ESM puro**: package.json type:module; knexfile e migrations ESM (knex 3.3.0 suporta).
- **Login bloqueado até verificação de e-mail**; código 6 dígitos com expiração ~10 min (coluna `code_expires_at` — pequeno desvio do DBML por segurança; decisão fechada).
- **Vagas**: status OPEN/CLOSED + deleted_at (soft delete aprovado); listagens sempre filtram deleted_at IS NULL.
- **Recuperação de senha por e-mail** nesta fase (reusa code_email_verification + code_expires_at).
- **Dialeto knex customizado** para node:sqlite (~100 linhas, zero dependências externas) — knex 3.3.0 não tem suporte nativo (verificado no repo e no npm).
- **Avatar em disco local** (uploads/avatars) servido via express.static; jpg/png/webp; limite via env.
- **SMTP genérico via .env**; sem SMTP configurado → jsonTransport (log no console) em dev.
- **JWT** payload {sub: user.id, type: user_type}, expiração JWT_EXPIRES_IN, sem refresh.
- **Exclusão de usuário (admin)**: FK RESTRICT → 409 com mensagem clara.
- **Seed admin**: document_number resolvido com CPF placeholder válido (inconsistência do DBML).
- **Seeds dev**: 02_dev_data.js mantido (recrutador, candidato, vagas de exemplo) — decisão fechada.
