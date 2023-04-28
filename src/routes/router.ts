import {Router} from "express";
import {authoriseClient, verifyAuth} from "../controller/playerController";
import jwtMiddleware from "../middleware/jwtMiddleware";
import {createSession, exitSession, getAvailableSessions, joinSession} from "../controller/sessionControler";
import {getNNewestSessions} from "../service/session";
import okResponse from "../responses/okResponse";

const router = Router();

router.post("/clientauth", authoriseClient)
router.post("/browsesessions", getAvailableSessions)
router.get("/browsesessions", getAvailableSessions)

router.use("/", jwtMiddleware)

router.post("/newsession", createSession)
router.post("/joinsession", joinSession)
router.post("/leavesession", exitSession)
router.post("/verifyauth", verifyAuth)
router.get("/verifyauth", verifyAuth) // backwards compatibility (deprecated)
export default router
