import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const okResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.OK, CONFIG.MESSAGES.OK)
}

export const okResponseMessage = (res: Response, message: any) => {
    sendResponse(res, CONFIG.CODES.OK, message)
}

export default okResponse;