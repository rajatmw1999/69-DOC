const app = require('express')()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/otp/generate', function (req, res) {
  const min = 10000
  const max = 90000
  const no = Math.floor(Math.random() * min) + max
  res.send(String(no))
})

app.listen(3000, function () {
  console.log('Server is running on 3000')
})