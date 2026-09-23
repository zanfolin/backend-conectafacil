export async function up(knex) {
  await knex.schema.createTable('vacancies', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('job_title', 255).notNullable();
    table.string('company_name', 255).notNullable();
    table.string('company_sector', 100).nullable();
    table.text('job_description').notNullable();
    table.string('requirements', 1000).nullable();
    table.string('benefits', 1000).nullable();
    table.string('location', 255).nullable();
    table.enu('work_model', ['REMOTE', 'HYBRID', 'ONSITE']).notNullable().defaultTo('ONSITE');
    table.enu('contract_type', ['CLT', 'PJ', 'INTERNSHIP', 'FREELANCE']).notNullable().defaultTo('CLT');
    table.decimal('salary_min', 12, 2).nullable();
    table.decimal('salary_max', 12, 2).nullable();
    table.enu('status', ['OPEN', 'CLOSED']).notNullable().defaultTo('OPEN');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%SZ','now'))"));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%SZ','now'))"));
    table.timestamp('deleted_at').nullable();
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_vacancy_job_title ON vacancies(job_title)');
  await knex.schema.raw('CREATE INDEX idx_vacancy_company_sector ON vacancies(company_sector)');
  await knex.schema.raw('CREATE INDEX idx_vacancy_salary_value ON vacancies(salary_min, salary_max)');
  await knex.schema.raw('CREATE INDEX idx_vacancy_created_at ON vacancies(created_at)');
  await knex.schema.raw('CREATE INDEX idx_vacancy_job_description ON vacancies(job_description)');

  // Trigger for updated_at
  await knex.schema.raw(`
    CREATE TRIGGER trg_vacancies_updated_at
    AFTER UPDATE ON vacancies
    FOR EACH ROW
    BEGIN
      UPDATE vacancies SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.schema.raw('DROP TRIGGER IF EXISTS trg_vacancies_updated_at');
  await knex.schema.dropTableIfExists('vacancies');
}