const express = require('express');
const app = express();

app.get('/', MW, function(req, res){
    console.log('Working Route.')
    res.send('Hello World.')
})

function MW(req, res, next){
    console.log('Working MiddleWare');
    next();
}





app.listen(3000, function(){
    console.log('Server is running.')
})