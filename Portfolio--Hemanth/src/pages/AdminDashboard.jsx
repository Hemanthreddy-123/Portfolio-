import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PortfolioContext } from "../context/PortfolioContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    portfolio,
    projects,
    skills,
    certificates,
    internships,
    education,
    updatePortfolio,
    addItem,
    editItem,
    deleteItem,
    reorderItems,
    exportConfig
  } = useContext(PortfolioContext);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("portfolio_admin_auth") === "true"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Navigation state (which manager tab is open)
  const [activeTab, setActiveTab] = useState("overview");

  // Search filter inside managers
  const [searchQuery, setSearchQuery] = useState("");

  // CRUD Modals State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [modalSection, setModalSection] = useState(""); // "projects", "skills", etc.
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  // Toast Notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === "mukkamalla hemanth reddy" && password === "Hemanth@8996") {
      setIsAuthenticated(true);
      localStorage.setItem("portfolio_admin_auth", "true");
      showToast("Authentication successful! Welcome Hemanth.", "success");
    } else {
      setLoginError("Invalid username or password credentials.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("portfolio_admin_auth");
    navigate("/");
  };

  // Convert File to Base64 (for profile pictures, resumes, etc.)
  const handleMediaUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updatePortfolio({ [field]: reader.result });
      showToast(`${field === "profilePic" ? "Profile picture" : "Resume"} uploaded successfully!`, "success");
    };
    reader.readAsDataURL(file);
  };

  // Generic Open Modal helper
  const openModal = (section, mode, item = null) => {
    setModalSection(section);
    setModalMode(mode);
    setFormData(item || {});
    setEditingId(item ? item.id : null);
    setShowModal(true);
  };

  // Generic Save action
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (modalMode === "add") {
      addItem(modalSection, formData);
      showToast("Item added successfully!", "success");
    } else {
      editItem(modalSection, editingId, formData);
      showToast("Item updated successfully!", "success");
    }
    setShowModal(false);
    setFormData({});
  };

  const handleDeleteItem = (section, id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteItem(section, id);
      showToast("Item deleted successfully!", "info");
    }
  };

  const handleMoveItem = (section, index, direction) => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    let listLength = 0;
    if (section === "projects") listLength = projects.length;
    else if (section === "skills") listLength = skills.length;
    else if (section === "education") listLength = education.length;
    else if (section === "certificates") listLength = certificates.length;
    else if (section === "internships") listLength = internships.length;

    if (nextIndex < 0 || nextIndex >= listLength) return;
    reorderItems(section, index, nextIndex);
    showToast("Display order updated!", "success");
  };

  // Render Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper" style={styles.loginPage}>
        {/* Decorative Orbs */}
        <div className="bg-glow-wrapper">
          <div className="bg-glow-orb bg-glow-orb-1" style={{ top: "10%", left: "10%" }}></div>
          <div className="bg-glow-orb bg-glow-orb-2" style={{ bottom: "10%", right: "10%" }}></div>
        </div>

        <div className="glass-card login-card" style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div style={styles.loginLogo}>
              <i className="fa-solid fa-user-shield" style={{ fontSize: "2rem", color: "var(--accent-cyan)" }}></i>
            </div>
            <h2 style={{ fontSize: "1.8rem", color: "var(--text-primary)", margin: "1rem 0 0.5rem 0" }}>Admin Portal</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Sign in to manage Hemanth Reddy's Portfolio</p>
          </div>

          <form onSubmit={handleLogin} style={styles.loginForm}>
            {loginError && (
              <div style={styles.loginError}>
                <i className="fa-solid fa-triangle-exclamation"></i> {loginError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "1.2rem" }}>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Username</label>
              <input
                type="text"
                className="form-input"
                style={{ width: "100%" }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Password</label>
              <input
                type="password"
                className="form-input"
                style={{ width: "100%" }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              <i className="fa-solid fa-lock-open"></i> Unlock Portal
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link to="/" style={{ color: "var(--accent-cyan)", fontSize: "0.85rem", textDecoration: "none" }}>
              <i className="fa-solid fa-arrow-left"></i> Back to Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout" style={styles.dashboardContainer}>
      {/* Toast Notifier */}
      {toast.show && (
        <div style={{ ...styles.dashboardToast, background: toast.type === "success" ? "rgba(0, 230, 115, 0.9)" : "rgba(0, 179, 255, 0.9)" }}>
          <i className="fa-solid fa-circle-check"></i> {toast.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="glass-card" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <i className="fa-solid fa-gauge" style={{ color: "var(--accent-cyan)", fontSize: "1.3rem" }}></i>
          <span style={styles.sidebarTitle}>Portfolio CMS</span>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{ ...styles.navButton, ...(activeTab === "overview" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-chart-line" style={styles.navIcon}></i> Overview
          </button>
          <button
            onClick={() => setActiveTab("hero")}
            style={{ ...styles.navButton, ...(activeTab === "hero" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-home" style={styles.navIcon}></i> Hero Banner
          </button>
          <button
            onClick={() => setActiveTab("about")}
            style={{ ...styles.navButton, ...(activeTab === "about" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-user" style={styles.navIcon}></i> About & Bio
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            style={{ ...styles.navButton, ...(activeTab === "skills" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-bolt" style={styles.navIcon}></i> Tech Skills
          </button>
          <button
            onClick={() => setActiveTab("education")}
            style={{ ...styles.navButton, ...(activeTab === "education" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-graduation-cap" style={styles.navIcon}></i> Academic
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            style={{ ...styles.navButton, ...(activeTab === "projects" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-folder-open" style={styles.navIcon}></i> Projects
          </button>
          <button
            onClick={() => setActiveTab("internships")}
            style={{ ...styles.navButton, ...(activeTab === "internships" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-briefcase" style={styles.navIcon}></i> Internships
          </button>
          <button
            onClick={() => setActiveTab("certificates")}
            style={{ ...styles.navButton, ...(activeTab === "certificates" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-award" style={styles.navIcon}></i> Certificates
          </button>
          <button
            onClick={() => setActiveTab("media")}
            style={{ ...styles.navButton, ...(activeTab === "media" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-images" style={styles.navIcon}></i> Media Manager
          </button>
          <button
            onClick={() => setActiveTab("exporter")}
            style={{ ...styles.navButton, ...(activeTab === "exporter" ? styles.navButtonActive : {}) }}
          >
            <i className="fa-solid fa-file-export" style={styles.navIcon}></i> Code Exporter
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <i className="fa-solid fa-power-off"></i> Lock Panel
          </button>
        </div>
      </aside>

      {/* Main Dashboard Container */}
      <main style={styles.mainContent}>
        {/* Header toolbar */}
        <header className="glass-card" style={styles.mainHeader}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Admin Panel
            </h1>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Welcome back, Hemanth
            </span>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link to="/" className="btn btn-outline" style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}>
              <i className="fa-solid fa-eye"></i> View Site
            </Link>
          </div>
        </header>

        {/* Tab Views */}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <div style={styles.statsRow}>
              <div className="glass-card" style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <span style={styles.statLabel}>Projects Live</span>
                  <i className="fa-solid fa-folder-open" style={{ color: "var(--accent-cyan)", fontSize: "1.5rem" }}></i>
                </div>
                <h2 style={styles.statValue}>{projects.length}</h2>
              </div>

              <div className="glass-card" style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <span style={styles.statLabel}>Total Skills</span>
                  <i className="fa-solid fa-bolt" style={{ color: "var(--accent-blue)", fontSize: "1.5rem" }}></i>
                </div>
                <h2 style={styles.statValue}>{skills.length}</h2>
              </div>

              <div className="glass-card" style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <span style={styles.statLabel}>Certifications</span>
                  <i className="fa-solid fa-award" style={{ color: "var(--accent-cyan)", fontSize: "1.5rem" }}></i>
                </div>
                <h2 style={styles.statValue}>{certificates.length}</h2>
              </div>

              <div className="glass-card" style={styles.statCard}>
                <div style={styles.statCardHeader}>
                  <span style={styles.statLabel}>Internships Completed</span>
                  <i className="fa-solid fa-briefcase" style={{ color: "var(--accent-blue)", fontSize: "1.5rem" }}></i>
                </div>
                <h2 style={styles.statValue}>{internships.length}</h2>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "2rem", marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "1rem" }}>Quick Integration Summary</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", fontSize: "0.95rem" }}>
                All updates made in this Content Management System are persisted instantly in your browser's local sandbox. To integrate changes permanently into your source code repository, navigate to the <strong>Code Exporter</strong> tab on the sidebar. From there, you can download JavaScript files containing your latest modifications and replace them inside the <code>src/data/</code> folder.
              </p>
            </div>
          </div>
        )}

        {/* HERO SECTION TAB */}
        {activeTab === "hero" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <h3 style={styles.sectionHeader}>Manage Hero Banner & Brand Name</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePortfolio({
                  fullName: e.target.fullName.value,
                  status: e.target.status.value,
                  gpa: e.target.gpa.value
                });
                showToast("Hero section details updated!", "success");
              }}
            >
              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                <label className="form-label">Full Logo Name</label>
                <input
                  type="text"
                  name="fullName"
                  className="form-input"
                  style={{ width: "100%" }}
                  defaultValue={portfolio.fullName}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                <label className="form-label">Status Tagline</label>
                <textarea
                  name="status"
                  className="form-input"
                  style={{ width: "100%" }}
                  defaultValue={portfolio.status}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Graduation Grade / GPA</label>
                <input
                  type="text"
                  name="gpa"
                  className="form-input"
                  style={{ width: "100%" }}
                  defaultValue={portfolio.gpa}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-save"></i> Save Changes
              </button>
            </form>
          </div>
        )}

        {/* ABOUT SECTION TAB */}
        {activeTab === "about" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <h3 style={styles.sectionHeader}>Manage About Section & Bio Facts</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePortfolio({
                  fatherName: e.target.fatherName.value,
                  motherName: e.target.motherName.value,
                  systemPrompt: e.target.systemPrompt.value
                });
                showToast("Bio credentials updated!", "success");
              }}
            >
              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                <label className="form-label">Father's Name</label>
                <input
                  type="text"
                  name="fatherName"
                  className="form-input"
                  style={{ width: "100%" }}
                  defaultValue={portfolio.fatherName}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                <label className="form-label">Mother's Name</label>
                <input
                  type="text"
                  name="motherName"
                  className="form-input"
                  style={{ width: "100%" }}
                  defaultValue={portfolio.motherName}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Gemini AI chatbot Prompt</label>
                <textarea
                  name="systemPrompt"
                  className="form-input"
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
                  defaultValue={portfolio.systemPrompt}
                  rows="12"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-save"></i> Save Bio & System Prompt
              </button>
            </form>
          </div>
        )}

        {/* SKILLS MANAGER TAB */}
        {activeTab === "skills" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={styles.listHeaderRow}>
              <h3 style={styles.sectionHeader}>Manage Tech Skills</h3>
              <button onClick={() => openModal("skills", "add")} className="btn btn-primary">
                <i className="fa-solid fa-plus"></i> Add New Skill
              </button>
            </div>

            <table style={styles.crudTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Skill Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Proficiency (%)</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill, index) => (
                  <tr key={skill.id} style={styles.tr}>
                    <td style={styles.td}>{skill.name}</td>
                    <td style={styles.td}>{skill.category}</td>
                    <td style={styles.td}>
                      <div style={styles.barWrap}>
                        <div style={{ ...styles.barFill, width: `${skill.proficiency}%` }} />
                        <span style={styles.barLabel}>{skill.proficiency}%</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => openModal("skills", "edit", skill)} style={styles.actionBtnIcon} title="Edit">
                        <i className="fa-solid fa-edit" style={{ color: "var(--accent-cyan)" }}></i>
                      </button>
                      <button onClick={() => handleDeleteItem("skills", skill.id)} style={styles.actionBtnIcon} title="Delete">
                        <i className="fa-solid fa-trash" style={{ color: "coral" }}></i>
                      </button>
                      <button onClick={() => handleMoveItem("skills", index, "up")} style={styles.actionBtnIcon} disabled={index === 0} title="Move Up">
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button onClick={() => handleMoveItem("skills", index, "down")} style={styles.actionBtnIcon} disabled={index === skills.length - 1} title="Move Down">
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EDUCATION MANAGER TAB */}
        {activeTab === "education" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={styles.listHeaderRow}>
              <h3 style={styles.sectionHeader}>Manage Academic Credentials</h3>
              <button onClick={() => openModal("education", "add")} className="btn btn-primary">
                <i className="fa-solid fa-plus"></i> Add Education
              </button>
            </div>

            <table style={styles.crudTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Period</th>
                  <th style={styles.th}>Degree</th>
                  <th style={styles.th}>Institution</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {education.map((edu, index) => (
                  <tr key={edu.id} style={styles.tr}>
                    <td style={styles.td}>{edu.period}</td>
                    <td style={styles.td}>{edu.degree}</td>
                    <td style={styles.td}>{edu.school}</td>
                    <td style={styles.td}>{edu.score}</td>
                    <td style={styles.td}>
                      <button onClick={() => openModal("education", "edit", edu)} style={styles.actionBtnIcon} title="Edit">
                        <i className="fa-solid fa-edit" style={{ color: "var(--accent-cyan)" }}></i>
                      </button>
                      <button onClick={() => handleDeleteItem("education", edu.id)} style={styles.actionBtnIcon} title="Delete">
                        <i className="fa-solid fa-trash" style={{ color: "coral" }}></i>
                      </button>
                      <button onClick={() => handleMoveItem("education", index, "up")} style={styles.actionBtnIcon} disabled={index === 0} title="Move Up">
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button onClick={() => handleMoveItem("education", index, "down")} style={styles.actionBtnIcon} disabled={index === education.length - 1} title="Move Down">
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PROJECTS MANAGER TAB */}
        {activeTab === "projects" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={styles.listHeaderRow}>
              <h3 style={styles.sectionHeader}>Manage Projects</h3>
              <button onClick={() => openModal("projects", "add")} className="btn btn-primary">
                <i className="fa-solid fa-plus"></i> Add Project
              </button>
            </div>

            <table style={styles.crudTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Icon</th>
                  <th style={styles.th}>Tags</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj, index) => (
                  <tr key={proj.id} style={styles.tr}>
                    <td style={styles.td}>{proj.title}</td>
                    <td style={styles.td}>{proj.category}</td>
                    <td style={styles.td}>
                      <i className={proj.icon} style={{ fontSize: "1.2rem", color: "var(--accent-cyan)" }}></i>
                    </td>
                    <td style={styles.td}>
                      {proj.tags?.map((t, idx) => (
                        <span key={idx} className="project-tag" style={{ margin: "2px", fontSize: "0.75rem" }}>{t}</span>
                      ))}
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => openModal("projects", "edit", proj)} style={styles.actionBtnIcon} title="Edit">
                        <i className="fa-solid fa-edit" style={{ color: "var(--accent-cyan)" }}></i>
                      </button>
                      <button onClick={() => handleDeleteItem("projects", proj.id)} style={styles.actionBtnIcon} title="Delete">
                        <i className="fa-solid fa-trash" style={{ color: "coral" }}></i>
                      </button>
                      <button onClick={() => handleMoveItem("projects", index, "up")} style={styles.actionBtnIcon} disabled={index === 0} title="Move Up">
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button onClick={() => handleMoveItem("projects", index, "down")} style={styles.actionBtnIcon} disabled={index === projects.length - 1} title="Move Down">
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INTERNSHIPS MANAGER TAB */}
        {activeTab === "internships" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={styles.listHeaderRow}>
              <h3 style={styles.sectionHeader}>Manage Professional Internships</h3>
              <button onClick={() => openModal("internships", "add")} className="btn btn-primary">
                <i className="fa-solid fa-plus"></i> Add Internship
              </button>
            </div>

            <table style={styles.crudTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Role / Position</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Period</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {internships.map((intern, index) => (
                  <tr key={intern.id} style={styles.tr}>
                    <td style={styles.td}>{intern.role}</td>
                    <td style={styles.td}>{intern.company}</td>
                    <td style={styles.td}>{intern.period}</td>
                    <td style={styles.td}>
                      <button onClick={() => openModal("internships", "edit", intern)} style={styles.actionBtnIcon} title="Edit">
                        <i className="fa-solid fa-edit" style={{ color: "var(--accent-cyan)" }}></i>
                      </button>
                      <button onClick={() => handleDeleteItem("internships", intern.id)} style={styles.actionBtnIcon} title="Delete">
                        <i className="fa-solid fa-trash" style={{ color: "coral" }}></i>
                      </button>
                      <button onClick={() => handleMoveItem("internships", index, "up")} style={styles.actionBtnIcon} disabled={index === 0} title="Move Up">
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button onClick={() => handleMoveItem("internships", index, "down")} style={styles.actionBtnIcon} disabled={index === internships.length - 1} title="Move Down">
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === "certificates" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <div style={styles.listHeaderRow}>
              <h3 style={styles.sectionHeader}>Manage Certificates</h3>
              <button onClick={() => openModal("certificates", "add")} className="btn btn-primary">
                <i className="fa-solid fa-plus"></i> Add Certificate
              </button>
            </div>

            <table style={styles.crudTable}>
              <thead>
                <tr>
                  <th style={styles.th}>Certificate Title</th>
                  <th style={styles.th}>Issuer</th>
                  <th style={styles.th}>Icon Class</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert, index) => (
                  <tr key={cert.id} style={styles.tr}>
                    <td style={styles.td}>{cert.title}</td>
                    <td style={styles.td}>{cert.issuer}</td>
                    <td style={styles.td}>
                      <i className={cert.icon} style={{ fontSize: "1.2rem", color: "var(--accent-cyan)" }}></i>
                    </td>
                    <td style={styles.td}>
                      <button onClick={() => openModal("certificates", "edit", cert)} style={styles.actionBtnIcon} title="Edit">
                        <i className="fa-solid fa-edit" style={{ color: "var(--accent-cyan)" }}></i>
                      </button>
                      <button onClick={() => handleDeleteItem("certificates", cert.id)} style={styles.actionBtnIcon} title="Delete">
                        <i className="fa-solid fa-trash" style={{ color: "coral" }}></i>
                      </button>
                      <button onClick={() => handleMoveItem("certificates", index, "up")} style={styles.actionBtnIcon} disabled={index === 0} title="Move Up">
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button onClick={() => handleMoveItem("certificates", index, "down")} style={styles.actionBtnIcon} disabled={index === certificates.length - 1} title="Move Down">
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MEDIA MANAGER TAB */}
        {activeTab === "media" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <h3 style={styles.sectionHeader}>Manage Media Assets (Base64)</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Upload assets directly. Files will be converted into encoded Base64 strings and stored inside browser storage locally.
            </p>

            <div style={styles.mediaGrid}>
              <div className="glass-card" style={styles.mediaItem}>
                <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", marginBottom: "1rem" }}>Profile Avatar</h4>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <img
                    src={portfolio.profilePic}
                    alt="avatar-preview"
                    style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaUpload(e, "profilePic")}
                    id="profile-pic-upload"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="profile-pic-upload" className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", cursor: "pointer" }}>
                    <i className="fa-solid fa-upload"></i> Upload Photo
                  </label>
                </div>
              </div>

              <div className="glass-card" style={styles.mediaItem}>
                <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", marginBottom: "1rem" }}>Curriculum Vitae (PDF)</h4>
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleMediaUpload(e, "resumeUrl")}
                    id="resume-pdf-upload"
                    style={{ display: "none" }}
                  />
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label htmlFor="resume-pdf-upload" className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", cursor: "pointer" }}>
                      <i className="fa-solid fa-file-pdf"></i> Upload CV PDF
                    </label>
                    <a href={portfolio.resumeUrl} download="resume.pdf" className="btn btn-outline" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                      <i className="fa-solid fa-download"></i> Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CODE EXPORTER TAB */}
        {activeTab === "exporter" && (
          <div className="glass-card" style={{ padding: "2rem" }}>
            <h3 style={styles.sectionHeader}>Export Configurations</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1.5rem" }}>
              Download JS configuration files containing your updated data. Overwrite the files in the <code>src/data/</code> directory of your portfolio codebase to save these edits permanently.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={styles.exportItem}>
                <span style={{ color: "var(--text-primary)" }}>Personal Info Configuration (<code>portfolio.js</code>)</span>
                <button onClick={() => exportConfig("portfolio")} className="btn btn-primary" style={{ padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>

              <div style={styles.exportItem}>
                <span style={{ color: "var(--text-primary)" }}>Academic Background (<code>education.js</code>)</span>
                <button onClick={() => exportConfig("education")} className="btn btn-primary" style={{ padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>

              <div style={styles.exportItem}>
                <span style={{ color: "var(--text-primary)" }}>Project Configurations (<code>projects.js</code>)</span>
                <button onClick={() => exportConfig("projects")} className="btn btn-primary" style={{ padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>

              <div style={styles.exportItem}>
                <span style={{ color: "var(--text-primary)" }}>Skill Configurations (<code>skills.js</code>)</span>
                <button onClick={() => exportConfig("skills")} className="btn btn-primary" style={{ padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>

              <div style={styles.exportItem}>
                <span style={{ color: "var(--text-primary)" }}>Internships Timeline (<code>internships.js</code>)</span>
                <button onClick={() => exportConfig("internships")} className="btn btn-primary" style={{ padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>

              <div style={styles.exportItem}>
                <span style={{ color: "var(--text-primary)" }}>Certifications configuration (<code>certificates.js</code>)</span>
                <button onClick={() => exportConfig("certificates")} className="btn btn-primary" style={{ padding: "0.4rem 1.2rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-download"></i> Download
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CRUD modal form */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>
                {modalMode === "add" ? "Add New Record" : "Edit Record"}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ marginTop: "1rem" }}>
              {/* SKILLS INPUT FORM */}
              {modalSection === "skills" && (
                <>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Skill Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.category || "Languages"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="Languages">Languages</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Databases">Databases</option>
                      <option value="Core Subjects">Core Subjects</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">Proficiency Level ({formData.proficiency || 80}%)</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      className="form-input"
                      style={{ width: "100%", padding: 0 }}
                      value={formData.proficiency || 80}
                      onChange={(e) => setFormData({ ...formData, proficiency: parseInt(e.target.value, 10) })}
                      required
                    />
                  </div>
                </>
              )}

              {/* PROJECTS INPUT FORM */}
              {modalSection === "projects" && (
                <>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Project Title</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.category || "Web Dev"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="Web Dev">Web Dev</option>
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Icon Class (FontAwesome)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="e.g. fa-solid fa-code"
                      value={formData.icon || "fa-solid fa-code"}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Short Description</label>
                    <textarea
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.desc || ""}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      rows="3"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Technologies (comma separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="React, CSS, Vite"
                      value={formData.tags ? (Array.isArray(formData.tags) ? formData.tags.join(", ") : formData.tags) : ""}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()) })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">Key Features (one per line)</label>
                    <textarea
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="Feature 1&#10;Feature 2"
                      value={formData.features ? (Array.isArray(formData.features) ? formData.features.join("\n") : formData.features) : ""}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value.split("\n").map(f => f.trim()) })}
                      rows="3"
                      required
                    />
                  </div>
                </>
              )}

              {/* EDUCATION INPUT FORM */}
              {modalSection === "education" && (
                <>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Academic Period</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="e.g. 2022 - Present"
                      value={formData.period || ""}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Degree Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="e.g. B.Tech (Computer Science)"
                      value={formData.degree || ""}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">School / University</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.school || ""}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Score Label</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="Graduation Grade / Current Grade"
                      value={formData.scoreLabel || "Graduation Grade"}
                      onChange={(e) => setFormData({ ...formData, scoreLabel: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">Graduation Score</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="7.69 CGPA or 519 / 600"
                      value={formData.score || ""}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {/* INTERNSHIPS INPUT FORM */}
              {modalSection === "internships" && (
                <>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.role || ""}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.company || ""}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Work Period</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="01/2026 - Present"
                      value={formData.period || ""}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">Job Bullet Description (one per line)</label>
                    <textarea
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="Designed responsive interfaces...&#10;Audited script structures..."
                      value={formData.description ? (Array.isArray(formData.description) ? formData.description.join("\n") : formData.description) : ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value.split("\n").map(d => d.trim()) })}
                      rows="5"
                      required
                    />
                  </div>
                </>
              )}

              {/* CERTIFICATES INPUT FORM */}
              {modalSection === "certificates" && (
                <>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Certificate Title</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Issuer</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      value={formData.issuer || ""}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">FontAwesome Icon Class Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="e.g. fa-solid fa-award"
                      value={formData.icon || "fa-solid fa-award"}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: "0.5rem 1.5rem" }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1.5rem" }}>
                  <i className="fa-solid fa-check"></i> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline custom stylesheets for the CMS Dashboard layout
const styles = {
  loginPage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100vw",
    background: "var(--bg-primary)",
    position: "relative",
    overflow: "hidden"
  },
  loginCard: {
    width: "420px",
    padding: "2.5rem",
    zIndex: 10,
    boxShadow: "var(--glow-cyan)"
  },
  loginHeader: {
    textAlign: "center",
    marginBottom: "2rem"
  },
  loginLogo: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "var(--glass-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    border: "1px solid var(--border-color)"
  },
  loginError: {
    background: "rgba(255, 77, 77, 0.15)",
    border: "1px solid rgb(255, 77, 77)",
    color: "rgb(255, 128, 128)",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1.2rem",
    fontSize: "0.85rem"
  },
  dashboardContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg-primary)"
  },
  sidebar: {
    width: "260px",
    borderRight: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    borderRadius: 0,
    height: "100vh",
    position: "sticky",
    top: 0,
    overflowY: "auto"
  },
  sidebarHeader: {
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderBottom: "1px solid var(--border-color)"
  },
  sidebarTitle: {
    fontWeight: "700",
    fontSize: "1.1rem",
    color: "var(--text-primary)",
    letterSpacing: "0.5px"
  },
  sidebarNav: {
    padding: "1.5rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1
  },
  navButton: {
    background: "none",
    border: "none",
    padding: "0.75rem 1rem",
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s ease"
  },
  navButtonActive: {
    background: "var(--glass-bg)",
    color: "var(--accent-cyan)",
    boxShadow: "var(--glow-cyan)",
    fontWeight: "500"
  },
  navIcon: {
    marginRight: "0.75rem",
    width: "18px",
    textAlign: "center"
  },
  sidebarFooter: {
    padding: "1.5rem",
    borderTop: "1px solid var(--border-color)"
  },
  logoutBtn: {
    background: "rgba(255, 77, 77, 0.1)",
    border: "1px solid rgba(255, 77, 77, 0.3)",
    padding: "0.6rem 1rem",
    color: "rgb(255, 128, 128)",
    width: "100%",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem"
  },
  mainContent: {
    flex: 1,
    padding: "2.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    minHeight: "100vh"
  },
  mainHeader: {
    padding: "1.25rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem"
  },
  statCard: {
    padding: "1.5rem"
  },
  statCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem"
  },
  statLabel: {
    color: "var(--text-secondary)",
    fontSize: "0.85rem"
  },
  statValue: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "var(--text-primary)"
  },
  sectionHeader: {
    fontSize: "1.2rem",
    color: "var(--text-primary)",
    fontWeight: "600",
    marginBottom: "1.5rem"
  },
  listHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem"
  },
  crudTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  th: {
    padding: "1rem",
    borderBottom: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    fontWeight: "500"
  },
  tr: {
    borderBottom: "1px solid var(--border-color)"
  },
  td: {
    padding: "1rem",
    color: "var(--text-primary)",
    fontSize: "0.9rem"
  },
  actionBtnIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    marginRight: "0.75rem",
    color: "var(--text-secondary)",
    transition: "color 0.2s"
  },
  barWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  barFill: {
    height: "6px",
    borderRadius: "3px",
    background: "var(--accent-cyan)",
    boxShadow: "var(--glow-cyan)"
  },
  barLabel: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)"
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem"
  },
  mediaItem: {
    padding: "1.5rem"
  },
  exportItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    background: "var(--glass-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modalContent: {
    width: "500px",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "2rem"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "1rem"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "1.2rem",
    cursor: "pointer"
  },
  dashboardToast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 2000,
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  }
};
