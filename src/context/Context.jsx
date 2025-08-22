import { createContext, useEffect, useState } from "react";
import main from "../config/gemini";
import { marked } from "marked";

export const Context = createContext();

export const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompt, setPrevPrompt] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [attachedImages, setAttachedImages] = useState([]); // [{ base64, mimeType, name, url }]

  // Load saved history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("prevPrompt");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPrevPrompt(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist history on change
  useEffect(() => {
    try {
      localStorage.setItem("prevPrompt", JSON.stringify(prevPrompt));
    } catch {}
  }, [prevPrompt]);

  // Update document title with the current prompt
  useEffect(() => {
    if (recentPrompt) {
      document.title = `${recentPrompt} - Gemini`;
    } else {
      document.title = "Gemini";
    }
  }, [recentPrompt]);

  const delayPara = (response) => {
    let words = response.split(" ");
    let index = 0;
    let intervalId = setInterval(() => {
      if (index >= words.length) {
        clearInterval(intervalId);
      } else {
        let nextWord = words[index];
        index++;
        setResultData((prev) => prev + nextWord + " ");
      }
    }, 75);
  };

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
  };

  const onSent = async (prompt) => {
    setResultData("");
    setLoading(true);
    setShowResult(true);
    let response;
    if (prompt !== undefined) {
      response = await main(prompt, attachedImages);
      setRecentPrompt(prompt);
    } else {
      setPrevPrompt((prev) => [...prev, input]);
      setRecentPrompt(input);
      response = await main(input, attachedImages);
    }

    // Convert markdown -> HTML using marked for proper code block rendering
    marked.setOptions({ breaks: true });
    const html = marked.parse(response || "");

    delayPara(html);
    setLoading(false);
    setInput("");
    setAttachedImages([]);
  };

  const contextValue = {
    prevPrompt,
    setPrevPrompt,
    onSent,
    recentPrompt,
    setRecentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    newChat,
    attachedImages,
    setAttachedImages,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;