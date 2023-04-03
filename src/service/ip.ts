import {db as knex} from "./db";

export const isIpLogged = async (ip: string) => {

    const foundIp: Array<any> = await knex.table("ips").where({"ip": ip})

    return foundIp.length > 0
}

export const logIp = async (ip: string) => {
    await knex.table("ips").insert({"ip": ip})
}