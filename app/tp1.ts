import express from "express"
import 'dotenv/config'

import { ServiceErrorHandler } from "./services/errors/error-handlers.js";
import { MetarService } from "./services/metar.js";
import { SpaceFlightService } from "./services/spaceflight.js";
import { QuoteService } from "./services/quote.js";
import { createClient } from "redis";
import { exit } from "process";
import { ServiceError } from "./services/errors/service-error.js";
import { TimingType } from "./services/metrics.js";
import rateLimit from "express-rate-limit";

const PORT = process.env.PORT
const REDIS_STRING = process.env.REDIS_URL

const app = express()

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 500
})
app.use(limiter)

export const redis = await createClient({url: REDIS_STRING})
.on('error', err => {
    console.log('Redis Client Error', err)
    exit();
})
.on('connect' , () => {
    console.log(`Redis Client is UP at ${REDIS_STRING}!`)
})
.connect();

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
  
async function cleanup() {
    if (redis.isOpen) {
        await redis.flushAll();
        await redis.quit();
        process.exit();
    }
    else process.exit();
};

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
        if (station == undefined) {
            throw new ServiceError(400, `INVALID STATION NAME [${station}] PLEASE SEND A VALID STRING.`)
        }
        const use_cache = req.headers['cache'];
        const metar = await METAR_SERVICE.metricReporter.executeAndTime(async () => { return (use_cache === undefined) 
            ? await METAR_SERVICE.retrieveMetarInformation(station)
            : await METAR_SERVICE.retrieveMetarInformationCached(station);
        }, TimingType.INTERNAL)
        res.status(200).send(metar);
    } catch (error) {
        next(error);
    }
})

app.get("/spaceflight_news",async (req, res, next) => {
    try {
        const use_cache = req.headers['cache'];
        const spaceTitles = await SPACE_SERVICE.metricReporter.executeAndTime(async () => { return (use_cache === undefined) 
            ? await SPACE_SERVICE.retrieveSpaceNews(5)
            : await SPACE_SERVICE.retrieveSpaceNewsCached(5);
        }, TimingType.INTERNAL)
        res.status(200).send(spaceTitles)
    } catch (error) {
        next(error);
    }
})

app.get("/quote", async (req, res, next) => {
    try {
        const use_cache = req.headers['cache'];
        const quote = await QUOTE_SERVICE.metricReporter.executeAndTime(async () => { return (use_cache === undefined) 
            ? await QUOTE_SERVICE.retrieveQuote()
            : await QUOTE_SERVICE.retrieveQuoteCached();
        }, TimingType.INTERNAL)
        res.status(200).send(quote)
    } catch (error) {
        next(error);
    }
})

app.use(ServiceErrorHandler)
app.listen(PORT, () => {
    console.log(`Server listening at localhost:${PORT}`);
})