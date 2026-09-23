# ConectaFacil API

API REST para conectar candidatos, recrutadores e administradores em uma plataforma de vagas. O projeto oferece cadastro com verificacao de e-mail, autenticacao JWT, gerenciamento de vagas, candidaturas, notificacoes por e-mail e upload de avatar.

## Sumario

- [Tecnologias](#tecnologias)
- [Requisitos](#requisitos)
- [Instalacao e execucao](#instalacao-e-execucao)
- [Configuracao](#configuracao)
- [Comandos](#comandos)
- [Arquitetura](#arquitetura)
- [Autenticacao e perfis](#autenticacao-e-perfis)
- [Banco de dados](#banco-de-dados)
- [Dados de desenvolvimento](#dados-de-desenvolvimento)
- [Referencia da API](#referencia-da-api)
- [Exemplos de uso](#exemplos-de-uso)
- [Upload de avatar](#upload-de-avatar)
- [Erros e validacao](#erros-e-validacao)
- [Testes](#testes)
- [Insomnia](#insomnia)

## Tecnologias

| Categoria | Tecnologia |
| --- | --- |
| Runtime | Node.js 24+ com ES Modules |
| HTTP | Express 5 |
| Banco de dados | SQLite nativo via Knex 3 |
| Autenticacao | JSON Web Token (`jsonwebtoken`) |
| Senhas | bcryptjs |
| Validacao | Zod |
| Upload | Multer |
| E-mail | Nodemailer |
| Testes | `node:test` e `node:assert` |

## Requisitos

- Node.js `>= 24.0.0`
- npm
- Uma chave JWT com pelo menos 32 caracteres

O SQLite e fornecido pelo Node.js; nao e necessario instalar um servidor de banco de dados.

## Instalacao e execucao

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` na raiz do projeto:

   ```env
   JWT_SECRET=uma-chave-local-com-pelo-menos-32-caracteres
   ```

3. Crie as tabelas e dados de desenvolvimento:

   ```bash
   npm run migrate:latest
   npm run seed
   ```

4. Inicie a API:

   ```bash
   npm run dev
   ```

A API estara disponivel em `http://localhost:3000`. Verifique a disponibilidade com:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

## Configuracao

As variaveis abaixo sao lidas do arquivo `.env`. Os comandos `dev` e `start` tambem carregam esse arquivo automaticamente.

| Variavel | Padrao | Descricao |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP da API. |
| `NODE_ENV` | `development` | `development`, `test` ou `production`. |
| `JWT_SECRET` | - | Obrigatoria, minimo de 32 caracteres. Em producao, valores placeholder sao rejeitados. |
| `JWT_EXPIRES_IN` | `7d` | Tempo de expiracao dos JWTs. |
| `DATABASE_PATH` | `./data/conectafacil.db` | Caminho do arquivo SQLite. |
| `SMTP_HOST` | - | Servidor SMTP; obrigatorio em producao. |
| `SMTP_PORT` | `587` | Porta SMTP. |
| `SMTP_SECURE` | `false` | Usa TLS implicito no SMTP. |
| `SMTP_USER` | - | Usuario SMTP; obrigatorio em producao. |
| `SMTP_PASS` | - | Senha SMTP; obrigatoria em producao. |
| `SMTP_FROM` | `ConectaFacil <noreply@conectafacil.com>` | Remetente dos e-mails. |
| `UPLOAD_DIR` | `./uploads/avatars` | Diretorio dos avatares. |
| `MAX_AVATAR_MB` | `2` | Tamanho maximo do avatar em MB. |

Exemplo para desenvolvimento sem SMTP real:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=uma-chave-local-com-pelo-menos-32-caracteres
DATABASE_PATH=./data/conectafacil.db
MAX_AVATAR_MB=2
```

Sem `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS` em desenvolvimento, os e-mails sao escritos no console. Em producao, essas tres variaveis sao obrigatorias.

## Comandos

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Inicia a API com reinicializacao por alteracao de arquivo. |
| `npm start` | Inicia a API sem observacao de arquivos. |
| `npm run migrate:latest` | Executa todas as migrations pendentes. |
| `npm run migrate:rollback` | Reverte a ultima migration. |
| `npm run migrate:make <nome>` | Cria uma migration. |
| `npm run seed` | Carrega os dados seed. |
| `npm run seed:make <nome>` | Cria um arquivo seed. |
| `npm test` | Executa os testes unitarios e de validacao. |
| `npm run test:smoke` | Executa o fluxo de integracao contra uma API ativa. |

Para executar o smoke test, inicie a API em um terminal e, em outro, use:

```bash
npm run test:smoke
```

Por padrao ele usa `http://localhost:3000`. Para outra URL:

```bash
API_URL=http://localhost:4000 npm run test:smoke
```

No PowerShell:

```powershell
$env:API_URL = 'http://localhost:4000'
npm run test:smoke
```

## Arquitetura

```text
src/
  app.js                    # Express, parsers, rota /health e tratamento de erros
  server.js                 # Inicializacao e desligamento gracioso
  config/                   # Variaveis de ambiente e conexao Knex
  db/
    dialects/               # Cliente SQLite para Knex
    migrations/             # Estrutura e triggers do banco
    seeds/                  # Usuarios e vagas de desenvolvimento
  middlewares/              # Auth, papis, upload, validacao e erros
  modules/
    auth/                   # Cadastro, login, verificacao e senha
    users/                  # Avatar do usuario autenticado
    candidates/             # Perfil, vagas e candidaturas
    recruiters/             # Perfil, vagas e candidatos
    admin/                  # Administracao de usuarios e vagas
  routes/                   # Montagem das rotas sob /api
  utils/                    # JWT, CPF/CNPJ e envio de e-mails
```

Cada modulo segue o padrao `routes.js`, `controller.js`, `service.js` e, quando ha entrada validada, `schemas.js`. As rotas chamam controllers, que delegam regras de negocio e persistencia aos services.

## Autenticacao e perfis

As rotas protegidas exigem o cabecalho:

```http
Authorization: Bearer <token>
```

O token e um JWT com `sub` (id do usuario) e `type` (papel), valido por `JWT_EXPIRES_IN`. Nao ha refresh token: ao expirar, o usuario deve fazer login novamente.

| Papel | Pode fazer |
| --- | --- |
| `CANDIDATE` | Consultar vagas abertas, candidatar-se, cancelar candidatura e editar o proprio perfil. |
| `RECRUITER` | Criar e administrar as proprias vagas, consultar candidatos e atualizar candidaturas. |
| `ADMIN` | Consultar e administrar usuarios e vagas. |

### Fluxo de conta

1. `POST /api/auth/register` cria candidato ou recrutador com e-mail nao verificado.
2. A API envia um codigo de seis digitos, valido por 10 minutos.
3. `POST /api/auth/verify-email` ativa a conta.
4. `POST /api/auth/login` retorna o token somente para conta verificada.
5. `POST /api/auth/forgot-password` gera outro codigo; `POST /api/auth/reset-password` altera a senha.

Para seguranca, os endpoints de reenvio de verificacao e recuperacao retornam uma mensagem generica, mesmo quando o e-mail nao existe.

## Banco de dados

O projeto usa SQLite. As migrations criam tres tabelas e triggers que atualizam `updated_at` automaticamente.

| Tabela | Finalidade | Regras importantes |
| --- | --- | --- |
| `users` | Contas de candidatos, recrutadores e administradores. | `email` e `document_number` sao unicos; possui exclusao logica em `deleted_at`. |
| `vacancies` | Vagas criadas por recrutadores. | Pertence a `users`; possui exclusao logica e status `OPEN` ou `CLOSED`. |
| `interests` | Candidaturas. | Relaciona candidato e vaga; combinacao `user_id` + `vacancy_id` e unica. |

Relacoes:

```text
users (1) -------- (N) vacancies
users (1) -------- (N) interests
vacancies (1) ---- (N) interests
```

As chaves estrangeiras usam `RESTRICT`. Portanto, a exclusao administrativa de um usuario com vagas ou candidaturas vinculadas retorna conflito de integridade.

Valores enumerados:

| Campo | Valores |
| --- | --- |
| `users.user_type` | `CANDIDATE`, `RECRUITER`, `ADMIN` |
| `users.document_type` | `CPF`, `CNPJ` |
| `vacancies.work_model` | `REMOTE`, `HYBRID`, `ONSITE` |
| `vacancies.contract_type` | `CLT`, `PJ`, `INTERNSHIP`, `FREELANCE` |
| `vacancies.status` | `OPEN`, `CLOSED` |
| `interests.status` | `PENDING`, `ACCEPTED`, `REJECTED` |

O diagrama fonte esta em [conectaFacilDB.dbml](conectaFacilDB.dbml).

## Dados de desenvolvimento

`npm run seed` cria ou recria os dados abaixo. O seed de desenvolvimento e ignorado quando `NODE_ENV=production`.

| Papel | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@admin.com` | `Senha123!` |
| Recrutador | `recruiter@test.com` | `Senha123!` |
| Candidato | `candidate@test.com` | `Senha123!` |

Tambem sao criadas duas vagas do recrutador e uma candidatura do candidato na primeira vaga:

| Vaga | Modelo | Contrato |
| --- | --- | --- |
| Desenvolvedor Full Stack | `HYBRID` | `CLT` |
| Desenvolvedor Frontend | `REMOTE` | `PJ` |

Os IDs sao gerados pelo banco. Consulte `GET /api/recruiters/vacancies` apos o seed em vez de presumir valores fixos.

## Referencia da API

Base URL local: `http://localhost:3000`.

### Sistema

| Metodo | Rota | Autorizacao | Descricao |
| --- | --- | --- | --- |
| `GET` | `/health` | Publica | Estado e timestamp da API. |

### Autenticacao

| Metodo | Rota | Autorizacao | Corpo ou parametros |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Publica | `email`, `password`, `full_name`, `user_type`, `document_type`, `document_number`, `phone?` |
| `POST` | `/api/auth/verify-email` | Publica | `email`, `code` (6 caracteres) |
| `POST` | `/api/auth/resend-verification` | Publica | `email` |
| `POST` | `/api/auth/login` | Publica | `email`, `password` |
| `POST` | `/api/auth/forgot-password` | Publica | `email` |
| `POST` | `/api/auth/reset-password` | Publica | `email`, `code` (6 caracteres), `password` |
| `GET` | `/api/auth/me` | JWT | - |

Regras de cadastro: senha tem no minimo 8 caracteres; candidato deve informar CPF valido; recrutador pode informar CPF ou CNPJ validos. Administradores nao sao criados por essa rota.

### Usuario autenticado

| Metodo | Rota | Autorizacao | Corpo ou parametros |
| --- | --- | --- | --- |
| `POST` | `/api/users/me/avatar` | JWT | `multipart/form-data`, campo de arquivo `avatar` |

### Candidato

Todas as rotas desta secao exigem JWT de `CANDIDATE`.

| Metodo | Rota | Corpo ou parametros |
| --- | --- | --- |
| `GET` | `/api/candidates/profile` | - |
| `PUT` | `/api/candidates/profile` | `full_name?`, `phone?`, `active_notification?` |
| `GET` | `/api/candidates/vacancies` | `job_title?`, `company_sector?`, `salary_min?`, `salary_max?`, `work_model?`, `contract_type?`, `page?`, `limit?` |
| `GET` | `/api/candidates/vacancies/:id` | ID numerico da vaga |
| `POST` | `/api/candidates/vacancies/:id/apply` | ID numerico da vaga |
| `GET` | `/api/candidates/applications` | - |
| `DELETE` | `/api/candidates/applications/:vacancyId` | ID numerico da vaga |
| `PATCH` | `/api/candidates/notifications` | `active_notification` (booleano) |

As listagens paginadas usam `page=1` e `limit=10` por padrao, com limite maximo de 50 itens.

### Recrutador

Todas as rotas desta secao exigem JWT de `RECRUITER`.

| Metodo | Rota | Corpo ou parametros |
| --- | --- | --- |
| `GET` | `/api/recruiters/profile` | - |
| `PUT` | `/api/recruiters/profile` | `full_name?`, `phone?`, `active_notification?` |
| `POST` | `/api/recruiters/vacancies` | Dados completos de uma vaga |
| `GET` | `/api/recruiters/vacancies` | `page?`, `limit?` |
| `GET` | `/api/recruiters/vacancies/:id` | ID da propria vaga |
| `PUT` | `/api/recruiters/vacancies/:id` | Campos parciais de uma vaga |
| `DELETE` | `/api/recruiters/vacancies/:id` | ID da propria vaga |
| `GET` | `/api/recruiters/vacancies/:id/candidates` | ID da propria vaga, `page?`, `limit?` |
| `PATCH` | `/api/recruiters/vacancies/:id/candidates/:userId/status` | `status`: `ACCEPTED` ou `REJECTED` |
| `GET` | `/api/recruiters/candidates/:id` | ID do candidato |

Campos obrigatorios ao criar vaga: `job_title` (minimo 3), `company_name` (minimo 2) e `job_description` (minimo 10). Campos opcionais: `company_sector`, `requirements`, `benefits`, `location`, `work_model`, `contract_type`, `salary_min` e `salary_max`. Quando as duas faixas salariais forem informadas, `salary_min` deve ser menor ou igual a `salary_max`.

### Administrador

Todas as rotas desta secao exigem JWT de `ADMIN`.

| Metodo | Rota | Corpo ou parametros |
| --- | --- | --- |
| `GET` | `/api/admin/users` | `user_type?`, `verified_email?`, `search?`, `page?`, `limit?` |
| `GET` | `/api/admin/users/:id` | ID do usuario |
| `PUT` | `/api/admin/users/:id` | `full_name?`, `phone?`, `active_notification?`, `user_type?`, `verified_email?` |
| `DELETE` | `/api/admin/users/:id` | ID do usuario |
| `GET` | `/api/admin/vacancies` | `status?`, `search?`, `page?`, `limit?` |
| `GET` | `/api/admin/vacancies/:id` | ID da vaga |
| `PUT` | `/api/admin/vacancies/:id` | `status`: `OPEN` ou `CLOSED` |
| `DELETE` | `/api/admin/vacancies/:id` | ID da vaga |

## Exemplos de uso

### Cadastrar candidato

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@example.com",
    "password": "Senha123!",
    "full_name": "Ana Silva",
    "user_type": "CANDIDATE",
    "document_type": "CPF",
    "document_number": "52998224725",
    "phone": "(11) 99999-0000"
  }'
```

Em desenvolvimento, copie o codigo enviado no console do servidor e confirme o e-mail:

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","code":"123456"}'
```

### Fazer login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@test.com","password":"Senha123!"}'
```

Resposta resumida:

```json
{
  "user": {
    "id": 3,
    "email": "candidate@test.com",
    "user_type": "CANDIDATE"
  },
  "token": "eyJ..."
}
```

Armazene o valor de `token` e use-o nas requisicoes protegidas.

### Listar vagas remotas

```bash
curl "http://localhost:3000/api/candidates/vacancies?work_model=REMOTE&page=1&limit=10" \
  -H "Authorization: Bearer <CANDIDATE_TOKEN>"
```

### Criar vaga como recrutador

```bash
curl -X POST http://localhost:3000/api/recruiters/vacancies \
  -H "Authorization: Bearer <RECRUITER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Desenvolvedor Backend",
    "company_name": "TechCorp",
    "company_sector": "Tecnologia",
    "job_description": "Desenvolvimento de APIs REST em Node.js.",
    "requirements": "Node.js, SQL e Git",
    "work_model": "HYBRID",
    "contract_type": "CLT",
    "salary_min": 7000,
    "salary_max": 10000
  }'
```

### Candidatar-se a uma vaga

```bash
curl -X POST http://localhost:3000/api/candidates/vacancies/2/apply \
  -H "Authorization: Bearer <CANDIDATE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

A candidatura duplicada retorna `409 Conflict`. Ao criar uma candidatura, o recrutador recebe um e-mail; ao aceitar ou rejeitar, o candidato recebe outro e-mail.

### Atualizar status de candidatura

```bash
curl -X PATCH http://localhost:3000/api/recruiters/vacancies/2/candidates/3/status \
  -H "Authorization: Bearer <RECRUITER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACCEPTED"}'
```

## Upload de avatar

Envie `multipart/form-data` para `/api/users/me/avatar` usando o campo `avatar`:

```bash
curl -X POST http://localhost:3000/api/users/me/avatar \
  -H "Authorization: Bearer <TOKEN>" \
  -F "avatar=@./foto.png"
```

Formatos permitidos: JPEG, PNG e WebP. O tamanho maximo e definido por `MAX_AVATAR_MB` (2 MB por padrao). Os arquivos sao servidos publicamente em `/uploads`.

## Erros e validacao

As entradas sao validadas com Zod. Uma requisicao invalida retorna `400` neste formato:

```json
{
  "error": "Validation Error",
  "message": "Dados de entrada invalidos",
  "details": [
    {
      "field": "body.email",
      "message": "E-mail invalido"
    }
  ]
}
```

| Status | Quando ocorre |
| --- | --- |
| `400` | Validacao de dados, arquivo invalido ou arquivo acima do limite. |
| `401` | Token ausente, invalido, expirado ou usuario inexistente. |
| `403` | E-mail nao verificado ou papel sem permissao. |
| `404` | Rota ou recurso inexistente. |
| `409` | Dados duplicados ou bloqueio por integridade referencial. |
| `500` | Erro interno inesperado. Em producao, a mensagem interna e ocultada. |

## Testes

Os testes unitarios cobrem autorizacao por papel, validacao estruturada, documentos CPF/CNPJ, reset de senha e JWT:

```bash
npm test
```

O smoke test cobre o fluxo integrado: health check, login dos tres perfis, controle de acesso, vagas, candidaturas, avatar, validacoes, recuperacao de senha e regras de integridade:

```bash
npm start
npm run test:smoke
```

## Insomnia

Uma colecao pronta para importacao esta disponivel em [insomnia/conectafacil-api.insomnia.json](insomnia/conectafacil-api.insomnia.json).

No Insomnia:

1. Use **Import** e selecione o arquivo JSON.
2. Mantenha `base_url` como `http://localhost:3000` ou ajuste-o para seu ambiente.
3. Execute os tres logins (`admin`, `recrutador` e `candidato`).
4. Copie os tokens retornados para `admin_token`, `recruiter_token` e `candidate_token` no ambiente da colecao.
5. Execute as requisicoes agrupadas pelo papel adequado.

As requisicoes de exclusao ficam na colecao para cobertura completa, mas devem ser usadas apenas com registros criados para teste.
