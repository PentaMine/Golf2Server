import express, {NextFunction, Request, Response} from "express";
import CONFIG from "./config/config";
import errorMiddleware from "./middleware/jsonSyntaxMiddleware";
import sendResponse from "./responses/sendResponse";
import router from "./routes/router";
import * as http from "http";


const port: number = Number(CONFIG.APP.PORT);
const host: string = CONFIG.APP.HOST!;
const app = express();
export const server = http.createServer(app)

app.use("/", express.json())
app.use("/", errorMiddleware)

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    sendResponse(res, CONFIG.CODES.OK, req.socket.remoteAddress)
})

app.use(router)

server.listen(
    port,
    "::",
    () => {
        console.log(`HTTP server up, listening on ${host}:${port}`)
    }
)

import "./sockets/socket"