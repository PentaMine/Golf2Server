import WebSocket from "ws";

export default class User {
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