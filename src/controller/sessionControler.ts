import {Request, Response} from "express";
import {addPlayerToSession, leaveSession, registerSession} from "../service/session";
import {decode, getRawToken} from "../util/token";
import okResponse, {okResponseMessage} from "../responses/okResponse";
import badReqResponse, {badReqResponseMessage} from "../responses/badReqResponse";
import {conflictResponseMessage} from "../responses/conflictResponse";
import jwt from "jsonwebtoken";
import CONFIG from "../config/config";
import {domainToASCII} from "url";

export const createSession = async (req: Request, res: Response) => {
    let sessionId;
    const token = decode(req.headers.authorization!);

    try {
        sessionId = (await registerSession(token.uuid))
    } catch (e) {
        conflictResponseMessage(res, "payer already in session")
        return
    }

    const sessionArg = jwt.sign({"sessionId": sessionId, "uuid": token.uuid, "isOwner": true}
        , CONFIG.AUTH.JWT_SECRET!,
        {
            algorithm: "HS256",
            expiresIn: 15 // 15 seconds
        })

    okResponseMessage(res, {"socketArg": sessionArg})
}

export const joinSession = async (req: Request, res: Response) => {
    let sessionId;
    const token = decode(req.headers.authorization!);

    sessionId = req.body.sessionId

    if (!sessionId) {
        badReqResponse(res)
        return
    }

    try {
        await addPlayerToSession(token.uuid, sessionId)
    } catch (e: any) {
        conflictResponseMessage(res, e.message)
        return
    }

    const sessionArg = jwt.sign({"sessionId": sessionId, "uuid": token.uuid, "isOwner": false}
        , CONFIG.AUTH.JWT_SECRET!,
        {
            algorithm: "HS256",
            expiresIn: 15 // 15 seconds
        })

    okResponseMessage(res, {"socketArg": sessionArg})
}

export const exitSession = async (req: Request, res: Response) => {
    const token = decode(req.headers.authorization!);
    try {
        await leaveSession(token.uuid);
    }catch (e: any){
        badReqResponseMessage(res, e.message)
        return
    }
    okResponse(res)
}