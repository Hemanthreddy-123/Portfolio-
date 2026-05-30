import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest"
    });

    const result = await model.generateContent("Hello");
    console.log("Gemini API Test Success:", result.response.text());
  } catch (error) {
    console.error("Gemini API Test Failed:", error);
  }
}

testGemini();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
