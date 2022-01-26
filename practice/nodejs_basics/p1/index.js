const express = require('express');
const app = express();

app.get('/', function(request, response){
    response.send("Hello World");
})

app.get('/explore', function(request, response){
    response.send("You are exploring")
})

app.get('/user', function(request, response){
    const {username, password} = request.query;
    response.send(username + ' '  + password);
})

app.listen(3000, function(){
    console.log("Server is live on port 3000");
})