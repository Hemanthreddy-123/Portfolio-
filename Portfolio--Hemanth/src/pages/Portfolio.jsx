import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { PortfolioContext } from "../context/PortfolioContext";

// Set PDF.js worker using standard CDN URL matching the installed package version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs`;

// Framer Motion Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

function Typewriter({ words, speed = 100, delay = 2000 }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;
    let timer;
    const activeWord = words[currentWordIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
      }, speed / 2);
    } else {
      timer = setTimeout(() => {
        setCurrentText((prev) => activeWord.slice(0, prev.length + 1));
      }, speed);
    }

    if (!isDeleting && currentText === activeWord) {
      timer = setTimeout(() => setIsDeleting(true), delay);
    } else if (isDeleting && currentText === "") {
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, speed, delay]);

  return (
    <span className="typewriter-text">
      {currentText}
      <span className="typewriter-cursor">|</span>
    </span>
  );
}

function Counter({ endValue, label, icon, isFloat = false }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const duration = 1500;
    const stepTime = 30;
    const steps = Math.floor(duration / stepTime);
    const increment = endValue / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= endValue) {
        setCount(endValue);
        clearInterval(timer);
      } else {
        setCount(isFloat ? parseFloat(start.toFixed(2)) : Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [started, endValue, isFloat]);

  return (
    <motion.div
      className="glass-card stat-item"
      whileInView={() => setStarted(true)}
      viewport={{ once: true }}
    >
      <div className="stat-icon">
        <i className={icon}></i>
      </div>
      <h3 className="stat-number">
        {started ? (isFloat ? count.toFixed(2) : count) : "0"}
        {label.includes("+") && "+"}
      </h3>
      <p className="stat-label">{label.replace("+", "")}</p>
    </motion.div>
  );
}

