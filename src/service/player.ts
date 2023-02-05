import {db as knex} from "./db";

export const createPlayer = async (name: string, addressOfOrigin: string) => {

    if (await knex.table("players").where({"name" : name}).first()){
        throw Error("Duplicate error, player with same name already exists");
    }

    return (await knex.table("players")
        .insert({"name": name, "address_of_origin": addressOfOrigin}, ["id"]))[0].id
}

export const updateLastLogin = async (id: number) => {
    return knex.table("players").where({"id": id}).update({"last_login": knex.fn.now()});
}

export const getPlayerNameById = async (id: number) => {
    return (await knex.table("players").where({"id": id}).select("name").first())["name"];
}