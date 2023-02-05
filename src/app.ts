import express, {NextFunction, Request, Response} from "express";
import CONFIG from "./config/config";
import upload from "express-fileupload";
import errorMiddleware from "./middleware/jsonSyntaxMiddleware";
import sendResponse from "./responses/sendResponse";
import router from "./routes/router";
import * as http from "http";
import * as sock from "socket.io"
import {handleSockets} from "./sockets/socket";

const app = express();
const server = http.createServer(app)
const io = new sock.Server(server, {cors: {origin: "*"}})

app.use("/", upload())
app.use("/", express.json())
app.use("/", errorMiddleware)

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    console.log(req.socket.remoteAddress)
    sendResponse(res, CONFIG.CODES.OK, CONFIG.MESSAGES.OK)
})

app.use(router)



//app.listen(CONFIG.APP.PORT, () => console.log(`Server up, listening on ${CONFIG.APP.HOST}:${CONFIG.APP.PORT}`));
server.listen(CONFIG.APP.PORT, () => console.log(`Server up, listening on ${CONFIG.APP.HOST}:${CONFIG.APP.PORT}`))
handleSockets(io);