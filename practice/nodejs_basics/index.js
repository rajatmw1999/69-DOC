const express = require("express");
const app = express();

app.get('/', function(request, response) {
   console.log("I am the first endpoint"); 
   response.send("Today is a lovely day to study NodeJS");
})

app.listen(3000, function(){
    console.log("Server is running");
});