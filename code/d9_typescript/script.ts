let a: number = 0
let b: string = 'halo'
let c: Array<string | number> = ['Halo', 'Ola', 'Namaste', 4]

let d: { name: String; age: number } = { name: 'Mohil', age: 23 }

interface Person {
  name: String
  age: number
}
let e:Person = {name:'Rajat',age:22}
console.log(a,b,c,d,e)

let f:Function;

f = () => {
    console.log("I am a function");
}

f();