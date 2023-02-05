import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const conflictResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.CONFLICT, CONFIG.MESSAGES.CONFLICT)
}

export const conflictResponseMessage = (res: Response, message: any) => {
    sendResponse(res, CONFIG.CODES.CONFLICT, message)
}

export default conflictResponse;