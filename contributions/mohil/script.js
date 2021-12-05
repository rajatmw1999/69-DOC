/*const mark = [23,44,34,5,24,63,84,99,91,63,43,23,7,8,9,78,99,11,100,94]

const result = mark.filter(fMark)
console.log(result)

function fMark (mark){
    return mark > 90
} 

const classes = [12,21,433,2,3,4,5,23,23,23,322,12,3,1,2,3,4,5,2,3,34,23,32,24,32,3,324,2,32,34]

const result = classes.filter(fClasses)
console.log(result)

function fClasses (classes){
    return classes > 10
} 

const classes = ['davudja','dhdhii','fssrf','davdhahf','fdadavidbhis','ddjhjd']

const result = classes.filter(fClasses)
console.log(result)

function fClasses (classes){
    return classes.includes('dav')
} */

const gender = ['M','F','M','M','F','M','F','F','F','M']

const result = gender.map(fullGen)
console.log(result)

function fullGen (gen) {
  if (gen == 'M')
  return 'Male';
  else if (gen == 'F')
  return 'Female';
}