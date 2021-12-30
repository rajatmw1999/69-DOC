const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()

app.get('/', async (req, res) => {
  res.send('Hello')
})

app.get('/jwt', async (req, res) => {
  const username = 'Mohil'
  const token = jwt.sign({ username: username, exp: Math.floor(Date.now() / 1000) + (20) }, 'RAJATMOHILSECRET')
  res.send(String(token))
})

app.get('/verify', async (req, res) => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik1vaGlsIiwiZXhwIjoxNjQwNzc2MDQ0LCJpYXQiOjE2NDA3NzYwMjR9.OzzswkIGZ7366ttcoY8W-muaC5WteOx9LxSnW6pczUk'
  console.log(token)
  var decoded = jwt.verify(token, 'RAJATMOHILSECRET')
  console.log(decoded) // bar
  res.send(decoded)
})

app.listen('6969', function () {
  console.log('Server is online on 6969')
})
