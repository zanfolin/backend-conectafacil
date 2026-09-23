export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 255).notNullable();
    table.enu('user_type', ['CANDIDATE', 'RECRUITER', 'ADMIN']).notNullable().defaultTo('CANDIDATE');
    table.enu('document_type', ['CPF', 'CNPJ']).notNullable();
    table.string('document_number', 18).notNullable().unique();
    table.string('phone', 20).nullable();
    table.string('avatar_url', 500).nullable();
    table.boolean('verified_email').notNullable().defaultTo(false);
    table.string('code_email_verification', 6).nullable();
    table.timestamp('code_expires_at').nullable();
    table.boolean('active_notification').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%SZ','now'))"));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%SZ','now'))"));
    table.timestamp('deleted_at').nullable();
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_user_email ON users(email)');
  await knex.schema.raw('CREATE INDEX idx_user_type ON users(user_type)');
  await knex.schema.raw('CREATE INDEX idx_user_full_name ON users(full_name)');
  await knex.schema.raw('CREATE INDEX idx_user_document_number ON users(document_number)');

  // Trigger for updated_at
  await knex.schema.raw(`
    CREATE TRIGGER trg_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
      UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.schema.raw('DROP TRIGGER IF EXISTS trg_users_updated_at');
  await knex.schema.dropTableIfExists('users');
}