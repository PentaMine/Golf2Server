import jwt from "jsonwebtoken";
import CONFIG from "../config/config";

export const decode = (token: string) => {
    token = getRawToken(token);
    return JSON.parse(JSON.stringify(jwt.decode(token)));
}

export const decodeNoPrefix = (token: string) => {
    return JSON.parse(JSON.stringify(jwt.decode(token)));
}

export const getRawToken = (auth: string) => {
    auth = auth.replace("Bearer ", "");
    return auth;
}

export const isTokenValid = (token: string) => {
    try {
        jwt.verify(token, CONFIG.AUTH.JWT_SECRET!)
    } catch (e) {
        return false
    }
    return true
}