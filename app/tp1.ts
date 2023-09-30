import express from "express"
import 'dotenv/config'

import { ServiceErrorHandler } from "./services/errors/error-handlers";
import { MetarService } from "./services/metar";
import { SpaceFlightService } from "./services/spaceflight";
import { QuoteService } from "./services/quote";

const PORT = process.env.PORT
const app = express()

const METAR_SERVICE = new MetarService();
const SPACE_SERVICE = new SpaceFlightService();
const QUOTE_SERVICE = new QuoteService();

app.get("/", (req, res) => {
    res.send("TP1 - Arquitectura del Software")
})

app.get("/ping", (req, res) => {
    res.status(200).send("Application is Online")
})

app.get("/metar", async (req, res, next) => {
    try {
        const station = req.query.station
        const metar = await METAR_SERVICE.retrieveMetarInformation(station);
        res.status(200).send(metar);
    } catch (error) {
        next(error);
    }
})

app.get("/spaceflight_news", async (req, res, next) => {
    try {
        const spaceTitles = await SPACE_SERVICE.retrieveSpaceNews(10);
        res.status(200).send(spaceTitles)
    } catch (error) {
        next(error);
    }
})

app.get("/quote", async (req, res, next) => {
    try {
        const quote = await QUOTE_SERVICE.retrieveQuote();
        res.status(200).send(quote)
    } catch (error) {
        next(error);
    }
})

app.use(ServiceErrorHandler)
app.listen(PORT, () => console.log(`Server listening at localhost:${PORT}`))