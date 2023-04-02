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
    res.status(200).send(`kaj prčkaš majku ti vidim, ve mam tvoju ip adresu, mulec jen <h1>${req.socket.remoteAddress}<h1/>`)
})

app.use(router)

server.listen(
    port,
    host,
    () => {
        console.log(`HTTP server up, listening on ${host}:${port}`)
    }
)

import "./sockets/socket"