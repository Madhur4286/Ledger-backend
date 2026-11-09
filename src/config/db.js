const mongoose = require('mongoose')

async function connectDb() {
    mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            console.log(`Connected to DB`)
        })
        .catch((err)=>{
            console.log(`Error connecting to Db`)
            process.exit(1)
        })
}

module.exports = connectDb