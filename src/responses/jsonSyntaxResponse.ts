import {Response} from "express";
import CONFIG from "../config/config";
import sendResponse from "./sendResponse";

const jsonSyntaxResponse = (res: Response) => {
    sendResponse(res, CONFIG.CODES.BAD_REQUEST, "bad json syntax")
}

export default jsonSyntaxResponse;