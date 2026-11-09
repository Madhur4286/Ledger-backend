const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const transactionController = require('../controllers/transaction.controller')

const router = express.Router()


router.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)


router.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsController)


module.exports = router