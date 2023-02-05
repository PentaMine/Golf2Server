import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("players", (table) => {
        table.increments("id").primary()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('last_login').defaultTo(knex.fn.now())
        table.string("name", 16)
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("players")
}

