import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const badReqResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.BAD_REQUEST, CONFIG.MESSAGES.BAD_REQUEST)
}

export const badReqResponseMessage = (res: Response, message: any) => {
    sendResponse(res, CONFIG.CODES.BAD_REQUEST, message)
}

export default badReqResponse;