const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const MY_JWT_SECRET = 'wasted'

// setting bodyParser settings to handle json data in body
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  res.send('Bobby says hello world')
})

app.get('/login/:username/:password', async (req, res) => {
  const { username, password } = req.params
  console.log(username, password)
  //making a db call to verify password and username
  //select * from users where username=username and password=password
  const token = jwt.sign({ user: username }, MY_JWT_SECRET)
  console.log(token)
  return res.send({ message: 'We got your data bobby' })
})

app.get('/my-favorite-videos/:token', async (req, res) => {
  const { token } = req.params
  try {
    jwt.verify(token, MY_JWT_SECRET)
  } catch (err) {
    console.log('OOPS!')
    return res.send('Not verified')
  }
  return res.send('Here are your videos')
})

app.listen(6969, function () {
  console.log('Server is sprinting!')
})
