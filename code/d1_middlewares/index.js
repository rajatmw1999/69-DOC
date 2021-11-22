const express = require('express');
const app = express();


const myMiddleWare = (req, res, next) => {
    if(req.query.name == 'Guddu')
    {
        console.log("first middleware")
        next();
    }
    else{
        return res.send({"message":"Who are you?? I need Guddu!"});
    }
}

app.use(myMiddleWare);

app.get('/', async(req, res) => {
    console.log("/ route");
    return res.send({"message":"Hello Cruel World"});
});

app.get('/mirzapur',async(req, res) => {
    console.log("Inside mirzapur");
    return res.send({"message":"Hello Guddu Bhaiya"});
});

app.listen(6969, function(){
    console.log("server is running like usain bolt");
})