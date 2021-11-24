const express = require('express')
const app = express()
const socialRoutes = require('./routes')

app.use('/social', socialRoutes)

app.get('/', async (req, res) => {
  console.log('/ route')
  return res.send({ message: 'Hello Cruel World' })
})

app.listen(6969, function () {
  console.log('server is running like usain bolt')
})
