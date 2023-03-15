import {Request, Response} from "express";
import badReqResponse, {badReqResponseMessage} from "../responses/badReqResponse";
import {createPlayer, getPlayerNameById} from "../service/player";
import sendResponse from "../responses/sendResponse";
import * as jwt from "jsonwebtoken";
import CONFIG from "../config/config";
import serverErrorResponse from "../responses/serverErrorResponse";
import {getNNewestSessions} from "../service/session";
import okResponse, {okResponseMessage} from "../responses/okResponse";
import {getRawToken} from "../util/token";

export const authoriseClient = async (req: Request, res: Response) => {
    let name, uuid;
    name = req.body.name;
    if (!name) {
        badReqResponse(res);
        return;
    }

    try {
        uuid = await createPlayer(name, req.socket.remoteAddress!)
    } catch (e) {
        badReqResponseMessage(res, "name already taken")
        return
    }

    if (!uuid) {
        serverErrorResponse(res);
        return;
    }

    const token = jwt.sign({"uuid": uuid}
        , CONFIG.AUTH.JWT_SECRET!,
        {
            algorithm: "HS256",
            //expiresIn: 60 * 60 * 24 * 7 //one week // does not expire
        })

    sendResponse(res, 200, {"token": token})
}

export const getAvailableSessions = async (req: Request, res: Response) => {
    let count;
    count = req.body.count

    if (!count){
        badReqResponse(res)
        return
    }

    const sessions = await getNNewestSessions(count);

    for (const session of sessions) {
        session.owner = await getPlayerNameById(session.owner)

        for (let i = 0; i < session.participant_list.length; i++) {
            session.participant_list[i] = await getPlayerNameById(session.participant_list[i])
        }
    }

    okResponseMessage(res, {"sessions" : sessions})
}
