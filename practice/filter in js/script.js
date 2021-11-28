// const age = [34, 2, 45, 17, 56]

// const finalResult = age.filter(filterAge)

// function filterAge (age) {
//   return age < 18
// }

// console.log(finalResult)

const names = ['Rajat', 'Smridhi', 'James', 'Doctor Swann', 'Doctor Strange']

const filterResult = names.filter(filterNames)

function filterNames (name) {
  //   return name.includes('tor')
  return name.startsWith('Sm')
}
console.log(filterResult)

// TASK FOR SMRIDHI

// 1. CREATE A FUNCTION IN JAVASCRIPT THAT FILTERS OUT THOSE MARKS WHICH ARE GREATER THAN 90 IN A MARKS ARRAY 

// 2. CREATE ANOTHER FUNCTION THAT FILTERS OUT CLASSES THAT ARE MORE THAN 10

// 3. CREATE ANOTHER FUNCTION THAT FILTERS OUT SCHOOL NAMES THAT START WITH 'DAV' FROM AN ARRAY OF SCHOOL NAMES