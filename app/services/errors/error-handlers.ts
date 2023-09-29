import e, { NextFunction, Request, Response } from "express";
import { ServiceError } from "./service-error";

function errorHandler(error: Error, request: Request, response: Response , next: NextFunction) {
    if (error instanceof ServiceError) {
        error.log();
        response.status(error.status!)
        .send(error.message)
    }
    response.status(500).send(error.message);
}

export {errorHandler as ServiceErrorHandler} 