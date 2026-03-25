import fs from "fs";

const envStr = fs.readFileSync(".env", "utf8");
const lines = envStr.split("\n");
const keyLine = lines.find(l => l.includes("GEMINI_API_KEY="));
const key = keyLine ? keyLine.split("=")[1].replace(/["'\r]/g, "").trim() : null;

if (!key) {
  console.log("Still no key found.");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
fetch(url)
  .then(r => r.json())
  .then(d => {
    if (d.error) {
       console.log("API Error:", d.error.message);
    } else {
       const names = d.models.map(m => m.name);
       console.log("Available Models:", names);
    }
  })
  .catch(console.error);
