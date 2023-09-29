import express from "express"
import 'dotenv/config'

const port = process.env.PORT
const app = express()

app.get("/", (req, res) => {
    res.send("Hello from Express!")
})

app.get("/ping", async (req, res) => {
    res.status(200).send("Application is Up!")
})

app.listen(port, () => {
    console.log(`now listening on: port:${port}`)
})