// Filters in javascript

const ages = [23, 45, 2, 45, 7, 10, 33]

const result = ages.filter(filterElectionEligibility)

console.log(result)

function filterElectionEligibility (age) {
  return age >= 18
}

//Maps in javascript

const sqr = [2, 3, 4, 5, 6, 7]

const result = sqr.map(FindSqaure)
console.log(result)

function FindSqaure (no) {
  return no * no
}

// const gender = ['m','f','m','m']