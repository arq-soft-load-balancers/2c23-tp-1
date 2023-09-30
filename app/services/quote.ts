import axios, { AxiosResponse } from "axios";
import { Quote } from "./dtos/quote";
import { ServiceError } from "./errors/service-error";

const QUOTE_ENDPOINT = "https://api.quotable.io/quotes/random?limit=1"

export class QuoteService {

    async retrieveQuote(): Promise<Quote> {
        const response = await axios.get<Quote[]>(`${QUOTE_ENDPOINT}`)
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