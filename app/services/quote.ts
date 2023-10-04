import axios, { AxiosResponse } from "axios";
import { Quote } from "./dtos/quote.js";
import { ServiceError } from "./errors/service-error.js";
import { MetricService, TimingType } from "./metrics.js";

const QUOTE_ENDPOINT = "https://api.quotable.io/quotes/random?limit="
const QUOTE_SINGLE_LIMIT = 1;
export class QuoteService {

    public metricReporter = new MetricService("quotes");

    async retrieveQuote(): Promise<Quote> {
        const response = await this.metricReporter.executeAndTime(async () => {
            return await axios.get<Quote[]>(`${QUOTE_ENDPOINT}${QUOTE_SINGLE_LIMIT}`)
        }, TimingType.EXTERNAL);
        this.sanitizeQuote(response)
        const quote = response.data[0];
        return new Quote(quote.author, quote.content)
    }
 
    private sanitizeQuote(quoteResponse: AxiosResponse<Quote[], any>) {
        if (!Object.hasOwn(quoteResponse, 'data')) {
            throw new ServiceError(400, "Failed to retrieve Random Quote...")
        }
    }

}