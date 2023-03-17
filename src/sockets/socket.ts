/*import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({
    port: 2998,
});

wss.on("connection", (ws) => {
    console.log("connected")
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });

    ws.send('something');
    //ws.close()
})*/

import WebSocket, {CloseEvent, RawData} from 'ws';
import {server} from "../app";
import CONFIG from "../config/config";
import jwt from "jsonwebtoken";
import {setFlagsFromString} from "v8";
import {domainToASCII} from "url";
import {raw} from "express";
import {decodeNoPrefix} from "../util/token";
import {getPlayerNameById} from "../service/player";
import {CANCELLED} from "dns";

const wss = new WebSocket.Server({server: server});

enum InEventType {
    HANDSHAKE,
    DISCONNECT
}

enum OutEventType {
    HANDSHAKE_ACK,
    HANDSHAKE_NAK,
    SYNCHRONISE
}
class User {
    public socket: WebSocket
    public username: string
    public isOwner: boolean
    public uuid: number
    constructor(socket: WebSocket, name: string, isOwner: boolean, id: number) {
        this.socket = socket;
        this.username = name;
        this.isOwner = isOwner;
        this.uuid = id
    }
}

let sessions: Map<number, Array<User>> =  new Map()
wss.on("connection", (ws) => {

    let uuid: number, sessionId: number, isOwner: boolean, user: User

    const onHandshake = async (content: any) => {
        // deny if token is invalid
        if (!isTokenValid(content.socketArg)) {

            ws.send(composeMessage(OutEventType.HANDSHAKE_NAK))
            return;
        }

        const token = decodeNoPrefix(content.socketArg)

        uuid = token.uuid
        sessionId = token.sessionId
        isOwner = token.isOwner

        // deny if token does not have required args
        if (!areArgsProvided(uuid, sessionId, isOwner)) {
            console.log(token)
            ws.send(composeMessage(OutEventType.HANDSHAKE_NAK))
            return;
        }

        user = new User(ws, await getPlayerNameById(uuid), isOwner, uuid)

        // invoke sync event
        if (sessions.has(sessionId)) {
            // add user to list of users in session
            let users = sessions.get(sessionId)!

            users.push(user)

            users.forEach((socket) => {
                socket.socket.send(composeSyncMessage(users))
            })

            sessions.set(sessionId, users)
        }
        else {
            // add session
            let users: Array<User> = [user]
            sessions.set(sessionId, users)
            ws.send(composeSyncMessage(users))
        }

        ws.send(composeMessage(OutEventType.HANDSHAKE_ACK))
    }

    const onDisconnect = (content: any) => {
        // remove user from session and close the connection
        let users: Array<User> = sessions.get(sessionId)!
        users.splice(users.indexOf(user), 1);

        if (users.length == 0) {
            sessions.delete(sessionId);
        }

        ws.close()
    }

    ws.on('error', console.error);

    ws.on('message', (data, isBinary) => {
        const args = rawDataToJSON(data)
        const type = args.type

        switch (type) {
            case InEventType.HANDSHAKE:
                onHandshake(args.content)
                break;
            case InEventType.DISCONNECT:
                onDisconnect(args.content)

        }

    });

    ws.on("close", (e) => {
        console.log(e)
        console.log("closed")
    })
})


const composeMessage = (type: OutEventType, content: any = {}) => {
    return JSON.stringify({"type": type, "content": content})
}

const composeSyncMessage = (users: Array<User>) => {
    let participants: Array<string> = []
    let owner!: string
    users.forEach((user) => {
        if (!user.isOwner){
            participants.push(user.username)
            return
        }
        owner = user.username
    })
    return JSON.stringify({"type": OutEventType.SYNCHRONISE, "content": {"owner": owner, "participants": participants}})
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
        if (value == undefined) {
            areAllValid = false
        }
    })
    return areAllValid
}

const rawDataToJSON = (data: RawData) => {
    return JSON.parse(data.toString())
}

console.log(`WebSocket server up, waiting for connection on ${CONFIG.APP.HOST}:${CONFIG.APP.PORT}`)
