import { StatsD } from "hot-shots";

export class MetricService {

    public clock: Date;
    public statsClient: StatsD;

    constructor() {
        this.clock = new Date()
        this.statsClient = new StatsD({
            host: "graphite",
            port: 8125
        })
    }
}