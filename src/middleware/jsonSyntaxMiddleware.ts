import CONFIG from "../config/config";
import {Response, Request, NextFunction} from "express";
import jsonSyntaxResponse from "../responses/jsonSyntaxResponse";

const errorMiddleware = (err: { status: number; message: string; }, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        jsonSyntaxResponse(res);
        return;
    }
    next();
};

export default errorMiddleware;