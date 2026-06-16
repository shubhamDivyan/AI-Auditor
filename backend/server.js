import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import pdf from "pdf-parse-fork";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!fs.existsSync("./screenshots")) {
  fs.mkdirSync("./screenshots");
}

app.post("/api/verify", async (req, res) => {
  try {
    console.log("start Pipeline");

    if (!fs.existsSync("./guide.pdf")) {
      throw new Error("guide.pdf file find error");
    }

    const pdfBuffer = fs.readFileSync("./guide.pdf");
    const pdfData = await pdf(pdfBuffer);
    const extractedGuidelines = pdfData.text;

    console.log("pdf text code");

    console.log("open Puppeteer browser");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.setDefaultNavigationTimeout(60000);

    const targetUrl = "https://white-cliff-0bca3ed00.1.azurestaticapps.net/";
    console.log(`Website par ja rahe hain: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("checking login field");

    const loginFieldsExist = await page.evaluate(() => {
      const email = document.querySelector(
        'input[type="email"], input[name="email"], input[placeholder*="Email" i]',
      );
      const password = document.querySelector(
        'input[type="password"], input[name="password"]',
      );
      return !!(email && password);
    });

    if (loginFieldsExist) {
      console.log("Login fields here using Credentials");

      const emailSelector = await page.evaluate(() => {
        if (document.querySelector('input[type="email"]'))
          return 'input[type="email"]';
        if (document.querySelector('input[placeholder*="Email" i]'))
          return 'input[placeholder*="Email" i]';
        return 'input[name="email"]';
      });
      await page.type(emailSelector, "admin@gmail.com");

      const passwordSelector = await page.evaluate(() => {
        if (document.querySelector('input[type="password"]'))
          return 'input[type="password"]';
        return 'input[name="password"]';
      });
      await page.type(passwordSelector, "password");

      const loginButtonSelector =
        'button[type="submit"], input[type="submit"], button';
      console.log("Login button click kar rahe hain...");

      await Promise.all([
        page.click(loginButtonSelector),
        page
          .waitForNavigation({ waitUntil: "load", timeout: 30000 })
          .catch((e) =>
            console.log(
              "Navigation post-login timed out, checking page status...",
            ),
          ),
      ]);
    } else {
      console.log("direct login page");
    }

    console.log("Final UI render on UI please wait...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const screenshotPath = `./screenshots/live_workspace.jpg`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: "jpeg",
      quality: 60,
    });

    const liveUIData = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll(
          "h1, h2, h3, h4, h5, button, nav, label, input, table, th, td",
        ),
      );
      return elements
        .map((el) => ({
          tagName: el.tagName,
          text: el.innerText
            ? el.innerText.trim()
            : el.value
              ? el.value.trim()
              : "",
          visible: el.getBoundingClientRect().height > 0,
        }))
        .filter((item) => item.text.length > 2 && item.text.length < 200);
    });

    await browser.close();
    console.log("Step 2 Done: Live UI aur Screenshot ready hai.");

    console.log("Step 3: Gemini AI Agent ko kaam par laga diya...");

    const screenshotBase64 = fs.readFileSync(screenshotPath).toString("base64");

    const prompt = `
You are an Expert QA Automation & Compliance AI Agent. 
Thoroughly compare Expected Guidelines (from PDF) against Actual Live UI and the screenshot.

Expected Guidelines (from PDF):
"""
${extractedGuidelines.substring(0, 8000)}
"""

Actual Live UI Components (DOM Extract):
"""
${JSON.stringify(liveUIData, null, 2)}
"""

Return your entire response in raw, valid JSON format matching this exact structure:
{
  "summary": { "totalMismatches": 0, "status": "FAIL/PASS" },
  "mismatches": [
    {
      "type": "Visual | Functional | Content | Compliance",
      "severity": "High | Medium | Low",
      "guidelineCitation": "Quote the exact phrase, rule, or section from the PDF that is being violated",
      "liveObserved": "What is actually rendering on the live application",
      "description": "Clear explanation of why this fails compliance"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: { mimeType: "image/jpeg", data: screenshotBase64 },
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const reportJSON = JSON.parse(response.text);
    console.log("Step 3 Done: Comparison.");

    res.json({
      success: true,
      screenshotUrl: `data:image/jpeg;base64,${screenshotBase64}`,
      report: reportJSON,
    });
  } catch (error) {
    console.error("Pipeline Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is Running on  ${PORT} `));
