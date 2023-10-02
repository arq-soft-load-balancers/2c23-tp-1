import axios, { AxiosResponse } from "axios"
import { ServiceError } from "./errors/service-error.js"
import { Article } from "./dtos/article.js"

const SPACE_FLIGHT_ENDPOINT = "https://api.spaceflightnewsapi.net/v3/articles?_limit="

export class SpaceFlightService {
    
    async retrieveSpaceNews(amount: number): Promise<string[]> {
        const response = await axios.get<Article[]>(`${SPACE_FLIGHT_ENDPOINT}${amount}`)
        this.sanitizeArticles(response)
        const titles: string[] = []
        response.data.forEach(a => titles.push(a.title))
        return titles
    }

    private sanitizeArticles(articleResponse: AxiosResponse<Article[], any>) {
        if (!Object.hasOwn(articleResponse, 'data')) {
            throw new ServiceError(400, "Failed to retrieve SpaceFlightNews...")
        }
    } 

}