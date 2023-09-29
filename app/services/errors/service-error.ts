export class ServiceError extends Error {

    status: number;
    constructor(code: number, msg: string) {
        super(msg);
        this.status = code;
    }

    public log() {
        console.log(`Status:${this.status} - Message: ${this.message} - Stacktrace: ${this.stack}`)
    }

}