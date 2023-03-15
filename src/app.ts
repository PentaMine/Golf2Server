import express, {NextFunction, Request, Response} from "express";
import CONFIG from "./config/config";
import upload from "express-fileupload";
import errorMiddleware from "./middleware/jsonSyntaxMiddleware";
import sendResponse from "./responses/sendResponse";
import router from "./routes/router";
import * as http from "http";

const app = express();
export const server = http.createServer(app)

app.use("/", upload())
app.use("/", express.json())
app.use("/", errorMiddleware)

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    console.log(req.socket.remoteAddress)
    sendResponse(res, CONFIG.CODES.OK, CONFIG.MESSAGES.OK)
})

app.use(router)

server.listen(CONFIG.APP.PORT, () => console.log(`HTTP server up, listening on ${CONFIG.APP.HOST}:${CONFIG.APP.PORT}`))

import "./sockets/socket"