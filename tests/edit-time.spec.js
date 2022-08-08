const { test, test: { describe, beforeEach }, expect } = require('@playwright/test');
const { installFakeNoko, VALID_TOKEN } = require('./fake-noko.js');

describe("Background", () => {

    beforeEach(async ({ context, page }) => {

        await installFakeNoko(context);
        page.on("pageerror", console.error.bind(console));

    });

    describe("When entries have loaded", () => {

        beforeEach(async ({ page }) => {

            await page.goto("http://localhost:8080");
            await page.locator("aside.auth").locator("text=Access token").fill(VALID_TOKEN);

        });

        test("Then an entry table for the latest unpopulated week loads", async ({ page }) => {

            await page.screenshot({ path: "screenshot.png" });
            await expect(page.locator("h3")).toContainText("July 31, 2022");
            /*
                The entry table should contain a row per project found over the last 3 weeks of entries
            */
            /*
            await expect(page.locator("section[data-project=31234567]")).toBeVisible();
            await expect(page.locator("section[data-project=31234568]")).toBeVisible();
            await expect(page.locator("section[data-project=31234569]")).toBeVisible();
            await expect(page.locator("section[data-project=31234570]")).not.toBeVisible();
            await expect(page.locator("section[data-project=31234571]")).not.toBeVisible();
            */
        });

    })

});
