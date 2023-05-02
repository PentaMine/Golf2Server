import User from "./user";
import WebSocket from "ws";
import {delay} from "../util/timer";
import {composeSyncMessage, composeMessage, composeFinishMessage} from "../util/socketMessage";
import {OutEventType} from "./events/outEvents";

export default class Session {
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

    checkIfAllFinished() {
        let areAllFinished = true
        this.users.forEach((user) => {
            areAllFinished = areAllFinished && user.isFinished;
        })
        if (areAllFinished) {
            this.finish()
        }
    }

    checkIfAllReady() {
        let areAllReady = true
        this.users.forEach((user) => {
            areAllReady = areAllReady && user.isReady;
        })
        if (areAllReady) {
            this.startCountdown()
        }
    }

    sendMapSyncMessage(mapData: any) {
        this.isMapSent = true
        this.map = mapData
        this.users.forEach((user) => {
            user.socket.send(composeMessage(OutEventType.MAP_SYNC, mapData))
        })
    }

    addUser(user: User) {
        if (this.users.indexOf(user) == -1) {
            this.users.push(user)
        }
    }

    removeUser(user: User) {
        let index = this.users.indexOf(user);

        if (index != -1) {
            this.users.splice(index, 1);
        }
    }

    getUserByUUID (uuid:  number) {

    }
}