export default function Portfolio() {
  const { portfolio, projects, skills, certificates, internships, education } = useContext(PortfolioContext);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Advanced Features State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [skillSearch, setSkillSearch] = useState("");
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [skillView, setSkillView] = useState("badges"); // "badges" or "proficiency"

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === "light" ? "dark" : "light";
      addToast(`Switched to ${nextTheme === "light" ? "Light" : "Dark"} Mode!`, "info");
      return nextTheme;
    });
  };

  // Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // AI Chat Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: `Hello! I am Hemanth's AI Assistant. How can I help you today? You can ask me about his projects, skills, education, or work history!`
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setIsChatLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY in your .env file.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction: portfolio.systemPrompt
      });

      const apiHistory = chatMessages
        .filter((msg, index) => !(index === 0 && msg.sender === "ai"))
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

      const chatSession = model.startChat({
        history: apiHistory
      });

      const responseResult = await chatSession.sendMessage(userMsg);
      const aiResponseText = responseResult.response.text();

      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: aiResponseText }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: `Sorry, I encountered an error: ${error.message || "Failed to fetch response."}` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ATS Resume Reviewer State
  const [atsResumeText, setAtsResumeText] = useState("");
  const [atsResult, setAtsResult] = useState("");
  const [atsScore, setAtsScore] = useState(null);
  const [isAtsLoading, setIsAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState("");

  const handleAtsFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAtsError("");
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAtsResumeText(event.target.result);
        addToast("Text resume loaded successfully!", "info");
      };
      reader.readAsText(file);
    } else if (fileName.endsWith(".pdf")) {
      setIsAtsLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target.result;
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let extractedText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item) => item.str).join(" ");
              extractedText += pageText + "\n";
            }

            if (!extractedText.trim()) {
              throw new Error("The PDF appears to be empty or contains scanned images (OCR not supported client-side).");
            }

            setAtsResumeText(extractedText);
            addToast("PDF resume loaded and parsed successfully!", "info");
          } catch (err) {
            console.error("PDF Parsing error:", err);
            setAtsError(err.message || "Failed to parse PDF file.");
          } finally {
            setIsAtsLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setIsAtsLoading(false);
        setAtsError("Failed to read PDF file.");
      }
    } else if (fileName.endsWith(".docx")) {
      setIsAtsLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target.result;
            const result = await mammoth.extractRawText({ arrayBuffer });
            const extractedText = result.value;

            if (!extractedText.trim()) {
              throw new Error("The Word file appears to be empty.");
            }

            setAtsResumeText(extractedText);
            addToast("Word resume loaded and parsed successfully!", "info");
          } catch (err) {
            console.error("Word Parsing error:", err);
            setAtsError(err.message || "Failed to parse Word file.");
          } finally {
            setIsAtsLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setIsAtsLoading(false);
        setAtsError("Failed to read Word file.");
      }
    } else {
      setAtsError("Unsupported file type. Please upload a .txt, .pdf, or .docx file.");
    }
  };

  const handleAnalyzeResume = async () => {
    if (!atsResumeText.trim()) return;
    setIsAtsLoading(true);
    setAtsError("");
    setAtsResult("");
    setAtsScore(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("Gemini API key is not configured in environment variables.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const prompt = `You are a professional corporate Applicant Tracking System (ATS) parser and senior recruiter.
Analyze the following resume details and benchmark it against modern software engineer, data analyst, and web developer jobs.

First, output a score on a scale of 0 to 100 representing its overall ATS match and alignment with modern tech jobs. Make the FIRST line of your response look EXACTLY like this:
SCORE: [your computed score here, e.g. 78]

After that line, generate a detailed evaluation report. Structure your report by dividing sections with "###". Do not use markdown bold on the section headers, just write the headers. Here are the sections to include:

### Resume Summary & Job Match Profile
Provide a 2-3 sentence overview of this applicant's profile and target career alignment.

### Key Strengths & Achievements
Bullet points summarizing their most notable experience, tech stack components, and skills.

### Critical Weaknesses & Gaps
Analyze missing fields, vague bullet points, or sections requiring improvements.

### Missing & Recommended Keywords
Identify 5-8 hot tech keywords or tools they should add to optimize search query indexes.

### Formatting & Design Feedback
Evaluate readability, bullet styling, and structural elements.

### Strategic Recommendations
Actionable steps to elevate this resume's score and match rate.

Here is the extracted resume text:
---
${atsResumeText}
---`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const scoreRegex = /^SCORE:\s*(\d+)/i;
      const firstLine = responseText.split("\n")[0];
      const match = firstLine.match(scoreRegex);

      if (match) {
        setAtsScore(parseInt(match[1], 10));
        setAtsResult(responseText.replace(scoreRegex, "").trim());
      } else {
        setAtsScore(75); // Fallback default
        setAtsResult(responseText);
      }
      addToast("ATS Audit Report generated successfully!", "success");
    } catch (err) {
      console.error("ATS review error:", err);
      setAtsError(err.message || "Failed to generate report.");
      addToast("Error during ATS audit", "error");
    } finally {
      setIsAtsLoading(false);
    }
  };

  // Interview Prep State
  const [interviewTopic, setInterviewTopic] = useState("React.js");
  const [interviewLevel, setInterviewLevel] = useState("Intermediate");
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState("");

  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    setIsInterviewLoading(true);
    setInterviewError("");
    setInterviewQuestions([]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const prompt = `You are a Technical Interviewer. Generate exactly 10 interview questions about the topic "${interviewTopic}" at a difficulty level of "${interviewLevel}".

For each question, provide:
1. The question text.
2. The correct answer.
3. A short, detailed explanation.

You MUST respond ONLY with a valid JSON array of objects. Do not wrap the JSON in markdown formatting or anything else. Just the raw JSON string. Each object in the array must look exactly like this structure:
{
  "question": "What is ...?",
  "answer": "The correct answer is ...",
  "explanation": "Explanation here...",
  "difficulty": "${interviewLevel}"
}`;

      const result = await model.generateContent(prompt);
      let jsonText = result.response.text().trim();

      // Clean up markdown block wraps if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.substring(7);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      jsonText = jsonText.trim();

      const parsedQuestions = JSON.parse(jsonText);
      if (Array.isArray(parsedQuestions)) {
        setInterviewQuestions(parsedQuestions.map((q) => ({ ...q, isExpanded: false })));
        addToast("10 interview questions loaded!", "success");
      } else {
        throw new Error("Failed to parse questions array.");
      }
    } catch (err) {
      console.error("Interview questions error:", err);
      setInterviewError("Failed to generate questions. Please try again.");
      addToast("Failed to generate questions", "error");
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const toggleQuestionExpand = (index) => {
    setInterviewQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, isExpanded: !q.isExpanded } : q))
    );
  };

  // Scroll Actions
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Highlight active section
      const sections = ["hero", "about", "education", "projects", "ats-reviewer", "interview-prep", "internships", "certificates", "contact"];
      const scrollPos = window.scrollY + 200;

      for (const sect of sections) {
        const el = document.getElementById(sect);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sect);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setIsMenuOpen(false);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getSkillBadgeStyle = (skillName) => {
    if (!skillSearch) return {};
    const isMatched = skillName.toLowerCase().includes(skillSearch.toLowerCase());
    return isMatched
      ? {
          borderColor: "var(--accent-cyan)",
          boxShadow: "var(--glow-cyan)",
          background: "var(--glass-bg)",
          transform: "scale(1.08) translateY(-2px)",
          color: "var(--text-primary)"
        }
      : {
          opacity: 0.35,
          transform: "scale(0.95)"
        };
  };

  const renderSkillItem = (name, percent) => {
    if (skillView === "proficiency") {
      const isMatched = !skillSearch || name.toLowerCase().includes(skillSearch.toLowerCase());
      const barStyle = isMatched ? {} : { opacity: 0.35 };
      return (
        <div className="skill-progress-item" style={barStyle} key={name}>
          <div className="skill-progress-info">
            <span className="skill-progress-name">{name}</span>
            <span className="skill-progress-percent">{percent}%</span>
          </div>
          <div className="skill-progress-bar-bg">
            <motion.div
              className="skill-progress-bar-fill"
              initial={{ width: 0 }}
              whileInView={{ width: `${percent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      );
    } else {
      return (
        <span className="skill-badge" style={getSkillBadgeStyle(name)} key={name}>
          {name}
        </span>
      );
    }
  };

  // Group skills by category dynamically
  const skillCategories = [...new Set(skills.map((s) => s.category))];

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "languages": return "fa-solid fa-code";
      case "frontend": return "fa-solid fa-laptop-code";
      case "databases": return "fa-solid fa-database";
      case "core subjects":
      case "core cse": return "fa-solid fa-book";
      default: return "fa-solid fa-layer-group";
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setIsSubmitted(true);
    addToast("Message sent successfully!", "success");
    setFormData({ name: "", email: "", message: "" });
  };

  // Categories list for filtering projects
  const projectCategories = ["All", ...new Set(projects.map((p) => p.category))];
  const filteredProjects = selectedCategory === "All"
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Decorative Orbs */}
      <div className="bg-glow-wrapper">
        <div className="bg-glow-orb bg-glow-orb-1"></div>
        <div className="bg-glow-orb bg-glow-orb-2"></div>
      </div>

      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <a href="#hero" className="nav-logo" onClick={(e) => { e.preventDefault(); handleNavClick("hero"); }}>
            <span>{portfolio.fullName}</span>
          </a>

          {/* Navigation & Theme Switcher Actions */}
          <div className="nav-right">
            <ul className={`nav-menu ${isMenuOpen ? "open" : ""}`}>
              <li>
                <a
                  href="#about"
                  className={`nav-link ${activeSection === "about" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("about"); }}
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#education"
                  className={`nav-link ${activeSection === "education" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("education"); }}
                >
                  Education
                </a>
              </li>
              <li>
                <a
                  href="#projects"
                  className={`nav-link ${activeSection === "projects" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("projects"); }}
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="#ats-reviewer"
                  className={`nav-link ${activeSection === "ats-reviewer" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("ats-reviewer"); }}
                >
                  ATS Reviewer
                </a>
              </li>
              <li>
                <a
                  href="#interview-prep"
                  className={`nav-link ${activeSection === "interview-prep" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("interview-prep"); }}
                >
                  Interview Prep
                </a>
              </li>
              <li>
                <a
                  href="#internships"
                  className={`nav-link ${activeSection === "internships" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("internships"); }}
                >
                  Internships
                </a>
              </li>
              <li>
                <a
                  href="#certificates"
                  className={`nav-link ${activeSection === "certificates" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("certificates"); }}
                >
                  Certificates
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className={`nav-link ${activeSection === "contact" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick("contact"); }}
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="admin-nav-link"
                >
                  <i className="fa-solid fa-lock"></i> Admin Login
                </Link>
              </li>
            </ul>

            {/* Theme Toggle Button */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              <i className={`fas ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
            </button>

            {/* Toggle Hamburger Menu */}
            <button
              className="nav-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="hero" className="hero">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="profile-frame">
            <img
              src={portfolio.profilePic}
              alt={`${portfolio.fullName} profile`}
              className="profile-img"
              loading="lazy"
            />
          </div>
          <span className="hero-tag">Welcome to my space</span>
          <h1 className="hero-name">{portfolio.fullName}</h1>
          <p className="hero-subtitle">
            {portfolio.status.includes("B.Tech") ? "B.Tech Computer Science student" : portfolio.status} specializing in{" "}
            <Typewriter
              words={["Web Development", "Data Science", "Software Engineering", "Database Architecture"]}
              speed={80}
              delay={2000}
            />
          </p>
          <div className="hero-buttons">
            <button
              onClick={() => setIsResumeOpen(true)}
              className="btn btn-primary"
            >
              <i className="fa-solid fa-eye"></i> Quick View CV
            </button>
            <a
              href={portfolio.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <i className="fa-solid fa-file-arrow-down"></i> Download Resume
            </a>
            <button
              onClick={() => handleNavClick("contact")}
              className="btn btn-outline"
            >
              <i className="fa-solid fa-paper-plane"></i> Contact Me
            </button>
          </div>
        </motion.div>
      </header>

      <main>
        {/* About Section */}
        <section id="about">
          <div className="section-header">
            <h2 className="section-title">About Me</h2>
            <p className="section-subtitle">A brief overview of my profile and aspirations</p>
          </div>

          <motion.div
            className="about-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
          >
            {/* Bio Card */}
            <div className="glass-card about-bio-card">
              <div className="bio-quote-icon">
                <i className="fa-solid fa-quote-left"></i>
              </div>
              <p className="about-bio">
                Hello! I am <strong>{portfolio.fullName}</strong>, an aspiring software engineer specializing in Computer Science and Engineering at <strong>Audisankara College of Engineering and Technology</strong>. Passionate about web application development, cloud database systems, and data analytics, I construct robust digital solutions. I excel at translating system requirements into highly-responsive frontends and efficient database schemas.
              </p>
              <div className="about-highlight-banner">
                <i className="fa-solid fa-circle-info"></i>
                <span>Driven by solving real-world logical problems with efficient code architectures.</span>
              </div>
            </div>

            {/* Quick Facts and Personal Background Column */}
            <div className="about-details-column">
              {/* Card 1: Academic Profile */}
              <div className="glass-card detail-sub-card">
                <h4 className="detail-sub-title">
                  <i className="fa-solid fa-graduation-cap"></i> Academic Profile
                </h4>
                <div className="detail-sub-list">
                  <div className="detail-sub-item">
                    <div className="detail-sub-icon">
                      <i className="fa-solid fa-building-columns"></i>
                    </div>
                    <div className="detail-sub-text">
                      <span className="detail-label">Institution</span>
                      <span className="detail-val">Audisankara College of Engineering & Technology</span>
                    </div>
                  </div>
                  <div className="detail-sub-item">
                    <div className="detail-sub-icon">
                      <i className="fa-solid fa-bullseye"></i>
                    </div>
                    <div className="detail-sub-text">
                      <span className="detail-label">Focus Areas</span>
                      <span className="detail-val">Web Development & Data Science</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Family Background */}
              <div className="glass-card detail-sub-card">
                <h4 className="detail-sub-title">
                  <i className="fa-solid fa-users"></i> Personal Details
                </h4>
                <div className="detail-sub-list">
                  <div className="detail-sub-item">
                    <div className="detail-sub-icon">
                      <i className="fa-solid fa-user-tie"></i>
                    </div>
                    <div className="detail-sub-text">
                      <span className="detail-label">Father's Name</span>
                      <span className="detail-val">{portfolio.fatherName}</span>
                    </div>
                  </div>
                  <div className="detail-sub-item">
                    <div className="detail-sub-icon">
                      <i className="fa-solid fa-heart"></i>
                    </div>
                    <div className="detail-sub-text">
                      <span className="detail-label">Mother's Name</span>
                      <span className="detail-val">{portfolio.motherName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Animated Stats Counters */}
          <div className="stats-grid">
            <Counter
              endValue={projects.length}
              label="Projects Completed+"
              icon="fa-solid fa-laptop-code"
            />
            <Counter
              endValue={parseFloat(portfolio.gpa.match(/[\d.]+/)?.[0] || 7.69)}
              label="B.Tech CGPA"
              icon="fa-solid fa-graduation-cap"
              isFloat={true}
            />
            <Counter
              endValue={internships.length}
              label="Professional Internships+"
              icon="fa-solid fa-briefcase"
            />
            <Counter
              endValue={certificates.length}
              label="Skill Certificates"
              icon="fa-solid fa-award"
            />
          </div>

          {/* Skills block, dynamically grouped */}
          <div style={{ marginTop: "4rem" }}>
            <div className="section-header" style={{ marginBottom: "2rem" }}>
              <h3 className="section-title" style={{ fontSize: "1.8rem" }}>My Skills</h3>
            </div>

            {/* Interactive Skills Control Panel */}
            <div className="skills-control-row">
              <div className="skills-search-container" style={{ margin: 0 }}>
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  placeholder="Search skills (e.g. Java, React, SQL)..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="skills-search-input"
                />
              </div>
              <div className="skills-view-toggle">
                <button
                  className={`skills-toggle-btn ${skillView === "badges" ? "active" : ""}`}
                  onClick={() => setSkillView("badges")}
                >
                  <i className="fa-solid fa-table-cells-large"></i> Grid View
                </button>
                <button
                  className={`skills-toggle-btn ${skillView === "proficiency" ? "active" : ""}`}
                  onClick={() => setSkillView("proficiency")}
                >
                  <i className="fa-solid fa-chart-bar"></i> Levels View
                </button>
              </div>
            </div>

            <motion.div
              className="skills-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {skillCategories.map((category) => {
                const categorySkills = skills.filter((s) => s.category === category);
                return (
                  <motion.div className="glass-card" variants={zoomIn} key={category}>
                    <h4 className="skill-category-title">
                      <i className={getCategoryIcon(category)}></i> {category}
                    </h4>
                    <div className={skillView === "proficiency" ? "skills-progress-list" : "skills-list"}>
                      {categorySkills.map((s) => renderSkillItem(s.name, s.proficiency))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Education Section */}
        <section id="education">
          <div className="section-header">
            <h2 className="section-title">Education</h2>
            <p className="section-subtitle">My academic history and records</p>
          </div>

          <motion.div
            className="education-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {education.map((edu) => (
              <motion.div className="glass-card edu-card" variants={fadeInUp} key={edu.id}>
                <div className="edu-header">
                  <span className="edu-period">{edu.period}</span>
                </div>
                <h3 className="edu-degree">{edu.degree}</h3>
                <p className="edu-school">{edu.school}</p>
                <div className="edu-score">
                  <span className="edu-score-label">{edu.scoreLabel}</span>
                  <span className="edu-score-val">{edu.score}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Projects Section */}
        <section id="projects">
          <div className="section-header">
            <h2 className="section-title">Projects</h2>
            <p className="section-subtitle">Real-world applications and utilities I have built</p>
          </div>

          {/* Dynamic Category Filtering Buttons */}
          <div className="filter-buttons">
            {projectCategories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects Flex / Grid Container */}
          <motion.div
            className="projects-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerContainer}
          >
            {filteredProjects.map((proj) => (
              <motion.div
                key={proj.id}
                className="glass-card project-card"
                variants={zoomIn}
                onClick={() => setActiveProject(proj)}
              >
                <div className="project-icon">
                  <i className={proj.icon}></i>
                </div>
                <h3 className="project-title">{proj.title}</h3>
                <p className="project-desc">{proj.desc}</p>
                <div className="project-tags">
                  {proj.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-card-footer">
                  <span>View Details</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ATS Resume Reviewer Section */}
        <section id="ats-reviewer">
          <div className="section-header">
            <h2 className="section-title">ATS Resume Reviewer</h2>
            <p className="section-subtitle">Upload or paste your resume for a live AI-powered ATS audit report</p>
          </div>

          <div className="glass-card ats-container">
            <div className="ats-input-section">
              <div className="ats-dropzone-wrapper">
                <div className="ats-dropzone">
                  <i className="fa-solid fa-cloud-arrow-up ats-upload-icon"></i>
                  <p>Drag & Drop your resume (.txt, .pdf, .docx) here or</p>
                  <label className="btn btn-primary ats-file-label">
                    Browse File
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx"
                      onChange={handleAtsFileUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div className="ats-editor-wrapper">
                <textarea
                  className="ats-textarea"
                  placeholder="Or paste your resume plain text here..."
                  value={atsResumeText}
                  onChange={(e) => setAtsResumeText(e.target.value)}
                  rows="10"
                />
              </div>

              {atsError && (
                <div className="ats-error-msg">
                  <i className="fa-solid fa-circle-exclamation"></i> {atsError}
                </div>
              )}

              <div className="ats-action-wrapper">
                <button
                  className="btn btn-primary ats-analyze-btn"
                  onClick={handleAnalyzeResume}
                  disabled={isAtsLoading || !atsResumeText.trim()}
                >
                  {isAtsLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-magnifying-glass-chart"></i> Analyze Resume
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            {(isAtsLoading || atsResult || atsScore !== null) && (
              <div className="ats-results-section">
                {isAtsLoading ? (
                  <div className="ats-loading-spinner">
                    <div className="ats-spinner"></div>
                    <p>Our Recruiter AI is reviewing your resume against ATS constraints...</p>
                  </div>
                ) : (
                  <div className="ats-report-wrapper">
                    {atsScore !== null && (
                      <div className="ats-score-card glass-card">
                        <div className="ats-score-header">
                          <h3 className="ats-score-title">ATS Match Score</h3>
                        </div>
                        <div className="ats-score-body">
                          <div className={`ats-score-ring ${atsScore >= 80 ? 'high' : atsScore >= 60 ? 'medium' : 'low'}`}>
                            <div className="ats-score-value">{atsScore}%</div>
                          </div>
                          <div className="ats-score-feedback">
                            {atsScore >= 80 ? (
                              <p className="status-high"><i className="fa-solid fa-circle-check"></i> Excellent ATS Compatibility!</p>
                            ) : atsScore >= 60 ? (
                              <p className="status-medium"><i className="fa-solid fa-circle-exclamation"></i> Decent score, but needs optimization.</p>
                            ) : (
                              <p className="status-low"><i className="fa-solid fa-circle-xmark"></i> High risk of being filtered out by ATS.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {atsResult && (
                      <div className="ats-detailed-report">
                        <h3 className="ats-report-header"><i className="fa-solid fa-file-invoice"></i> ATS Recruiter Feedback</h3>

                        <div className="ats-report-grid">
                          {atsResult.split("###").map((section, idx) => {
                            if (!section.trim()) return null;
                            const lines = section.split("\n");
                            const title = lines[0].trim();
                            const content = lines.slice(1).join("\n").trim();

                            let sectionIcon = "fa-solid fa-circle-info";
                            if (title.toLowerCase().includes("summary")) sectionIcon = "fa-solid fa-user-tie";
                            else if (title.toLowerCase().includes("strengths")) sectionIcon = "fa-solid fa-award";
                            else if (title.toLowerCase().includes("weak")) sectionIcon = "fa-solid fa-triangle-exclamation";
                            else if (title.toLowerCase().includes("missing")) sectionIcon = "fa-solid fa-circle-plus";
                            else if (title.toLowerCase().includes("formatting")) sectionIcon = "fa-solid fa-text-height";
                            else if (title.toLowerCase().includes("optimization")) sectionIcon = "fa-solid fa-magnifying-glass-chart";
                            else if (title.toLowerCase().includes("readiness")) sectionIcon = "fa-solid fa-clipboard-question";
                            else if (title.toLowerCase().includes("improvements")) sectionIcon = "fa-solid fa-wrench";
                            else if (title.toLowerCase().includes("recommendation")) sectionIcon = "fa-solid fa-thumbs-up";

                            return (
                              <div key={idx} className="ats-report-card glass-card">
                                <h4 className="ats-card-title">
                                  <i className={sectionIcon}></i> {title}
                                </h4>
                                <div className="ats-card-body">
                                  {content.split("\n").map((line, lIdx) => {
                                    const trimmedLine = line.trim();
                                    if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
                                      return (
                                        <div key={lIdx} className="ats-bullet-item">
                                          <i className="fa-solid fa-chevron-right ats-bullet-icon"></i>
                                          <span>{trimmedLine.substring(1).trim()}</span>
                                        </div>
                                      );
                                    }
                                    if (trimmedLine.match(/^\d+\./)) {
                                      return (
                                        <div key={lIdx} className="ats-bullet-item">
                                          <span className="ats-bullet-number">{trimmedLine.match(/^\d+\./)[0]}</span>
                                          <span>{trimmedLine.replace(/^\d+\.\s*/, "").trim()}</span>
                                        </div>
                                      );
                                    }
                                    return <p key={lIdx} className="ats-paragraph">{trimmedLine}</p>;
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Interview Prep Section */}
        <section id="interview-prep">
          <div className="section-header">
            <h2 className="section-title">AI Interview Prep Hub</h2>
            <p className="section-subtitle">Select a subject and generation level to test your technical competency with real-time feedback</p>
          </div>

          <div className="glass-card interview-settings-card">
            <form onSubmit={handleGenerateQuestions} className="interview-form">
              <div className="interview-form-grid">
                <div className="form-group">
                  <label className="form-label">Select Core Subject</label>
                  <select
                    className="form-input"
                    value={interviewTopic}
                    onChange={(e) => setInterviewTopic(e.target.value)}
                  >
                    <option value="React.js">React.js</option>
                    <option value="Java Core">Java Core</option>
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="SQL & DBMS">SQL & DBMS</option>
                    <option value="Python Data Science">Python Data Science</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Competency Level</label>
                  <select
                    className="form-input"
                    value={interviewLevel}
                    onChange={(e) => setInterviewLevel(e.target.value)}
                  >
                    <option value="Beginner">Beginner (Basic Syntax & Concepts)</option>
                    <option value="Intermediate">Intermediate (Real-world scenarios & coding practices)</option>
                    <option value="Advanced">Advanced (System architecture, scaling, & optimization)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isInterviewLoading}
                  style={{ minWidth: "220px", justifyContent: "center" }}
                >
                  {isInterviewLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Instantiating Questions...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i> Generate 10 Questions
                    </>
                  )}
                </button>
              </div>
            </form>

            {interviewError && (
              <div className="ats-error-msg" style={{ marginTop: "1.5rem" }}>
                <i className="fa-solid fa-circle-exclamation"></i> {interviewError}
              </div>
            )}

            {isInterviewLoading && (
              <div className="interview-loading-container">
                <div className="ats-loading-spinner" style={{ margin: "2rem auto" }}></div>
                <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Generating high-quality interview questions for you. Please wait...</p>
              </div>
            )}

            {interviewQuestions.length > 0 && !isInterviewLoading && (
              <div className="interview-results-wrapper">
                <div className="interview-results-header">
                  <h3>Generated Questions for {interviewTopic} ({interviewLevel})</h3>
                  <p>Click on any question card to reveal the correct answer and explanation.</p>
                </div>
                <div className="interview-grid">
                  {interviewQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`glass-card interview-card ${q.isExpanded ? "expanded" : ""}`}
                      onClick={() => toggleQuestionExpand(idx)}
                    >
                      <div className="interview-card-header">
                        <span className={`interview-badge difficulty-${q.difficulty.toLowerCase().replace(/[^a-z]/g, "")}`}>
                          {q.difficulty}
                        </span>
                        <span className="interview-number">Question {idx + 1}</span>
                      </div>
                      <h4 className="interview-question-text">{q.question}</h4>
                      
                      <div className="interview-card-toggle-icon">
                        <i className={`fa-solid ${q.isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                        <span>{q.isExpanded ? "Hide Answer" : "Reveal Answer"}</span>
                      </div>

                      {q.isExpanded && (
                        <div className="interview-card-details" onClick={(e) => e.stopPropagation()}>
                          <div className="interview-detail-section answer-section">
                            <h5 className="detail-title">
                              <i className="fa-solid fa-circle-check"></i> Correct Answer
                            </h5>
                            <p className="detail-text">{q.answer}</p>
                          </div>
                          <div className="interview-detail-section explanation-section">
                            <h5 className="detail-title">
                              <i className="fa-solid fa-circle-info"></i> Explanation
                            </h5>
                            <p className="detail-text">{q.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Internships Section */}
        <section id="internships">
          <div className="section-header">
            <h2 className="section-title">Internships</h2>
            <p className="section-subtitle">My professional training and industry exposure</p>
          </div>

          <div className="internship-timeline">
            {internships.map((intern, index) => (
              <motion.div
                className="internship-item"
                key={intern.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={slideInLeft}
              >
                <div className="internship-dot"></div>
                <div className="glass-card internship-card">
                  <div className="internship-header">
                    <div>
                      <h3 className="internship-role">{intern.role}</h3>
                      <h4 className="internship-company">{intern.company}</h4>
                    </div>
                    <span className="internship-period">
                      <i className="far fa-calendar-alt"></i> {intern.period}
                    </span>
                  </div>
                  <ul className="internship-desc">
                    {intern.description?.map((bullet, bIdx) => (
                      <li key={bIdx} className="internship-desc-item">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Certificates Section */}
        <section id="certificates">
          <div className="section-header">
            <h2 className="section-title">Certificates</h2>
            <p className="section-subtitle">Academic milestones, skill badges, and awards</p>
          </div>

          <motion.div
            className="certs-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {certificates.map((cert) => (
              <motion.div className="glass-card cert-card" variants={zoomIn} key={cert.id}>
                <div className="cert-badge-icon">
                  <i className={cert.icon}></i>
                </div>
                <div className="cert-info">
                  <h3 className="cert-title">{cert.title}</h3>
                  <span className="cert-issuer">{cert.issuer}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Contact Section */}
        <section id="contact">
          <div className="section-header">
            <h2 className="section-title">Contact</h2>
            <p className="section-subtitle">Let's connect! Reach out for job placements or technical collaboration.</p>
          </div>

          <div className="contact-grid">
            {/* Contact details */}
            <motion.div
              className="contact-info"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              {/* Email */}
              <a
                href={`mailto:${portfolio.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card contact-card"
              >
                <div className="contact-icon">
                  <i className="fa-regular fa-envelope"></i>
                </div>
                <div className="contact-details">
                  <span className="contact-label">Email</span>
                  <span className="contact-val">{portfolio.email}</span>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/in/${portfolio.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card contact-card"
              >
                <div className="contact-icon">
                  <i className="fa-brands fa-linkedin-in"></i>
                </div>
                <div className="contact-details">
                  <span className="contact-label">LinkedIn</span>
                  <span className="contact-val">{portfolio.linkedin}</span>
                </div>
              </a>

              {/* GitHub */}
              <a
                href={`https://github.com/${portfolio.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card contact-card"
              >
                <div className="contact-icon">
                  <i className="fa-brands fa-github"></i>
                </div>
                <div className="contact-details">
                  <span className="contact-label">GitHub</span>
                  <span className="contact-val">{portfolio.github}</span>
                </div>
              </a>

              {/* Phone */}
              <a
                href={`tel:${portfolio.phone}`}
                className="glass-card contact-card"
              >
                <div className="contact-icon">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div className="contact-details">
                  <span className="contact-label">Phone</span>
                  <span className="contact-val">{portfolio.phone}</span>
                </div>
              </a>
            </motion.div>

            {/* Interactive message form */}
            <motion.div
              className="glass-card contact-form-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="form-name">Name</label>
                  <input
                    type="text"
                    id="form-name"
                    className="form-input"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="form-email">Email</label>
                  <input
                    type="email"
                    id="form-email"
                    className="form-input"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="form-message">Message</label>
                  <textarea
                    id="form-message"
                    className="form-input"
                    placeholder="Type your message here..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <i className="fa-regular fa-paper-plane"></i> Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} {portfolio.fullName}</p>
      </footer>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}


      {/* Resume Viewer Modal */}
      {isResumeOpen && (
        <div className="resume-modal-overlay" onClick={() => setIsResumeOpen(false)}>
          <div className="resume-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="resume-modal-header">
              <h3>Curriculum Vitae</h3>
              <button className="close-modal-btn" onClick={() => setIsResumeOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="resume-modal-body">
              <iframe
                src={portfolio.resumeUrl.startsWith("data:") ? portfolio.resumeUrl : `${portfolio.resumeUrl}#toolbar=0`}
                width="100%"
                height="100%"
                title={`${portfolio.fullName} Resume`}
                style={{ border: "none", borderRadius: "8px" }}
              ></iframe>
            </div>
            <div className="resume-modal-footer">
              <a
                href={portfolio.resumeUrl}
                download={`${portfolio.fullName.replace(/\s+/g, "_")}_Resume.pdf`}
                className="btn btn-primary"
                style={{ fontSize: "0.9rem", padding: "0.5rem 1.2rem" }}
              >
                <i className="fa-solid fa-download"></i> Download Copy
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {activeProject && (
        <div className="resume-modal-overlay" onClick={() => setActiveProject(null)}>
          <div className="resume-modal-content project-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="resume-modal-header">
              <h3>{activeProject.title}</h3>
              <button className="close-modal-btn" onClick={() => setActiveProject(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="resume-modal-body project-modal-body" style={{ overflowY: "auto" }}>
              <div className="project-modal-details-grid">
                <div className="project-modal-icon-wrap">
                  <i className={activeProject.icon} style={{ fontSize: "3.5rem", color: "var(--accent-cyan)" }}></i>
                </div>
                <div className="project-modal-text-wrap">
                  <span className="project-modal-category">{activeProject.category} Project</span>
                  <p className="project-modal-desc">{activeProject.desc}</p>

                  {activeProject.features && activeProject.features.length > 0 && (
                    <>
                      <h4 style={{ margin: "1.5rem 0 0.75rem 0", color: "var(--text-primary)" }}>Key Technical Highlights</h4>
                      <ul className="project-features" style={{ listStyle: "none", padding: 0 }}>
                        {activeProject.features.map((feat, idx) => (
                          <li key={idx} className="project-feature-item" style={{ marginBottom: "0.5rem" }}>
                            <i className="fa-solid fa-circle-check" style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}></i> {feat}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {activeProject.tags && activeProject.tags.length > 0 && (
                    <>
                      <h4 style={{ margin: "1.5rem 0 0.75rem 0", color: "var(--text-primary)" }}>Technologies Used</h4>
                      <div className="project-tags">
                        {activeProject.tags.map((tag, idx) => (
                          <span key={idx} className="project-tag" style={{ fontSize: "0.85rem", padding: "0.35rem 0.85rem" }}>{tag}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="resume-modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveProject(null)} style={{ padding: "0.5rem 1.5rem", fontSize: "0.9rem" }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" ? (
                <i className="fa-solid fa-circle-check"></i>
              ) : (
                <i className="fa-solid fa-circle-info"></i>
              )}
            </div>
            <p className="toast-message">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Floating AI Chat Assistant Launcher */}
      <button
        className={`ai-chat-launcher ${isChatOpen ? "active" : ""}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label="Chat with Hemanth's AI"
      >
        <i className={isChatOpen ? "fa-solid fa-xmark" : "fa-solid fa-robot"}></i>
        <span className="tooltip-text">Chat with Hemanth's AI</span>
      </button>

      {/* AI Chat Window */}
      {isChatOpen && (
        <div className="ai-chat-window glass-card">
          <div className="ai-chat-header">
            <div className="ai-chat-title-group">
              <div className="ai-chat-avatar">
                <i className="fa-solid fa-robot"></i>
                <span className="online-indicator"></span>
              </div>
              <div className="ai-chat-meta">
                <h4 className="ai-chat-title">{portfolio.fullName.split(" ").slice(-1)[0]}'s AI</h4>
                <span className="ai-chat-status">Online Assistant</span>
              </div>
            </div>
            <button className="ai-chat-close-btn" onClick={() => setIsChatOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="ai-chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message-row ${msg.sender}`}>
                {msg.sender === "ai" && (
                  <div className="chat-avatar-mini">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                )}
                <div className={`chat-message-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="chat-message-row ai">
                <div className="chat-avatar-mini">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="chat-message-bubble ai typing-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChatMessage} className="ai-chat-input-area">
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Ask about my projects, GPA, etc..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading}
            />
            <button type="submit" className="ai-chat-send-btn" disabled={isChatLoading || !chatInput.trim()}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
