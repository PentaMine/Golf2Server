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

import WebSocket, {RawData} from 'ws';
import {server} from "../app";
import CONFIG from "../config/config";
import jwt from "jsonwebtoken";
import {setFlagsFromString} from "v8";
import {domainToASCII} from "url";
import {raw} from "express";

const wss = new WebSocket.Server({server: server});
enum InEventType {
    HANDSHAKE
}

wss.on("connection", (ws) => {

    let uuid: number, sessionId: number, auth: boolean = false

    const onHandshake = () => {
        console.log("handshake")
    }

    ws.on('error', console.error);

    ws.on('message', (data, isBinary) => {
        const args = rawDataToJSON(data)
        const type = args.type

        switch (type){
            case InEventType.HANDSHAKE:
                onHandshake()
        }

        console.log(type)
    });

    ws.send('something');
})

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

const rawDataToJSON = (data: RawData) => {
    return JSON.parse(data.toString())
}

console.log(`WebSocket server up, waiting for connection on ${CONFIG.APP.HOST}:${CONFIG.APP.PORT}`)
