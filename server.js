require("dotenv").config()
const app = require("./src/app")
const connectDb = require('./src/config/db')
const dns = require('node:dns')
dns.setServers(["8.8.8.8","1.1.1.1"])

const PORT = process.env.PORT || 3000

connectDb()


app.listen(PORT, () => {
    console.log(`Server is running on port 3000`)
})