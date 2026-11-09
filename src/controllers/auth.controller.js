const userModel = require("../models/user.model")
const tokenBlacklistModel = require("../models/blacklist.model")
const jwt = require("jsonwebtoken")
const emailService = require('../services/email.service')

async function userRegisterController(req, res) {
    const { username, email, password } = req.body

    const userAlreadyExist = await userModel.findOne({ email: email })

    if (userAlreadyExist) {
        return res.status(422).json({
            message: "User already exists with this email.!",
            status: "failed",
        })
    }

    const user = await userModel.create({
        username, email, password
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "3d"
    })

    res.cookie("token", token)

    res.status(201).json({
        message: "User registered succesfully",
        user: {
            id: user._id,
            name: user.username,
            email: user.email
        }
    })

    await emailService.sendRegisterEmail(user.email, user.username)
}

async function userLoginController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email: email }).select("+password")

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials!" })
    }

    const isValidUser = await user.comparePassword(password)

    if (!isValidUser) {
        return res.status(401).json({ message: "Invalid credentials!" })
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "3d"
    })

    res.cookie("token", token)

    res.status(200).json({
        message: "User loggedin succesfully",
        user: {
            id: user._id,
            name: user.username,
            email: user.email
        }
    })
}

async function UserLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(400).json({
            message: "Token not found"
        })
    }

    res.clearCookie("token")

    await tokenBlacklistModel.create({
        token: token
    })

    res.status(200).json({
        message: "User Logged out successfully!"
    })

}

module.exports = {
    userRegisterController,
    userLoginController,
    UserLogoutController
}
