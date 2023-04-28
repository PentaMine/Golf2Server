import {Request, Response} from "express";
import CONFIG from "../config/config";
import { isIpLogged, logIp } from "../service/ip";

export const easterEgg = async (req: Request, res: Response) => {
    res.status(200).send(`${CONFIG.APP.EASTER_EGG_MESSAGE} <h1>${req.socket.remoteAddress}<h1/>`)

    if (!req.socket.remoteAddress || await isIpLogged(req.socket.remoteAddress!)) {
        return
    }

    await logIp(req.socket.remoteAddress!)
}