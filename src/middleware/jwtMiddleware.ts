import {Response, Request, NextFunction} from "express";
import * as jwt from "jsonwebtoken";
import unauthResponse from "../responses/unauthResponse";
import CONFIG from "../config/config";
import {decode, getRawToken} from "../util/token";
import {getPlayerNameById, updateLastLogin} from "../service/player";

const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const headers = req.headers;
    try {
        const token = getRawToken(headers.authorization!);
        jwt.verify(token!, CONFIG.AUTH.JWT_SECRET!);
        const decoded = decode(headers.authorization!);

        if (!await getPlayerNameById(decoded.uuid)) {
            unauthResponse(res)
            return;
        }

        // update login info asynchronously
        updateLastLogin(decoded.uuid, req.socket.remoteAddress!)
    } catch (e) {
        unauthResponse(res);
        return;
    }
    next();
};

export default jwtMiddleware;