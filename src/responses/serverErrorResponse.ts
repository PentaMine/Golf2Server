import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const serverErrorResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.BAD_REQUEST, CONFIG.MESSAGES.BAD_REQUEST)
}

export const serverErrorResponseMessage = (res: Response, message: any) => {
    sendResponse(res, CONFIG.CODES.SERVER_ERROR, message)
}

export default serverErrorResponse;