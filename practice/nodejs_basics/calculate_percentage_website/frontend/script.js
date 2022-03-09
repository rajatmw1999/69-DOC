// fetch('http://localhost:6969')
//     .then(response => response.json())
//     .then(data => console.log(data.message));

fetch('https://akabab.github.io/superhero-api/api/id/1.json')
    .then(response => response.json())
    .then(data => console.log(data.name))