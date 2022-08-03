const { test, test: { describe, beforeEach }, expect } = require('@playwright/test');
const { installFakeNoko } = require('./fake-noko.js');

describe("Given a fake Noko API", () => {

  beforeEach(async ({ context }) => {

    await installFakeNoko(context);

  });

  describe("When I open the app", () => {

    beforeEach(async ({ page }) => {

      page.on("console", console.log.bind(console));
      page.on("pageerror", console.error.bind(console));
      await page.goto("http://localhost:8080");

    });

    test("Then it shows that I am not authenticated", async ({ page }) => {

      await expect(page.locator("aside.auth")).toContainText("Not authenticated");
      await expect(page.locator("body")).not.toHaveClass("authenticated");

    });

    describe("and I enter an API token", () => {

      beforeEach(async ({ page }) => {

        await page.locator("aside.auth").locator("text=Access token").fill(process.env["NOKO_PAT"]);

      });

      test("Then it shows that I am authenticated", async ({ page }) => {

        await expect(page.locator("body")).toHaveClass("authenticated");
        await expect(page.locator("aside.auth")).toContainText("Authenticated");

      });

    });

  });

});

