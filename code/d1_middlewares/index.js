const express = require('express');
const app = express();

const myMiddleWare = async(req, res, next) => {
    console.log("MCU Superheroes");
    next();
}

// app.use(myMiddleWare);
app.use('/:name', myMiddleWare);

app.get('/', async(req, res) => {
    return res.send("Hello World");
});

app.get('/tom-holland', async(req, res) => {
    console.log("Route");
    return res.send("Welcome to Tom Holland");
});

app.get('/robert-downey', async(req, res) => {
    console.log("Route");
    return res.send("Welcome to Robert Downey");
});

app.listen(3000, function(req, res){
    console.log("Server is live");
});