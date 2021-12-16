// const ages = [24,23,43,14,55,2];

// const result = ages.filter(filterAges);

// console.log(result);

// function filterAges(age){
//     return age<=18;
// }

const names = ['Mohil', 'Mohit', 'Mohan', 'Rohit']

const result = names.filter(filterName)
console.log(result);


function filterName (name) {
  return name.includes('l')
}
