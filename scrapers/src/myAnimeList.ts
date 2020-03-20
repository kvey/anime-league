import puppeteer from "puppeteer";
import * as fs from "fs";
import { Client as PGClient } from "pg";
import pgFormat from "pg-format";

interface AnimeListing {
  season: string,
  year: number,
  linkId: string,
  name: string,
  viewerCount: number,
  score: number,
}

const serializePgAnimeListing = (listing: AnimeListing) => {
  return [
    listing.season,
    listing.year,
    listing.linkId,
    listing.name,
    listing.viewerCount,
    listing.score
  ]
}

export const scrape = async () => {
  let browser = null;
  let page = null;
  try {
    // open the headless browser
    browser = await puppeteer.launch({ headless: true });
    // open a new page
    page = await browser.newPage();
    for (let i = 0; i < 1000; i++) {
      console.log(`https://myanimelist.net/topanime.php?limit=${i*50}`);
      await page.goto(`https://myanimelist.net/topanime.php?limit=${i*50}`);
      try {
      await page.waitForSelector("a.link-mal-logo", {timeout: 10000});
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
      const listings = await page.evaluate(async () => {
        const results = [];
        const tableRows = document.querySelectorAll("table.top-ranking-table tr.ranking-list");
        for (const tableRow of tableRows) {
          const titleHref = tableRow.querySelector("div.detail > div.di-ib > a.hoverinfo_trigger");
          results.push({
            name: titleHref.textContent.trim(),
            href: titleHref.getAttribute("href")
          });
        }
        return results;
      });
      console.log(listings.length);
      fs.appendFile("mal-animenames.json", JSON.stringify(listings)+"\n", function (err) {
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



export const scrapeIndividual = async () => {
  let browser = null;
  const malId = "32281";
  try {
    // open the headless browser
    browser = await puppeteer.launch({ headless: true });
    // open a new page
    const page = await browser.newPage();
    // enter url in page
    await page.goto(`https://myanimelist.net/anime/${malId}`);
    await page.waitForSelector("a.link-mal-logo");
    console.log("Opened page successfully");

    const results = await page.evaluate(async () => {
      const name = document.querySelectorAll("span[itemprop='name']")[0];
      const viewerCount = document.querySelector("span.numbers.members > strong");

      const infoBar = document.querySelector(".js-sns-icon-container").parentNode;
      const info: any = {"alternativeTitles": {}, "information": {}, "statistics": {}};
      let currentSection = null;
      for (const child of infoBar.children) {
        const nodeText = child.textContent.trim();
        if (nodeText == "Alternative Titles") {
          currentSection = "alternativeTitles";
          continue;
        }

        if (nodeText == "Information") {
          currentSection = "information";
          continue;
        }

        if (nodeText == "Statistics") {
          currentSection = "statistics";
          continue;
        }

        if (currentSection !== null) {
          const label = child.querySelector(".dark_text");
          if (label) {
            const labelOriginal = label.textContent.trim();
            const labelText = labelOriginal.replace(":", "").toLowerCase();
            info[currentSection][labelText] = child.textContent.replace(labelOriginal, "").trim();
          }
        }
      }

      return {
        name: name.textContent.trim(),
        viewerCount: viewerCount.textContent.trim(),
        info
      };
    });
    await browser.close();
    // Writing the news inside a json file
    fs.writeFile("mal-rankings.json", JSON.stringify(results), function(err) {
      if (err) throw err;
      console.log("Saved!");
    });
  } catch (err) {
    // Catch and display errors
    await browser.close();
    console.log("Failed...", err);
  }
};


const SEASONS = [
  "winter",
  "spring",
  "summer",
  "fall",
];

export const scrapeSeason = async () => {
  const client = new PGClient()
  await client.connect()
  const currentYear = new Date().getFullYear();
  let browser = null;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    for (let seasonIdx = 0; seasonIdx <= 3; seasonIdx++) {
      await page.goto(`https://myanimelist.net/anime/season/${currentYear}/${SEASONS[seasonIdx]}`);
      await page.waitForSelector("a.link-mal-logo");

      const maybe404 = await page.$("div.error404");
      if (maybe404 !== null) {
        console.log("404 for record");
        continue;
      }

      const seasonsAnime: AnimeListing[] = await page.evaluate(async () => {
        const animeInfo = [];
        const animeListings = document.querySelectorAll("div.seasonal-anime")

        for (const animeListing of animeListings) {
          const nameEl = animeListing.querySelector("div.title-text a.link-title");
          const viewerCountEl = animeListing.querySelector("div.scormem span.member")
          const scoreEl = animeListing.querySelector("div.scormem span.score")

          animeInfo.push({
            season: SEASONS[seasonIdx],
            year: currentYear,
            linkId: nameEl.getAttribute("href"),
            name: nameEl.textContent.trim(),
            viewerCount: parseInt(viewerCountEl.textContent.trim()),
            score: parseFloat(scoreEl.textContent.trim()),
          });
        }
        return animeInfo;
      });
      const queryResult = await client.query(pgFormat(`
        INSERT INTO anime_scores (
          season,
          year,
          link_id,
          name,
          viewer_count,
          score)
        VALUES %L
      `, seasonsAnime.map(serializePgAnimeListing)))
    }
    await client.end()
    await browser.close();
  } catch (err) {
    // Catch and display errors
    await browser.close();
    console.log("Failed...", err);
  }
};

