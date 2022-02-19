const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.send('Your application is working on port 6969')
})

app.post('/calculate', function(req, res) {
    const english = Number(req.body.english)
    const maths = Number(req.body.maths)
    const science = Number(req.body.science)

    if (english > 100 || maths > 100 || science > 100)
        res.send(
            'Values cannot be more than 100. Please try again with the correct values.'
        )
    if (english < 0 || maths < 0 || science < 0)
        res.send(
            'Values cannot be less than 0. Please try again with the correct values.'
        )

    const percentage = ((english + maths + science) / 300) * 100
    res.send('Your percentage is ' + Math.round(percentage) + '%.')
})

app.listen(6969, function() {
    console.log('Server is running')
})