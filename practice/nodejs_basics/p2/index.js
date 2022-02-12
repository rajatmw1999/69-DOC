const express = require('express');
const app = express();

app.get('/', function(request, response) {
    response.send("Hello World");
})

app.get('/marks', function(request, response) {
    const myMarks1 = Number(request.query.myMarks1);
    const myMarks2 = Number(request.query.myMarks2);
    const myMarks3 = Number(request.query.myMarks3);
    console.log(myMarks1, myMarks2, myMarks3);
    // if (myMarks > 90) {
    //     response.send("Your grade is A");
    // } else if (myMarks > 60) {
    //     response.send("Your grade is B");
    // } else {
    //     response.send("Your grade is C");
    // }\
    const percentage = (((myMarks1 + myMarks2 + myMarks3) / 300) * 100);
    console.log(percentage);
    response.send("Your percentage is : " + Math.round(percentage));
});

app.listen(3000, function() {
    console.log("Server is running on port 3000");
})