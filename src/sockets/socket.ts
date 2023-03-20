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
    DISCONNECT,
    SET_READY,
    SET_UNREADY
}

enum OutEventType {
    HANDSHAKE_ACK,
    HANDSHAKE_NAK,
    SYNCHRONISE,
    MAP_SYNC,
}

class User {
    public socket: WebSocket
    public username: string
    public isOwner: boolean
    public uuid: number
    public isReady: boolean

    constructor(socket: WebSocket, name: string, isOwner: boolean, id: number) {
        this.socket = socket;
        this.username = name;
        this.isOwner = isOwner;
        this.uuid = id
        this.isReady = false;
    }
}

let sessions: Map<number, Array<User>> = new Map()
wss.on("connection", (ws) => {

    let uuid: number, sessionId: number, isOwner: boolean, user: User, isMapSent: boolean

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
            ws.send(composeMessage(OutEventType.HANDSHAKE_NAK))
            return;
        }

        user = new User(ws, await getPlayerNameById(uuid), isOwner, uuid)

        // invoke sync event
        if (sessions.has(sessionId)) {
            // add user to list of users in session
            let users = sessions.get(sessionId)!

            users.push(user)

            sessions.set(sessionId, users)

            sendSyncMessage()
        } else {
            // add session
            let users: Array<User> = [user]
            sessions.set(sessionId, users)
            ws.send(composeSyncMessage(users))
        }

        ws.send(composeMessage(OutEventType.HANDSHAKE_ACK))
    }

    const onDisconnect = (content: any) => {
        // remove user from session and close the connection

        if (!sessions.has(sessionId)) {
            ws.close()
            return
        }

        let users: Array<User> = sessions.get(sessionId)!

        let index = users.indexOf(user);
        if (index != -1) {
            users.splice(index, 1);
        }

        if (users.length == 0) {
            sessions.delete(sessionId);
        }

        ws.close()
        sendSyncMessage()
    }

    const onSetReady = (content: any) => {

        if (!sessions.get(sessionId)) {
            return
        }

        // set user as ready
        let areAllReady = true;
        sessions.get(sessionId)!.forEach((user) => {
            if (user.uuid == uuid) {
                user.isReady = true;
            }
            areAllReady = areAllReady && user.isReady
        })


        //ws.send(composeSyncMessage(sessions.get(sessionId)!))
        sendSyncMessage()

        if (areAllReady) {
            // TODO: start game logic
            console.log("all ready")
        }

        if (!user.isOwner || isMapSent) {
            return
        }

        isMapSent = true;
        sessions.get(sessionId)!.forEach((user) => {
            user.socket.send(composeMessage(OutEventType.MAP_SYNC, content))
        })
    }

    const onSetUnready = (content: any) => {
        // set user as unready

        if (!sessions.get(sessionId)) {
            return
        }

        sessions.get(sessionId)!.forEach((user) => {
            if (user.uuid == uuid) {
                user.isReady = false;
            }
        })

        //ws.send(composeSyncMessage(sessions.get(sessionId)!))
        sendSyncMessage()
    }

    const sendSyncMessage = () => {
        let session: Array<User> = sessions.get(sessionId)!

        if (!session) {
            return
        }

        session.forEach((user) => {
            user.socket.send(composeSyncMessage(session))
        })
    }

    ws.on('error', console.error);

    ws.on('message', (data, isBinary) => {
        const args = rawDataToJSON(data)
        const type = args.type

        if (args.type != InEventType.HANDSHAKE && !user) {
            ws.send(composeMessage(OutEventType.HANDSHAKE_NAK))
        }

        switch (type) {
            case InEventType.HANDSHAKE:
                onHandshake(args.content)
                break;
            case InEventType.DISCONNECT:
                onDisconnect(args.content)
                break;
            case InEventType.SET_READY:
                onSetReady(args.content)
                break;
            case InEventType.SET_UNREADY:
                onSetUnready(args.content)
        }

    });

    ws.on("close", (e) => {
        onDisconnect({})
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

    return JSON.stringify({
        "type": OutEventType.SYNCHRONISE,
        "content": {"owner": owner, "participants": participants, "ready": ready}
    })
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
