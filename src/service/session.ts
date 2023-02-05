import {db as knex} from "./db";

export const registerSession = async (owner: number) => {
    if (await knex.table("sessions").where(knex.raw(`participant_list @> '${owner}'`)).orWhere({"owner": owner}).first()) {
        throw Error("player already in session")
    }

    return (await knex.table("sessions")
        .insert({"participant_list": "[]", "owner": owner}, ["id"]))[0];
}

export const getSessionById = async (id: number) => {
    return knex.table("sessions").where({"id": id}).first();
}
export const getSessionOwner = async (id: number) => {
    return (await knex.table("sessions").where({"id": id}).select("owner").first())["owner"];
}

export const getNNewestSessions = async (n: number) => {
    return knex.table("sessions")
        .select("owner", "participant_list")
        .orderBy("id", "desc")
        .limit(n)
}

export const deleteSession = (id: number) => {
    return knex.table("sessions")
        .where({"id": id})
        .del()
}

export const addPlayerToSession = async (playerId: number, sessionId: number) => {
    if (await knex.table("sessions").where(knex.raw(`participant_list @> '${playerId}'`)).orWhere({"owner": playerId}).first()) {
        throw Error("player already in session");
    }
    let participantList: Array<number>

    try {
        participantList = (await knex.table("sessions")
            .where({"id": sessionId})
            .select("participant_list")
            .first())["participant_list"]
    }catch (e){
        throw Error("session does not exist")
    }

    participantList.push(playerId)

    return knex.table("sessions")
        .where({"id": sessionId})
        .update({"participant_list": JSON.stringify(participantList)})
};

export const leaveSession = async (playerId: number) => {

    if (await knex.table("sessions")
        .where({"owner": playerId})
        .delete()) {
        return
    }

    let participantList: Array<number>;

    try {
        participantList = (await knex.table("sessions")
            .where(knex.raw(`participant_list @> '${playerId}'`))
            .select("participant_list")
            .first())["participant_list"]
    }catch (e){
        throw Error("player is not in a session")
    }

    participantList.splice(participantList.indexOf(playerId), 1)

    return knex.table("sessions")
        .where(knex.raw(`participant_list @> '${playerId}'`))
        .update({"participant_list": JSON.stringify(participantList)} )
}
