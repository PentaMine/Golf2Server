import jwt from "jsonwebtoken";

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