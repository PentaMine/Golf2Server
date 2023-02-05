import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const unauthResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.UNAUTHORISED, CONFIG.MESSAGES.UNAUTHORISED)
}

export const unauthResponseMessage = (res: Response, message: any) => {
    sendResponse(res, CONFIG.CODES.UNAUTHORISED, message)
}

export default unauthResponse;