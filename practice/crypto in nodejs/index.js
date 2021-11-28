const express = require('express')
const app = express()
const crypto = require('crypto')
const bodyParser = require('body-parser')

// setting bodyParser settings to handle json data in body
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  res.send('Bobby says hello world')
})

app.get('/crypto/:password', async (req, res) => {
  const hash = crypto
    .createHash('sha256')
    .update('123456')
    .digest('hex')
  res.send({ message: hash })
})

app.get('/verify', async (req, res) => {
  const userPassword = '12345678'
  const userHash = crypto
    .createHash('sha256')
    .update(userPassword)
    .digest('hex')
  if (
    userHash ==
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
  )
    res.send('Login')
  else res.send('Wrong password')
})

app.post('/register', async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const hashedPassword = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex')

  //store username and hashedPassword inside your database

  res.send({ message: 'Your account is registered with us' })
})

app.listen(6969, function () {
  console.log('Bobby says server is running')
})
