import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
try {
  for (const [name, id] of [
    ["floral", "photo-1609663642184-513594444403"],
    ["celebration", "photo-1535141192574-5d4897c12636"],
  ]) {
    const response = await page.goto(
      `https://images.unsplash.com/${id}?fm=jpg&fit=crop&w=1000&q=82`,
    );
    if (!response.ok()) throw new Error(`${name}: ${response.status()}`);
    await writeFile(`public/images/${name}.jpg`, await response.body());
    console.log(`Saved ${name}`);
  }
} finally {
  await browser.close();
}
