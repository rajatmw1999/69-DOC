// create a script in javascript that will define 3 variables
// to store narks of 3 subjects
// then calculate the overall percentage of the subjects and print
// "A" if percentage is more than 80, print "B" if it is between 60 and 80
// print "c" otherwise

var a = 90
var b = 70
var c = 70
var d = ((a + b + c)/300)*100

console.log(Math.round(d),"%")

if(d<60) console.log("C")
if(60<d && d<80) console.log("B")
if(80<d) console.log("A")