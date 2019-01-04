require('dotenv').config()

const express = require('express')
const axios = require('axios')

const jwt = require('jsonwebtoken')

const usersDb = require('../data/helpers/usersHelpers.js')

const router = express.Router()

// generates jwt
const generateToken = user => {
  const payload = {
    subject: user.id,
    username: user.username,
    email: user.email,
    slackHandle: user.slack_handle
  }

  const secret = process.env.JWT_SECRET || 'super secret!' // don't forget to update production environment

  const options = {
    expiresIn: '6h'
  }

  return jwt.sign(payload, secret, options)
}

// [POST] /api/users/register
// registers an new user
router.post('/checkuser', async (req, res) => {
  const { username } = req.body
  const availableUsername = await usersDb.availableUsername(username)
  if (availableUsername) return res.status(200).end()
  return res.status(400).send({ err: 'Name taken!' })
})

router.post('/checkmail', async (req, res) => {
  const { email } = req.body
  const availableEmail = await usersDb.availableEmail(email)
  if (availableEmail) return res.status(200).end()
  return res.status(400).send({ err: 'email taken!' })
})

router.post('/slackhandle', async (req, res) => {
  const { slackhandle } = req.body
  const availableHandle = await usersDb.availableHandle(slackhandle)
  if (availableHandle) return res.status(200).end()
  return res.status(400).send({ err: 'Handle taken!' })
})

router.post('/login', async (req, res) => {
  const { token } = req.body
  const response = await axios
    .get(
      `https://slack.com/api/oauth.access?client_id=${
        process.env.CLIENTID
      }&client_secret=${process.env.CLIENTSECRET}&code=${token}`
    )
    .catch(e => console.log('OAuth failure!', e))

  const avail = await usersDb
    .availableId(response.data.user.id)
    .catch(e => console.log('Error checking for availability', e))

  if (avail) {
    const id = await usersDb
      .registerUser(response.data)
      .catch(e => console.log('error creating new user!', e))
  }
  res.status(200).send({ data: response.data })
})

module.exports = router
