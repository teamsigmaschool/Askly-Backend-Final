import "dotenv/config"
import { app } from "./app.js"
import { env } from "./config/env.js"

const port = Number(process.env.PORT || 3000)

app.listen(port, () => {
  console.log(`Askly API running on http://localhost:${port}`)
})
