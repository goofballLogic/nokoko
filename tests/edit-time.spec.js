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

        describe("Then an entry table for the latest unpopulated week loads", () => {

            test("identifying the week", async ({ page }) => await expect(page.locator("article.edit-main h3")).toContainText("July 31, 2022"));

            test("with a column heading for each day of the week", async ({ page }) => {

                const headings = await page.locator(`article.edit-main`).evaluate(h => Array.from(h.querySelectorAll("th")).map(d => d.textContent.trim()));
                expect(headings).toEqual(["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", ""]);

            });

            test("with a row per recent project", async ({ page }) => {

                await expect(page.locator(`article.edit-main tr[data-projectid="31234567"]`)).toBeVisible();
                await expect(page.locator(`article.edit-main tr[data-projectid="31234568"]`)).toBeVisible();
                await expect(page.locator(`article.edit-main tr[data-projectid="31234569"]`)).toBeVisible();
                await expect(page.locator(`article.edit-main tr[data-projectid="31234570"]`)).not.toBeVisible();
                await expect(page.locator(`article.edit-main tr[data-projectid="31234571"]`)).not.toBeVisible();

            });

            test("with a not-yet-populated row", async ({ page }) => await expect(page.locator(`article.edit-main tr.new`)).toBeVisible());

            test("with each dropdown containing the available projects", async ({ page }) => {

                const options = await page
                    .locator(`article.edit-main tr[data-projectid="31234567"] select`)
                    .evaluate(select => Array.from(select.querySelectorAll("option")).map(o => [o.getAttribute("value") || "", o.textContent.trim()]));
                expect(options).toEqual([
                    ["", ""],
                    ["31234567", "Project A"],
                    ["31234568", "Project B"],
                    ["31234569", "Project C"],
                    ["31234570", "Project D"],
                    ["31234571", "Project E"],
                ]);

            });

            test("with the correct project selected in each project drop-down", async ({ page }) => {

                await expect(page.locator(`article.edit-main tr[data-projectid="31234567"] select`)).toHaveValue("31234567");

            });

            test("with the null project should be selected in the drop down for the new row", async ({ page }) => {

                await expect(page.locator(`article.edit-main tr.new select`)).toHaveValue("");

            });

        });


    })

});
