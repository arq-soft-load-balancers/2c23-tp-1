import axios from "axios"
import { XMLParser } from "fast-xml-parser";
import { decode } from "metar-decoder";
import { ServiceError } from "./errors/service-error.js";
import { DecodedMetar } from "metar-decoder/lib/types.js";
import { MetricService, TimingType } from "./metrics.js";

const METAR_ENDPOINT = "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml"
const HOURS_BEFORE = 1;

export class MetarService {

    private parser: XMLParser = new XMLParser();
    public metricReporter = new MetricService("metar");

    async retrieveMetarInformation(station: any): Promise<DecodedMetar[]> {
        const response = await this.metricReporter.executeAndTime(async () => {
            return await axios.get(`${METAR_ENDPOINT}&stationString=${station}&hoursBeforeNow=${HOURS_BEFORE}`)
        }, TimingType.EXTERNAL);
        const parsed = this.parser.parse(response.data).response;
        this.handleParsedDataBody(parsed, station)
        let metar = [parsed.data.METAR].flat();
        metar = metar.map((data) => {return data.raw_text})
        try {
            return metar.map((data) => decode(data)!)
        } catch (error) {
            throw new ServiceError(400, `FAILED WHILE DECODING METAR DATA FOR [STATION:${station}]`)
        }
    }
    
    private handleParsedDataBody(parsed: any, station: string) {
        if (!Object.hasOwn(parsed, 'data')) {
            throw new ServiceError(400, `BAD REQUEST FOR [STATION:${station}][REASONS:${JSON.stringify(parsed.errors)}]`)
        }
        else if (!Object.hasOwn(parsed.data, "METAR")) {
            throw new ServiceError(404, `METAR DATA NOT FOUND FOR [STATION:${station}]`)
        }
    }

}
