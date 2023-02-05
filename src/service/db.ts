const knex = require("knex");
const dbConfig = require("../../knexfile");

export const db = knex(dbConfig.development);