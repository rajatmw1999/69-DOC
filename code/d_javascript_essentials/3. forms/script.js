function handleSubmit(){
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    console.log(name, phone);
    if(phone.length == 10)
        console.log("User submitted the form");
    else
        console.log("Please enter a phone number with 10 digits");
}