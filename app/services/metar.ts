import axios from "axios"
import { XMLParser } from "fast-xml-parser";
import { decode } from "metar-decoder";
import { ServiceError } from "./errors/service-error";
import { DecodedMetar } from "metar-decoder/lib/types";

const METAR_ENDPOINT = "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml"
const HOURS_BEFORE = 1;

export class MetarService {

    private parser: XMLParser = new XMLParser();

    async retrieveMetarInformation(station: any): Promise<DecodedMetar> {

        if (station == undefined) {
            throw new ServiceError(400, `INVALID STATION NAME [${station}] PLEASE SEND A VALID STRING.`)
        }

        const response = await axios.get(`${METAR_ENDPOINT}&stationString=${station}&hoursBeforeNow=${HOURS_BEFORE}`);
        const parsed = this.parser.parse(response.data).response;
        this.handleParsedDataBody(parsed, station)
        
        try {
            const raw_text = parsed.data.METAR.raw_text
            return decode(raw_text)!
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
