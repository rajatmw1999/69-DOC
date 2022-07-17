// TOPIC 1 - FILTER
// const numbers = [12, 34, 45, 56, 67]

// function voting(age){
//     return age < 18;
// }

// const answer = numbers.filter(voting);

// console.log(answer)

// TOPIC 2 - MAP

// const title = ['mr','mrs','mr','mr','mr'];

// function convert(t){
//     if(t == 'mr')
//         return 'M'
//     else if(t == 'mrs')
//         return 'F'
// }

// const answer = title.map(convert)
// console.log(answer)

// TOPIC 3 - HANDLING PROMISES

// fetch('https://jsonplaceholder.typicode.com/todos/1')
// .then(response => {
//     return response.json();
// })
// .then(data => {
//     console.log(data);
// })
// .catch(error => {
//     console.log(error)
// })

// TOPIC 4 - CREATE PROMISES

// const weekend = new Promise((res, rej) => {
//   try {
//     const date = new Date()
//     const day = date.getDay()
//     if (day == 0 || day == 6) res('Weekend')
//     else res('Weekday')
//   } catch (err) {
//     rej("Error")
//   }
// })

// weekend
// .then(data => console.log(data))

// TOPIC 5 - HOISTING

console.log(age);

var age = 40;



