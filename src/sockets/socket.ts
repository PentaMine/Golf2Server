import WebSocket, {RawData} from 'ws';
import {server} from "../app";
import CONFIG from "../config/config";
import jwt from "jsonwebtoken";
import {decodeNoPrefix} from "../util/token";
import {getPlayerNameById} from "../service/player";
import {delay} from "../util/timer";
import {leaveSession} from "../service/session";
import {Decipher} from "crypto";

const wss = new WebSocket.Server({server: server});

enum InEventType {
    HANDSHAKE,
    DISCONNECT,
    SET_READY,
    SET_UNREADY,
    POS_SYNC,
    FINISH,
    REFRESH
}

enum OutEventType {
    HANDSHAKE_ACK,
    HANDSHAKE_NAK,
    SYNCHRONISE,
    MAP_SYNC,
    SESSION_COUNTDOWN,
    POS_SYNC,
    SESSION_CLOSED,
    GAME_FINISHED,

}

class User {
    public socket: WebSocket
    public username: string
    public isOwner: boolean
    public uuid: number
    public isReady: boolean
    public isFinished: boolean;
    public timeToFinish: number | undefined;

    constructor(socket: WebSocket, name: string, isOwner: boolean, id: number) {
        this.socket = socket;
        this.username = name;
        this.isOwner = isOwner;
        this.uuid = id
        this.isReady = false;
        this.isFinished = false;
    }
}

class Session {
    public users: Array<User>;
    public isStarted: boolean;
    public isMapSent: boolean;
    public map: any

    constructor(users: Array<User>) {
        this.users = users;
        this.isStarted = false;
        this.isMapSent = false;
    }

    sendSyncMessage(socket: WebSocket | undefined = undefined) {

        if (!this.users) {
            return
        }

        let syncMessage = composeSyncMessage(this.users)

        if (socket) {
            socket.send(syncMessage)
            return;
        }

        this.users.forEach((user) => {
            user.socket.send(syncMessage)
        })
    }

    async startCountdown() {
        this.isStarted = true

        await delay(1000)

        for (let i = 5; i >= 0; i--) {
            this.users.forEach((user) => {
                user.socket.send(composeMessage(OutEventType.SESSION_COUNTDOWN, {"time": i}))
            })
            await delay(1000)
        }
    }

    close() {
        this.users.forEach((user) => {
            user.socket.send(composeMessage(OutEventType.SESSION_CLOSED))
            delay(5000).then(() => user.socket.close())
        })
    }

    finish() {
        // reset session
        this.isStarted = false;
        this.isMapSent = false;
        this.map = undefined;

        let finishMessage = composeFinishMessage(this.users)

        this.users.forEach((user) => {
            user.socket.send(finishMessage)

            // reset the user
            user.timeToFinish = undefined;
            user.isFinished = false;
            user.isReady = false;
        })
    }
}

let sessions: Map<number, Session> = new Map()
wss.on("connection", (ws) => {

    let uuid: number, sessionId: number, isOwner: boolean, user: User, isMapSent: boolean, session: Session

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
            if (session.users.length >= 4) {
                ws.send(composeMessage(OutEventType.HANDSHAKE_NAK, {"reason": "session full"}))
                ws.close()
            }
            session.users.push(user)
            if (session.isStarted) {
                ws.send(composeMessage(OutEventType.HANDSHAKE_NAK, {"reason": "session already started"}))
                ws.close()
                return
            }

            session.sendSyncMessage()
        } else {
            // add session
            let users: Array<User> = [user]
            session = new Session(users)
            sessions.set(sessionId, session)
            ws.send(composeSyncMessage(users))
        }

        ws.send(composeMessage(OutEventType.HANDSHAKE_ACK))
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

        let users: Array<User> = session.users

        let index = users.indexOf(user);
        if (index != -1) {
            users.splice(index, 1);
        }


        ws.close()
        session.sendSyncMessage()
        // update db
        leaveSession(uuid).catch(() => {
            return
        });
    }

    const onSetReady = (content: any) => {

        if (session.isStarted) {
            return
        }

        // set user as ready
        let areAllReady = true;

        session.users.forEach((user) => {
            if (user.uuid == uuid) {
                user.isReady = true;
            }
            areAllReady = areAllReady && user.isReady
        })

        session.sendSyncMessage()

        if (areAllReady && session.users.length > 1) {
            // run asynchronously
            session.startCountdown()
        }

        if (!user.isOwner || isMapSent) {
            return
        }

        session.isMapSent = true;
        session.map = content;
        session.users.forEach((user) => {
            user.socket.send(composeMessage(OutEventType.MAP_SYNC, content))
        })
    }

    const onSetUnready = (content: any) => {
        // set user as unready

        if (!sessions.get(sessionId) || session.isStarted) {
            return
        }

        session.users.forEach((user) => {
            if (user.uuid == uuid) {
                user.isReady = false;
            }
        })

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
        let areAllFinished = true;
        session.users.forEach((user) => {

            if (user.uuid == uuid) {
                user.isFinished = true;
                user.timeToFinish = content.time
            }

            areAllFinished = areAllFinished && user.isFinished
        })

        if (areAllFinished) {
            session.finish()
        }
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

const verifyPosSyncContent = (content: any) => {
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

    return composeMessage(
        OutEventType.SYNCHRONISE,
        {"owner": owner, "participants": participants, "ready": ready}
    )
}

const composeFinishMessage = (users: Array<User>) => {
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
