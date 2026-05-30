import React, { createContext, useState, useEffect } from "react";
import { initialPortfolioData } from "../data/portfolio";
import { initialProjectsData } from "../data/projects";
import { initialSkillsData } from "../data/skills";
import { initialCertificatesData } from "../data/certificates";
import { initialInternshipsData } from "../data/internships";
import { initialEducationData } from "../data/education";

export const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  // Load data from LocalStorage if exists, else fallback to initial data
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem("portfolio_main");
    return saved ? JSON.parse(saved) : initialPortfolioData;
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("portfolio_projects");
    return saved ? JSON.parse(saved) : initialProjectsData;
  });

  const [skills, setSkills] = useState(() => {
    const saved = localStorage.getItem("portfolio_skills");
    return saved ? JSON.parse(saved) : initialSkillsData;
  });

  const [certificates, setCertificates] = useState(() => {
    const saved = localStorage.getItem("portfolio_certificates");
    return saved ? JSON.parse(saved) : initialCertificatesData;
  });

  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem("portfolio_internships");
    return saved ? JSON.parse(saved) : initialInternshipsData;
  });

  const [education, setEducation] = useState(() => {
    const saved = localStorage.getItem("portfolio_education");
    return saved ? JSON.parse(saved) : initialEducationData;
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("portfolio_main", JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem("portfolio_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("portfolio_skills", JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem("portfolio_certificates", JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem("portfolio_internships", JSON.stringify(internships));
  }, [internships]);

  useEffect(() => {
    localStorage.setItem("portfolio_education", JSON.stringify(education));
  }, [education]);

  // Update Main Portfolio Details
  const updatePortfolio = (updatedData) => {
    setPortfolio((prev) => ({ ...prev, ...updatedData }));
  };

  // Generic List Operations
  const addItem = (section, item) => {
    const newItem = { ...item, id: Date.now() };
    if (section === "projects") setProjects((prev) => [...prev, newItem]);
    else if (section === "skills") setSkills((prev) => [...prev, newItem]);
    else if (section === "certificates") setCertificates((prev) => [...prev, newItem]);
    else if (section === "internships") setInternships((prev) => [...prev, newItem]);
    else if (section === "education") setEducation((prev) => [...prev, newItem]);
  };

  const editItem = (section, id, updatedItem) => {
    const updateFn = (list) => list.map((item) => (item.id === id ? { ...item, ...updatedItem } : item));
    if (section === "projects") setProjects(updateFn);
    else if (section === "skills") setSkills(updateFn);
    else if (section === "certificates") setCertificates(updateFn);
    else if (section === "internships") setInternships(updateFn);
    else if (section === "education") setEducation(updateFn);
  };

  const deleteItem = (section, id) => {
    const filterFn = (list) => list.filter((item) => item.id !== id);
    if (section === "projects") setProjects(filterFn);
    else if (section === "skills") setSkills(filterFn);
    else if (section === "certificates") setCertificates(filterFn);
    else if (section === "internships") setInternships(filterFn);
    else if (section === "education") setEducation(filterFn);
  };

  const reorderItems = (section, startIndex, endIndex) => {
    const reorder = (list) => {
      const result = Array.from(list);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    };
    if (section === "projects") setProjects(reorder);
    else if (section === "skills") setSkills(reorder);
    else if (section === "certificates") setCertificates(reorder);
    else if (section === "internships") setInternships(reorder);
    else if (section === "education") setEducation(reorder);
  };

  const exportConfig = (sectionName) => {
    let dataToExport;
    let fileName = `portfolio_${sectionName}.json`;

    if (sectionName === "portfolio") {
      dataToExport = portfolio;
      fileName = "portfolio.js";
    } else if (sectionName === "projects") {
      dataToExport = projects;
      fileName = "projects.js";
    } else if (sectionName === "skills") {
      dataToExport = skills;
      fileName = "skills.js";
    } else if (sectionName === "certificates") {
      dataToExport = certificates;
      fileName = "certificates.js";
    } else if (sectionName === "internships") {
      dataToExport = internships;
      fileName = "internships.js";
    } else if (sectionName === "education") {
      dataToExport = education;
      fileName = "education.js";
    }

    const fileContent = sectionName === "portfolio"
      ? `export const initialPortfolioData = ${JSON.stringify(dataToExport, null, 2)};`
      : `export const initial${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}Data = ${JSON.stringify(dataToExport, null, 2)};`;

    const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PortfolioContext.Provider
      value={{
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
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};
