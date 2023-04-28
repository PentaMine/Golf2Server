import {config} from "dotenv";

require('dotenv').config()

const CONFIG = {
    APP: {
        HOST: process.env.APP_HOST,
        BASE_URL: process.env.API_BASE_URL,
        PORT: Number(process.env.NODE_ENV === 'test' ? 8889 : process.env.PORT || 3001),
        ENV: process.env.NODE_ENV,
        EASTER_EGG_MESSAGE: process.env.EASTER_EGG_MESSAGE
    },
    AUTH: {
        LAST_SUPPORTED_VERSION: Number(process.env.OLDEST_SUPPORTED_VERSION),
        JWT_SECRET: process.env.JWT_SECRET
    },
    RESPONSES: {
        SUCCESS: {"code": 200, "response": "ok"},
        UNAUTHORISED: {"code": 401, "response": "unauthorized"},
        NOT_FOUND: {"code": 404, "response": "artifact not found"},
        BAD_REQ: {"code": 400, "response": "bad input"},
        SERVER_ERROR: {"code": 500, "response": "server error"}
    },
    CODES: {
        OK: 200,
        UNAUTHORISED: 401,
        NOT_FOUND: 404,
        BAD_REQUEST: 400,
        SERVER_ERROR: 500,
        CONFLICT: 409,
        UPDATE_REQUIRED: 426
    },
    MESSAGES: {
        OK: "ok",
        UNAUTHORISED: "unauthorised",
        NOT_FOUND: "not found",
        BAD_REQUEST: "bad request",
        SERVER_ERROR: "internal server error",
        CONFLICT: "conflict",
        UPDATE_REQUIRED: "outdated client version"
    }
}

if (isNaN(CONFIG.APP.PORT)) {
    throw new Error("port must be a number")
}
if (isNaN(CONFIG.AUTH.LAST_SUPPORTED_VERSION) || CONFIG.AUTH.LAST_SUPPORTED_VERSION < 1000) {
    throw new Error("oldest supported version must be a number")
}

export default CONFIG