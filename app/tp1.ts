import express from "express"
import 'dotenv/config'

import { ServiceErrorHandler } from "./services/errors/error-handlers";
import { MetarService } from "./services/metar";

const PORT = process.env.PORT
const app = express()

const METAR_SERVICE = new MetarService();


app.get("/", (req, res) => {
    res.send("TP1 - Arquitectura del Software")
})

app.get("/ping", (req, res) => {
    res.status(200).send("Application is Online")
})

app.get("/metar", async (req, res, next) => {
    try {
        const metar = await METAR_SERVICE.retrieveMetarInformation('PEPE', 1);
        res.status(200).send(metar);
    } catch (error) {
        next(error);
    }
})

app.get("/spaceflight_news", (req, res, next) => {
    try {
        res.send("TP1 - Arquitectura del Software")
    } catch (error) {
        next(error);
    }
})

app.get("/quote", (req, res, next) => {
    try {
        res.send("TP1 - Arquitectura del Software")
    } catch (error) {
        next(error);
    }
})

app.use(ServiceErrorHandler)
app.listen(PORT, () => console.log(`Server listening at localhost:${PORT}`))