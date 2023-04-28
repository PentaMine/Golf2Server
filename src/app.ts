import express from "express";
import CONFIG from "./config/config";
import errorMiddleware from "./middleware/jsonSyntaxMiddleware";
import router from "./routes/router";
import * as http from "http";
import {easterEgg} from "./controller/easterEggController"

const port: number = Number(CONFIG.APP.PORT);
const host: string = CONFIG.APP.HOST!;
const app = express();
export const server = http.createServer(app)

app.use("/", express.json())
app.use("/", errorMiddleware)
app.get("/", easterEgg)

app.use(router)

server.listen(
    port,
    host,
    () => {
        console.log(`HTTP server up, listening on ${host}:${port}`)
    }
)

// start WS server after HTTP server is up
import "./sockets/socket"