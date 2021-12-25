let i: number = 0;
let x: string = "hi";
let list: Array <string | number> = ["food", "water", "clothing", 12, 13]

console.log(list)

interface Man{
    name: string
    age: number
}

let me: Man = {name:"mohil", age:15}

console.log(me)

let f: Function

f = () => {
    console.log("function")
}

f();