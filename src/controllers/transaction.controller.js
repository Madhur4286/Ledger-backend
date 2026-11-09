const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const userModel = require("../models/user.model")
const emailServices = require("../services/email.service")
const mongoose = require('mongoose')


/*
Create a new transaction 
THE 10-STEP TRANSFER FLOW:  
1.Validate request
2. Validate idempotency key
3. Check account status 
4. Derive sender balance from ledger 
5. Create transaction (PENDING) 
6. Create DEBIT ledger entry
7. Create CREDIT ledger entry  
8. Mark transaction COMPLETED 
9. Commit MongoDB session  
10. Send email notification

*/

async function createTransaction(req, res) {

    // 1.Validate request

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    const toUserName = await userModel.findOne({
        _id: toUserAccount.user
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount!"
        })
    }

    // 2. Validate idempotency key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status == "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status == "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }
        if (isTransactionAlreadyExists.status == "FAILED") {
            return res.status(500).json({
                message: "Transaction already failed. Please try again!"
            })
        }
        if (isTransactionAlreadyExists.status == "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed. Please try again!"
            })
        }
    }

    // 3. Check account status 

    if (fromUserAccount.status !== "ACTIVE" || fromUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount! must be active to process a transaction!"
        })
    }

    // 4. Derive sender balance from ledger --> imp. aggregation pipeline

    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance: ${balance} and requested balance: ${amount}.`
        })
    }

    // 5. Create transaction (PENDING)

    let transaction;
    try {
        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0]

        // 6. Create DEBIT ledger entry

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            type: "DEBIT",
            amount: amount,
            transaction: transaction._id
        }], { session })

        // 7. Create CREDIT ledger entry  

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            type: "CREDIT",
            amount: amount,
            transaction: transaction._id
        }], { session })

        // 8. Mark transaction COMPLETED 

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        // 9. Commit MongoDB session  

        await session.commitTransaction()
        session.endSession()
    } catch (err) {
        return res.status(400).json({
            message: "Transaction is pending due to some error. Please try again after some time!"
        })
    }

    // 10. Send email notification

    await emailServices.sendTransactionEmail(req.user.email, req.user.username, amount, toUserName.username)

    return res.status(201).json({
        message: "Transaction successfull!",
        transaction: transaction
    })
}


// initial fund controller

async function createInitialFundsController(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findById({
        _id: toAccount
    })

    const toUserName = await userModel.findOne({
        _id: toUserAccount.user
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount!"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(404).json({
            message: "System User Account not found!"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        transaction: transaction._id,
        amount,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        transaction: transaction._id,
        amount,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    await emailServices.sendTransactionEmail(req.user.email, req.user.username, amount, toUserName.username)

    return res.status(201).json({
        message: "Initial fund transaction is completed.",
        transaction: transaction
    })

}
module.exports = { createTransaction, createInitialFundsController }