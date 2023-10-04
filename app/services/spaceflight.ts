import axios, { AxiosResponse } from "axios"
import { ServiceError } from "./errors/service-error.js"
import { Article } from "./dtos/article.js"
import { MetricService, TimingType } from "./metrics.js"

const SPACE_FLIGHT_ENDPOINT = "https://api.spaceflightnewsapi.net/v3/articles?_limit="

export class SpaceFlightService {

    public metricReporter = new MetricService("spaceflight");
    
    async retrieveSpaceNews(amount: number): Promise<string[]> {
        const response = await this.metricReporter.executeAndTime(async () => {
            return await axios.get<Article[]>(`${SPACE_FLIGHT_ENDPOINT}${amount}`)
        }, TimingType.EXTERNAL)
        this.sanitizeArticles(response)
        return this.extractTitles(response.data)
    }
    private extractTitles(articles: Article[]): string[] {
        const titles: string[] = []
        articles.forEach(a => titles.push(a.title))
        return titles;
    }


    private sanitizeArticles(articleResponse: AxiosResponse<Article[], any>) {
        if (!Object.hasOwn(articleResponse, 'data')) {
            throw new ServiceError(400, "Failed to retrieve SpaceFlightNews...")
        }
    } 

}