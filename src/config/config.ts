require('dotenv').config()

const CONFIG = {
    APP: {
        HOST: process.env.APP_HOST,
        BASE_URL: process.env.API_BASE_URL,
        PORT: process.env.NODE_ENV === 'test' ? 8889 : process.env.PORT || 3001,
        ENV: process.env.NODE_ENV,
    },
    AUTH : {
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
        UNAUTHORISED : 401,
        NOT_FOUND: 404,
        BAD_REQUEST: 400,
        SERVER_ERROR: 500,
        CONFLICT: 409
    },
    MESSAGES: {
        OK: "ok",
        UNAUTHORISED : "unauthorised",
        NOT_FOUND: "not found",
        BAD_REQUEST: "bad request",
        SERVER_ERROR: "internal server error",
        CONFLICT: "conflict"
    }
}

export default CONFIG