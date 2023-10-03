import axios, { AxiosResponse } from "axios";
import { Quote } from "./dtos/quote.js";
import { ServiceError } from "./errors/service-error.js";
import { redis } from "../tp1.js";
import { MetricService, TimingType } from "./metrics.js";

const QUOTE_ENDPOINT = "https://api.quotable.io/quotes/random?limit="
const QUOTE_SINGLE_LIMIT = 1;
const QUOTE_CACHE_LIMIT = 50;
const QUOTE_TTL = 5;
const CACHED_QUOTES_KEY = "quotes";

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

    async retrieveQuoteCached(): Promise<Quote> {
        let cached_quotes = await redis.get(CACHED_QUOTES_KEY);
        if (cached_quotes !== null) {
            const parsed_quotes: Quote[] = JSON.parse(cached_quotes);
            const single_quote: Quote = parsed_quotes.pop()!;    
            if (parsed_quotes.length > 0) {
                console.log(`FOUND CACHED QUOTES -> REMAINING: ${parsed_quotes.length}`)
                await redis.set(CACHED_QUOTES_KEY, JSON.stringify(parsed_quotes), {EX: QUOTE_TTL})
            }
            else {
                console.log(`RAN OUT OF CACHED QUOTES.`)
                await redis.del(CACHED_QUOTES_KEY);
            }
            return new Quote(single_quote.author, single_quote.content)
        }
        else if (cached_quotes === null) {
            const response = await axios.get<Quote[]>(`${QUOTE_ENDPOINT}${QUOTE_CACHE_LIMIT}`)
            this.sanitizeQuote(response)
            await redis.set(CACHED_QUOTES_KEY, JSON.stringify(response.data), {EX: QUOTE_TTL})
            console.log(`REFILLED CACHED QUOTES.`)
        }
        return this.retrieveQuote();
    }
 
    private sanitizeQuote(quoteResponse: AxiosResponse<Quote[], any>) {
        if (!Object.hasOwn(quoteResponse, 'data')) {
            throw new ServiceError(400, "Failed to retrieve Random Quote...")
        }
    }

}