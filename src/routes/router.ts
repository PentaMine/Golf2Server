import {Router} from "express";
import {authoriseClient, getAvailableSessions} from "../controller/playerController";
import jwtMiddleware from "../middleware/jwtMiddleware";
import {createSession, exitSession, joinSession} from "../controller/sessionControler";
import {getNNewestSessions} from "../service/session";
import okResponse from "../responses/okResponse";
import { getLeaderBoard, registerSubmiter, submitScore } from "../controller/kuracKlikerController";

const router = Router();

router.post("/clientauth", authoriseClient)
router.post("/browsesessions", getAvailableSessions)
router.get("/browsesessions", getAvailableSessions)

// dik kliker
router.post("/dksubmit", submitScore)
router.get("/dkleaderboard", getLeaderBoard)
router.get("/dkauth", registerSubmiter)
// dik kliker

router.use("/", jwtMiddleware)

router.post("/newsession", createSession)
router.post("/joinsession", joinSession)
router.post("/leavesession", exitSession)
router.get("/verifyauth", (req, res) => {okResponse(res);})
export default router