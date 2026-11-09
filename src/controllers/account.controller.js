const accountModel = require('../models/account.model')

async function createAccountController(req,res){
    const user = req.user
    const account = await accountModel.create({
        user: user._id
    })

    res.status(201).json({
        message:"Account created successfully!",
        account
    })
}

async function getAccountsController(req,res){
    const user = req.user
    const accounts = await accountModel.find({user:user._id})

    res.status(200).json({
        message:"Account fetched successfully!",
        accounts
    })
}

async function getBalanceController(req,res){
    const {accountId} = req.params
    const account = await accountModel.findOne({
        _id: accountId,
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"Account not found!"
        })
    }

    const balance = await account.getBalance()

    res.status(200).json({
        message:"Balance found!",
        balance:balance
    })
}


module.exports = {createAccountController, getAccountsController, getBalanceController}