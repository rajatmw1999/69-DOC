// console.log('Promises in JS')

// fetch('https://akabab.github.io/superhero-api/api/all.json')
//   .then(response => {
//     return response.json()
//   })
//   .then(data => {
//     console.log(data)
//   })
//   .catch(err => {
//     console.log('sorry some error occured')
//     console.log(err)
//   })

// async/await

async function wait () {
  console.log(1)
  myPromise()
  .then(res => {
      console.log(res);
  })
  .catch(err => {
      console.log(err)
  })
//   console.log(res)
  console.log(2)
}

// const delay = async () => {
//   setTimeout(() => {
//     console.log('2 seconds are done')
//   }, 2000)
// }

const myPromise = () => {
  return new Promise((resolve, reject) => {
    if (-1 > 0) resolve('Good')
    reject('bad')
  })
}

wait()

// async function fetchData () {
//   var response = await fetch(
//     'https://akabab.github.io/superhero-api/api/all.json'
//   )
//   response = await response.json()
//   console.log(response)
// }

// fetchData()
