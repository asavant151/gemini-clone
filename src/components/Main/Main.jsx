import React from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import hljs from "highlight.js";

const Main = () => {
  const [theme, setTheme] = React.useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const toolsRef = React.useRef(null);
  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    attachedImages,
    setAttachedImages,
  } = React.useContext(Context);
  const { user, isSignedIn } = useUser();

  const recognitionRef = React.useRef(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const didSendRef = React.useRef(false);
  const transcriptRef = React.useRef("");
  const userStoppedRef = React.useRef(false);

  const stopRecognition = React.useCallback(() => {
    try {
      const rec = recognitionRef.current;
      if (rec) rec.stop();
      if (rec) {
        userStoppedRef.current = true;
        rec.stop();
      }
    } catch {}
    setIsRecording(false);
  }, []);

  const startRecognition = React.useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    didSendRef.current = false;
    rec.lang = "en-US";
   rec.interimResults = true;
   rec.continuous = false;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true; // keep listening until user stops
    transcriptRef.current = "";
    userStoppedRef.current = false;

    let finalTranscript = "";

    rec.onstart = () => setIsRecording(true);
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }
      // Show interim in the input while speaking
     if (interim) setInput((prev) => (finalTranscript ? finalTranscript + " " + interim : interim));
      transcriptRef.current = finalTranscript;
      // Show final+interim in input while speaking
      const display = (finalTranscript + (interim ? " " + interim : "")).trim();
      if (display) setInput(display);
    };
    rec.onerror = () => {
      setIsRecording(false);
    };
    rec.onend = () => {
      setIsRecording(false);
      // Commit final transcript and auto-send
      if (finalTranscript.trim()) {
        setInput(finalTranscript.trim());
        if (!didSendRef.current) {
         didSendRef.current = true;
          setTimeout(() => onSent(), 0);
        }
      }
      // Only send when user explicitly stopped via mic
      if (userStoppedRef.current) {
        userStoppedRef.current = false;
        const text = (transcriptRef.current || finalTranscript).trim();
        if (text && !didSendRef.current) {
          didSendRef.current = true;
          setInput(text);
          setTimeout(() => onSent(), 0);
        }
      }
    };

    try {
      rec.start();
    } catch {}
  }, [onSent, setInput]);

  const onMicClick = () => {
    if (isRecording) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };
  React.useEffect(() => () => stopRecognition(), [stopRecognition]);

  // Apply theme to <body> and load hljs theme CSS
  React.useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    (async () => {
      try {
        if (theme === "dark") {
          await import("highlight.js/styles/github-dark.css");
        } else {
          await import("highlight.js/styles/github.css");
        }
      } catch {}
    })();
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Image attach logic (multiple)
  const onPickFile = () => fileInputRef.current?.click();
  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const items = [];
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const [header, base64] = String(dataUrl).split(",");
        const mimeMatch = header.match(/data:(.*?);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : file.type;
        items.push({
          base64,
          mimeType,
          name: file.name,
          url: URL.createObjectURL(file),
        });
      } catch {}
    }
    if (items.length) {
      setAttachedImages((prev) => [...prev, ...items]);
    }
    setToolsOpen(false);
    // reset input so same files can be reselected
    e.target.value = "";
  };
  const removeImage = (index) => {
    const item = attachedImages[index];
    if (item?.url) URL.revokeObjectURL(item.url);
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Close tools dropdown when clicking outside
  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!toolsRef.current) return;
      if (!toolsRef.current.contains(e.target)) setToolsOpen(false);
    };
    if (toolsOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [toolsOpen]);

  React.useEffect(() => {
    // highlight code
    document.querySelectorAll(".markdown-body pre code").forEach((el) => {
      try {
        hljs.highlightElement(el);
      } catch {}
    });
    // add copy buttons
    document.querySelectorAll(".markdown-body pre").forEach((pre) => {
      if (pre.dataset.copyBtnAdded === "true") return;
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.type = "button";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code");
        const text = code ? code.innerText : "";
        try {
          await navigator.clipboard.writeText(text);
          const old = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = old), 1200);
        } catch {}
      });
      pre.style.position = pre.style.position || "relative";
      pre.appendChild(btn);
      pre.dataset.copyBtnAdded = "true";
    });
  }, [resultData]);
  return (
    <div className="main">
      <div className="nav">
        <p>Gemini</p>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "🌞" : "🌙"}
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <img
                src={assets.user_icon}
                alt="Sign in"
                style={{ cursor: "pointer" }}
              />
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
      <div className="main-container">
        {!showResult ? (
          <>
            <div className="greet">
              <p>
                <span>
                  {isSignedIn
                    ? `Hello ${user?.firstName || user?.username || "Dev"},`
                    : "Hello Dev,"}
                </span>
              </p>
              <p>How can I help you today?</p>
            </div>
            <div className="cards">
              <div className="card">
                <p>Suggest beautiful places to visit in the world</p>
                <img src={assets.compass_icon} alt="" />
              </div>
              <div className="card">
                <p>Briefly summarize this concept: urban planning</p>
                <img src={assets.bulb_icon} alt="" />
              </div>
              <div className="card">
                <p>Brainstorm team bonding activities for our work retreat</p>
                <img src={assets.message_icon} alt="" />
              </div>
              <div className="card">
                <p>Improve the readability of the following code</p>
                <img src={assets.code_icon} alt="" />
              </div>
            </div>
          </>
        ) : (
          <div className="result">
            <div className="result-title">
              <img
                src={isSignedIn ? user?.imageUrl : assets.user_icon}
                alt=""
              />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              <img src={assets.gemini_icon_2} alt="" />
              {loading ? (
                <div className="loader">
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : (
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: resultData }}
                ></div>
              )}
            </div>
          </div>
        )}

        <div className="main-bottom">
          <div className={`search-box ${isRecording ? "recording" : ""}`}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder="Enter a prompt here"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSent();
                }
              }}
            />
            <div className="search-actions">
              <div className="tools-wrapper" ref={toolsRef}>
                <img
                  src={assets.gallery_icon}
                  alt="tools"
                  onClick={() => setToolsOpen((v) => !v)}
                />
                {toolsOpen && (
                  <div className="tools-dropdown">
                    <button className="tool-item" onClick={onPickFile}>
                      Upload files
                    </button>
                    <button
                      className="tool-item"
                      onClick={() => {
                        setToolsOpen(false);
                        alert("Add from Drive not implemented in this demo");
                      }}
                    >
                      Add from Drive
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={onFileChange}
                />
              </div>
              {/* <img src={assets.mic_icon} alt="" /> */}
              <img
                 src={assets.mic_icon}
                 alt={isRecording ? "Stop recording" : "Start voice input"}
                 onClick={onMicClick}
                 role="button"
                 aria-pressed={isRecording}
               />
               {isRecording && (
                 <div className="voice-wave" aria-hidden="true">
                   <span></span>
                   <span></span>
                   <span></span>
                   <span></span>
                   <span></span>
                 </div>
               )}
              {input || (attachedImages && attachedImages.length > 0) ? (
                <img src={assets.send_icon} alt="" onClick={() => onSent()} />
              ) : null}
            </div>
          </div>
          {attachedImages && attachedImages.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0, margin: "10px 0" }}>
              {attachedImages.map((img, idx) => (
                <div className="image-chip" key={idx}>
                  <img src={img.url} alt={img.name} />
                  {/* <span className="image-name" title={img.name}>
                    {img.name}
                  </span> */}
                  <button
                    className="image-remove"
                    onClick={() => removeImage(idx)}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="bottom-info">
            Gemini can help you with a wide range of tasks, from answering
            questions and providing information to generating creative content
            and assisting with programming tasks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;