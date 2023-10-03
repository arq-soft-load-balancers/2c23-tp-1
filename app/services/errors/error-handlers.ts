import { NextFunction, Request, Response } from "express";
import { ServiceError } from "./service-error.js";

function errorHandler(error: any, request: Request, response: Response , next: NextFunction) {
    if (error instanceof ServiceError) {
        error.log();
        response.status(error.status!)
        .send(error.message)
    }
    else if (Object.hasOwn(error, "response")) {
        response.status(error.response.status).send(JSON.stringify(error))
    }
    else if (Object.hasOwn(error, "request")) {
        response.status(500).send(JSON.stringify(error.request))
    }
    else {
        response.status(500).send(error.message);
    }
}

export {errorHandler as ServiceErrorHandler} 