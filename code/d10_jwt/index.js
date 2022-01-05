const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')

app.get('/', async (req, res) => {
  res.send('Hello')
})

app.get('/login/:username/:password', async (req, res) => {
  const { username, password } = req.params
  console.log(username, password)
  if (username == 'mat' && password == 'dragon') {
    const token = jwt.sign({ username: 'mat', exp: (Math.floor(Date.now()/1000) + 20) }, 'MATCOUTHON')
    return res.send({ message: 'Success', token: token })
  }
  return res.send('Failure')
})

app.get('/verify/:token', async (req, res) => {
  const { token } = req.params
  var verify
  try {
    verify = jwt.verify(token, 'MATCOUTHON')
  } catch (err) {
    console.log('Token is incorrect')
    res.send('Token is incorrect')
  }
  console.log(verify)
  res.send(verify)
})

app.listen('6969', function () {
  console.log('Server is online on 6969')
})
