import axios, { AxiosError, AxiosResponse } from "axios"
import { XMLParser } from "fast-xml-parser";
import { decode } from "metar-decoder";
import { ServiceError } from "./errors/service-error";
import { DecodedMetar } from "metar-decoder/lib/types";

const METAR_ENDPOINT = "https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml"

export class MetarService {

    private parser: XMLParser = new XMLParser();

    async retrieveMetarInformation(station: string, hoursBefore: number): Promise<DecodedMetar> {
        const response = await axios.get(`${METAR_ENDPOINT}&stationString=${station}&hoursBeforeNow=${hoursBefore}`);
        const parsed = this.parser.parse(response.data).response;
        this.handleParsedDataBody(parsed, station, hoursBefore)
        try {
            return decode(parsed.data.METAR.raw_text)!
        } catch (error) {
            throw new ServiceError(400, `FAILED WHILE DECODING METAR DATA FOR [STATION:${station}][HOURS_BEFORE:${hoursBefore}]`)
        }
    }

    private handleParsedDataBody(parsed: any, station: string, hoursBefore: number) {
        if (!Object.hasOwn(parsed, 'data')) {
            throw new ServiceError(400, `BAD REQUEST FOR [STATION:${station}][HOURS_BEFORE:${hoursBefore}][REASONS:${JSON.stringify(parsed.errors)}]`)
        }
        else if (!Object.hasOwn(parsed.data, "METAR")) {
            throw new ServiceError(404, `METAR DATA NOT FOUND FOR [STATION:${station}][HOURS_BEFORE:${hoursBefore}]`)
        }
    }

}
