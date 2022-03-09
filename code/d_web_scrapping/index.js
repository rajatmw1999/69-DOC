const puppeteer = require('puppeteer');
const fs = require("fs/promises")

async function start(){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://learnwebcode.github.io/practice-requests/");
    await page.goto("https://www.instagram.com/vijayragav0/");
    // await page.screenshot({path:"ss2.png"});
    
    // const names = await page.evaluate(() => {
    //     return Array.from(document.querySelectorAll(".info strong")).map(x => x.textContent)
    // });

    const instaBio = await page.evaluate(() => {
        return document.querySelector("#react-root > section > main > div > header > section > div.QGPIr > div").textContent
    });

    await fs.writeFile("bio.txt", instaBio);

    await browser.close();
}

start();