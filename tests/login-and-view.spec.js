const { test, test: { describe, beforeEach }, expect } = require('@playwright/test');
const { installFakeNoko, VALID_TOKEN } = require('./fake-noko.js');

describe("Background", () => {

  beforeEach(async ({ context }) => {

    await installFakeNoko(context);

  });

  describe("Given I open the app", () => {

    beforeEach(async ({ page }) => {

      page.on("pageerror", console.error.bind(console));
      await page.goto("http://localhost:8080");

    });

    test("Then it shows that I am not authenticated", async ({ page }) => {

      await expect(page.locator("aside.auth")).toContainText("Not authenticated");
      await expect(page.locator("body")).not.toHaveClass("authenticated");

    });

    describe("When I enter an API token", () => {

      beforeEach(async ({ page }) => {

        await page.locator("aside.auth").locator("text=Access token").fill(VALID_TOKEN);

      });

      test("Then it shows that I am authenticated", async ({ page }) => {

        await expect(page.locator("body")).toHaveClass("authenticated");
        await expect(page.locator("aside.auth")).toContainText("Authenticated");

      });

      test("Then it lists summaries of previous week's entries", async ({ page }) => {

        await expect(page.locator(".entry-groups li:first-of-type summary")).toContainText("July 24, 2022");
        await expect(page.locator(".entry-groups li:first-of-type summary")).toContainText("38 hours");
        await expect(page.locator(".entry-groups li:last-of-type summary")).toContainText("May 15, 2022");
        await expect(page.locator(".entry-groups li:last-of-type summary")).toContainText("32 hours");

      });

      describe("and I refresh the browser window", () => {

        beforeEach(async ({ page }) => {

          await page.reload();

        });

        test("Then it shows that I am still authenticated", async ({ page }) => {

          await expect(page.locator("body")).toHaveClass("authenticated");
          await expect(page.locator("aside.auth")).toContainText("Authenticated");

        });

      });

      describe("but I cancel the token", () => {

        beforeEach(async ({ page }) => {

          await page.locator(`aside.auth button:has-text("Cancel")`).click();

        });

        test("Then it shows that I am unauthenticated again", async ({ page }) => {

          await expect(page.locator("aside.auth")).toContainText("Not authenticated");
          await expect(page.locator("body")).not.toHaveClass("authenticated");

        });

        test("Then the list of summaries is removed", async ({ page }) => {

          await expect(page.locator(".entry-groups li")).not.toBeVisible();

        });

        describe("and I refresh the browser window", () => {

          beforeEach(async ({ page }) => {

            await page.reload();

          });

          test("Then it shows that I am NOT authenticated", async ({ page }) => {

            await expect(page.locator("body")).not.toHaveClass("authenticated");
            await expect(page.locator("aside.auth")).not.toContainText("Authenticated");

          });

        });

      });

    });

  });

});

