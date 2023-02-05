import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("sessions", (table) => {
        table.increments('id')
        table.timestamp('created_at').defaultTo(knex.fn.now())

        table.jsonb("participant_list").defaultTo([])
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("sessions")
}

