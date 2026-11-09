const userModel = require("../models/user.model")
const tokenBlacklistModel = require("../models/blacklist.model")
const jwt = require("jsonwebtoken")

async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access: No Token found"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({token})

    if(isBlacklisted){
        return res.status(401).json({
            message: "Unauthorized access: Invalid Token"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId)
        req.user = user
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access: Invalid Token"
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access: No Token found"
        })
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({token})

    if(isBlacklisted){
        return res.status(401).json({
            message: "Unauthorized access: Invalid Token"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if(!user.systemUser){
            return res.status(403).json({
                message:"Forbidden Access, not a system user!"
            })
        }

        req.user = user
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access: Invalid Token"
        })
    }
}

module.exports = { authMiddleware, authSystemUserMiddleware }