const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')

// setting bodyParser settings to handle json data in body
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  return res.send('Hello World. I am a traditional server.')
})

//POST REQUESTS
app.post('/file/read', async (req, res) => {
  const { filename } = req.body
  return fs.readFile(filename, function (err, data) {
    res.write(data)
    return res.end()
  })
})

app.post('/file/append', async (req, res) => {
  const { data, filename } = req.body
  fs.appendFile(filename, data, function (err) {
    if (err) {
      return res.send(String(err))
    }
    console.log('Saved!')
    return res.send('Saved')
  })
})

app.post('/file/write', async (req, res) => {
  const { data, filename } = req.body
  fs.writeFile(filename, data, function (err) {
    if (err) {
      return res.send(String(err))
    }
    console.log('Saved!')
    return res.send('Saved')
  })
})

// DUMMY GET REQUESTS
app.get('/file/read', async (req, res) => {
  return fs.readFile('names.txt', function (err, data) {
    res.write(data)
    return res.end()
  })
})

app.get('/file/append', async (req, res) => {
  fs.appendFile('names.txt', ', Peter', function (err) {
    if (err) {
      return res.send(String(err))
    }
    console.log('Saved!')
    return res.send('Saved')
  })
})

app.get('/file/write', async (req, res) => {
  fs.writeFile('movies.txt', 'Benjamin Button, Rocky, Forest Gump', function (
    err
  ) {
    if (err) {
      return res.send(String(err))
    }
    console.log('Saved!')
    return res.send('Saved')
  })
})

app.listen(5000, function () {
  console.log('Server is running')
})
