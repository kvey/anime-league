import puppeteer from "puppeteer";
import * as fs from "fs";

export const scrape = () => {
  return false;
};

export const scrapeListings = async () => {
  let browser = null;
  let page = null;
  try {
    // open the headless browser
    browser = await puppeteer.launch({ headless: true });
    // open a new page
    page = await browser.newPage();
    for (let i = 0; i < 15000; i++) {
      console.log(`https://www.anikore.jp/anime/${i}/`);
      await page.goto(`https://www.anikore.jp/anime/${i}/`);
      try {
        await page.waitForSelector("div.l-header_searchBox", {timeout: 10000});
      } catch (e) {
        console.log("Took too long to load the page, maybe we're being rate limited");
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      const maybe404 = await page.$("div.error404");
      if (maybe404 !== null) {
        console.log("404 for record");
        fs.appendFile("animenames.json", JSON.stringify({[i]: null})+"\n", function (err) {
          if (err) throw err;
        });
        continue;
      }
      const name = await page.evaluate(async () => {
        const el = document.querySelectorAll("section.l-animeDetailHeader > div.l-wrapper > h1")[0];
        return el.textContent.trim();
      });
      console.log(name);
      fs.appendFile("ak-animenames.json", JSON.stringify({[i]: name})+"\n", function (err) {
        if (err) throw err;
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await browser.close();
    // Writing the news inside a json file
  } catch (err) {
    // Catch and display errors
    await page.screenshot({path: "./errorshot.png"});
    await browser.close();
    console.log("Failed...", err);
  }
};
