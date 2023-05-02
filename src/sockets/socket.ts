import WebSocket, {RawData} from 'ws';
import {server} from "../app";
import CONFIG from "../config/config";
import jwt from "jsonwebtoken";
import {decodeNoPrefix, isTokenValid} from "../util/token";
import {getPlayerNameById} from "../service/player";
import {delay} from "../util/timer";
import {leaveSession} from "../service/session";
import {Decipher} from "crypto";
import User from "./user";
import {InEventType} from "./events/inEvents";
import {OutEventType} from "./events/outEvents";
import {
    composeSyncMessage,
    composeMessage,
    rawDataToJSON,
    verifyPosSyncContent, areArgsProvided
} from "../util/socketMessage";
import Session from "./session";
import {stripVTControlCharacters} from "util";

const wss = new WebSocket.Server({server: server});
let sessions: Map<number, Session> = new Map()
wss.on("connection", (ws) => {

    let uuid: number, sessionId: number, isOwner: boolean, user: User, session: Session

    const onHandshake = async (content: any) => {
        // deny if token is invalid
        if (!isTokenValid(content.socketArg)) {

            ws.send(composeMessage(OutEventType.HANDSHAKE_NAK, {"reason": "invalid session token"}))
            ws.close()
            return;
        }

        const token = decodeNoPrefix(content.socketArg)

        uuid = token.uuid
        sessionId = token.sessionId
        isOwner = token.isOwner

        // deny if token does not have required args
        if (!areArgsProvided(uuid, sessionId, isOwner) || (!sessions.has(sessionId) && !isOwner)) {
            ws.send(composeMessage(OutEventType.HANDSHAKE_NAK, {"reason": "error in handshake packet"}))
            ws.close()
            return;
        }

        user = new User(ws, await getPlayerNameById(uuid), isOwner, uuid)

        // invoke sync event
        if (sessions.has(sessionId)) {
            // add user to list of users in session
            session = sessions.get(sessionId)!

            if (session.users.length >= 10) {
                ws.send(composeMessage(OutEventType.HANDSHAKE_NAK, {"reason": "session full"}))
                ws.close()
            }

            if (session.isStarted) {
                ws.send(composeMessage(OutEventType.HANDSHAKE_NAK, {"reason": "session already started"}))
                ws.close()
                return
            }

            session.addUser(user)

            session.sendSyncMessage()
        } else {
            // add session
            let users: Array<User> = [user]
            session = new Session(users)
            sessions.set(sessionId, session)
            ws.send(composeSyncMessage(users))
        }

        ws.send(composeMessage(OutEventType.HANDSHAKE_ACK))

        if (session.isMapSent) {
            session.users.forEach((user) => {
                user.socket.send(composeMessage(OutEventType.MAP_SYNC, session.map))
            })
        }
    }

    const onDisconnect = (content: any) => {
        if (!sessions.has(sessionId)) {
            ws.close()
            return
        }

        // if user who left is the owner delete & close the session else just remove the player
        if (user.isOwner) {
            session.close()
            sessions.delete(sessionId);
        }

        session.removeUser(user);

        ws.close()
        session.sendSyncMessage()
        session.checkIfAllFinished()
        // update db
        leaveSession(uuid).catch(() => {
            return
        });
    }

    const onSetReady = (content: any) => {

        if (session.isStarted || session.users.length == 1) {
            return
        }

        user.isReady = true
        session.sendSyncMessage()
        session.checkIfAllReady()

        if (!user.isOwner || session.isMapSent) {
            return
        }

        session.sendMapSyncMessage(content)
    }

    const onSetUnready = (content: any) => {
        // set user as unready

        if (!sessions.get(sessionId) || session.isStarted) {
            return
        }

        user.isReady = false;

        session.sendSyncMessage()
    }

    const onPosSync = (content: any) => {
        if (!verifyPosSyncContent(content)) {
            return
        }

        session.users.forEach((_user) => {
            if (_user.uuid == uuid) {
                return
            }
            _user.socket.send(composeMessage(OutEventType.POS_SYNC, {
                "user": user.username,
                "px": content.px,
                "py": content.py,
                "pz": content.pz,
                "vx": content.vx,
                "vt": content.vy,
                "vz": content.vz
            }))
        })
    }

    const onFinish = (content: any) => {
        if (!content.time || isNaN(content.time)) {
            return
        }

        user.isFinished = true
        user.timeToFinish = content.time

        session.checkIfAllFinished()
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
                break;
            case InEventType.POS_SYNC:
                onPosSync(args.content)
                break;
            case InEventType.FINISH:
                onFinish(args.content)
                break;
            case InEventType.REFRESH:
                session.sendSyncMessage(ws)
        }

    });

    ws.on("close", (e) => {
        onDisconnect({})
    })
})


console.log(`WebSocket server up, waiting for connection on ${CONFIG.APP.HOST}:${CONFIG.APP.PORT}`)
