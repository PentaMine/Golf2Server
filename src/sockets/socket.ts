import {decodeNoPrefix} from "../util/token";
import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import CONFIG from "../config/config";
import {DefaultEventsMap, ReservedOrUserListener} from "socket.io/dist/typed-events";
import {NamespaceReservedEventsMap} from "socket.io/dist/namespace";
import {getSessionOwner} from "../service/session";

export const handleSockets = (io: Server) => {
    io.sockets.on('connection', (socket) => {

        let uuid: number, sessionId: number, room: string

        socket.on("handshake", (auth) => {
            console.log("dsaf")
            if (!areArgsProvided(auth) || !isTokenValid(auth)) {
                return
            }

            const token = decodeNoPrefix(auth)

            if (!token.uuid) {
                return;
            }

            uuid = token.uuid
        })

        socket.on("addToSession", (command) => {
            if (!areArgsProvided(command, uuid) || !isTokenValid(command)) {
                return
            }

            const token = decodeNoPrefix(command)

            if (!token.sessionId) {
                return;
            }

            sessionId = token.sessionId
            room = sessionId.toString()
            socket.join(room)
            console.log(io.sockets.adapter.rooms.get(room))
        })

        socket.on("startSession", async (mapData) => {

            if (!areArgsProvided(mapData)){
                return
            }

            console.log(await getSessionOwner(sessionId))

            if (uuid != await getSessionOwner(sessionId)){
                return
            }
            io.to(room).emit("sessionStarted", mapData)
        })

        socket.on("submitPosData", (posData) => {

            if (!areArgsProvided(posData)){
                return
            }

            socket.to(room).emit("receivePosData", posData)
        })
    });
}

const isTokenValid = (token: string) => {
    try {
        jwt.verify(token, CONFIG.AUTH.JWT_SECRET!)
    } catch (e) {
        return false
    }
    return true
}

const areArgsProvided = (...args: any[]) => {
    let areAllValid = true
    args.forEach((value) => {
        if (!value) {
            areAllValid = false
        }
    })
    return areAllValid
}