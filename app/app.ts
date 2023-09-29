import express from "express"
import 'dotenv/config'

const port = process.env.PORT
const app = express()

app.get("/", (req, res) => {
    res.send("Hello from Express!")
})

app.listen(port, () => {
    console.log(`now listening on: port:${port}`)
})