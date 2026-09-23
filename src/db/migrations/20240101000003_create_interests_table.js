export async function up(knex) {
  await knex.schema.createTable('interests', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.integer('vacancy_id').notNullable().references('id').inTable('vacancies').onDelete('RESTRICT');
    table.enu('status', ['PENDING', 'ACCEPTED', 'REJECTED']).notNullable().defaultTo('PENDING');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%SZ','now'))"));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%SZ','now'))"));

    // Unique constraint to prevent duplicate applications
    table.unique(['user_id', 'vacancy_id']);
  });

  // Trigger for updated_at
  await knex.schema.raw(`
    CREATE TRIGGER trg_interests_updated_at
    AFTER UPDATE ON interests
    FOR EACH ROW
    BEGIN
      UPDATE interests SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.schema.raw('DROP TRIGGER IF EXISTS trg_interests_updated_at');
  await knex.schema.dropTableIfExists('interests');
}