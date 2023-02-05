import {Response} from "express";

const sendResponse = (res: Response, code: number, message: any) => {
    res
        .status(code)
        .json({"code": code, "response": message})
}

export default sendResponse;