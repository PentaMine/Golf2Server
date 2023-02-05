import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable("players", (table) => {
        table.string("address_of_origin")
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable("players", (table) => {
        table.dropColumns("address_of_origin")
    })
}

