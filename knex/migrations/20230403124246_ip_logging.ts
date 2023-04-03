import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("ips", (table) => {
        table.increments("id").primary()
        table.string("ip")
        table.timestamp("created_at").defaultTo(knex.fn.now())
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("ips")
}

