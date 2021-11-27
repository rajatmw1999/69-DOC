const express = require('express')
const app = express()
const bodyParser = require("body-parser");

// setting bodyParser settings to handle json data in body 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', async (req, res) => {
  res.send('Bobby says hello world')
})

app.listen(6969, function () {
  console.log('Server is sprinting!')
})
