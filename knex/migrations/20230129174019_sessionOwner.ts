import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable("sessions", (table) => {
        table.integer("owner")
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable("sessions", (table) => {
        table.dropColumn("owner")
    })
}

