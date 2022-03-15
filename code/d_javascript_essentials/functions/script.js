// console.log('Functions Basics and Advanced.')

// 1. Either i want to execute code again and again
// 2. Or I want to write code here but exeute that code somewhere else

// var myClass = 10

function handlesubmit(){
    let m1 = Number(document.getElementById("first").value);
    let m2 = Number(document.getElementById("second").value);
    shouryaisboss(m1, m2);
}

function shouryaisboss (marks1, marks2) {
  console.log('This is my first function.')
  console.log('Total marks = ', marks1 + marks2)
}