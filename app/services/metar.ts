import axios from "axios"
import { XMLParser } from "fast-xml-parser";
import { decode } from "metar-decoder";
import { ServiceError } from "./errors/service-error.js";
import { DecodedMetar } from "metar-decoder/lib/types.js";
import { METRIC_SERVICE, redis } from "../tp1.js";

const METAR_ENDPOINT = "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml"
const HOURS_BEFORE = 1;
const CACHE_METAR_KEY = "METAR_"

export class MetarService {

    private parser: XMLParser = new XMLParser();

    async retrieveMetarInformation(station: any): Promise<DecodedMetar[]> {
        const start = METRIC_SERVICE.clock.getTime();
        const response = await axios.get(`${METAR_ENDPOINT}&stationString=${station}&hoursBeforeNow=${HOURS_BEFORE}`);
        const end = METRIC_SERVICE.clock.getTime();
        METRIC_SERVICE.statsClient.timing("metar.endpoint_time", end - start)
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

    async retrieveMetarInformationCached(station: any) {
        const current_key = `${CACHE_METAR_KEY}${station}`
        const cached_metar = await redis.get(current_key)
        if (cached_metar === null) {
            console.log(`METAR NOT FOUND IN CACHE FOR ${station} - REFRESHING...`)
            const metar = await this.retrieveMetarInformation(station);
            await redis.set(current_key, JSON.stringify(metar), {EX: 60})
            return metar
        }
        console.log(`CACHE HIT FOR METAR -- ${station}`)
        return JSON.parse(cached_metar);
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
