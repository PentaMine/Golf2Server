import User from "../sockets/user";
import {OutEventType} from "../sockets/events/outEvents";
import {RawData} from "ws";

export const composeSyncMessage = (users: Array<User>) => {
    let participants: Array<string> = []
    let owner!: string
    let ready: Array<string> = []
    users.forEach((user) => {

        if (user.isReady) {
            ready.push(user.username)
        }

        if (!user.isOwner) {
            participants.push(user.username)
            return
        }
        owner = user.username
    })

    return composeMessage(
        OutEventType.SYNCHRONISE,
        {"owner": owner, "participants": participants, "ready": ready}
    )
}

export const composeMessage = (type: OutEventType, content: any = {}) => {
    return JSON.stringify({"type": type, "content": content})
}

export const composeFinishMessage = (users: Array<User>) => {
    let participants: Array<string> = []
    let scores: Array<number> = [];

    users.forEach((user) => {
        participants.push(user.username)
        scores.push(user.timeToFinish!)
    })

    return composeMessage(
        OutEventType.GAME_FINISHED,
        {"participants": participants, "scores": scores}
    )
}

export const rawDataToJSON = (data: RawData) => {
    return JSON.parse(data.toString())
}

export const verifyPosSyncContent = (content: any) => {
    return areArgsProvided(
            content.px,
            content.py,
            content.pz,
            content.vx,
            content.vy,
            content.vz)
        && !isNaN(content.px)
        && !isNaN(content.py)
        && !isNaN(content.pz)
        && !isNaN(content.vx)
        && !isNaN(content.vy)
        && !isNaN(content.vz)
}

export const areArgsProvided = (...args: any[]) => {
    let areAllValid = true
    args.forEach((value) => {
        if (value == undefined) {
            areAllValid = false
        }
    })
    return areAllValid
}