import { StatsD } from "hot-shots";
import convertHrtime from 'convert-hrtime';

const HOST = "graphite" || process.env.METRICS_HOST;
const PORT = 8125     || process.env.METRICS_PORT;

export enum TimingType { 
    INTERNAL = "INTERNAL",
    EXTERNAL = "EXTERNAL"
}

export class MetricService {

    public statsClient: StatsD;
    private service: String;

    constructor(service: String) {
        this.service = service;
        this.statsClient = new StatsD({
            host: HOST,
            port: PORT,
            prefix: this.service + "."
        })
    }

    public send(timing: number, metric: string) {
        this.statsClient.gauge(metric, timing);
    }

    public async executeAndTime(runnable: Function, type: TimingType) : Promise<any> {
        const start = process.hrtime.bigint();
        const result = await runnable();
        const timeTaken = this.parseToMs(process.hrtime.bigint() - start);
        this.send(timeTaken, "execution_time." + type.toLowerCase())
        return result;
    } 

    private parseToMs(diff: bigint): number {
        const parsedTime = convertHrtime(diff)
        return parsedTime.milliseconds;
    }
}