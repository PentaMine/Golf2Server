import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const updateReqResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.UPDATE_REQUIRED, CONFIG.MESSAGES.UPDATE_REQUIRED)
}

export const updateReqResponseMessage = (res: Response, message: any) => {
    sendResponse(res, CONFIG.CODES.UPDATE_REQUIRED, message)
}

export default updateReqResponse;