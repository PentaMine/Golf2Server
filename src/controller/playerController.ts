import {Request, Response} from "express";
import badReqResponse, {badReqResponseMessage} from "../responses/badReqResponse";
import {createPlayer, getPlayerNameById} from "../service/player";
import sendResponse from "../responses/sendResponse";
import * as jwt from "jsonwebtoken";
import CONFIG from "../config/config";
import serverErrorResponse from "../responses/serverErrorResponse";
import {getNNewestSessions} from "../service/session";
import okResponse, {okResponseMessage} from "../responses/okResponse";
import updateReqResponse from "../responses/updateReqResponse";

export const authoriseClient = async (req: Request, res: Response) => {
    let name, uuid;
    name = req.body.name;
    if (!name || String(name).length > 16) {
        badReqResponseMessage(res, "name must be 1-16 characters long");
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

export const verifyAuth = (req: Request, res: Response) => {
    let version

    version = req.body.clientVersion;

    if (isNaN(version)) {
        badReqResponse(res)
        return
    }

    if (version < CONFIG.AUTH.LAST_SUPPORTED_VERSION){
        updateReqResponse(res)
        return;
    }

    okResponse(res)
}
