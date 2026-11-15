import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiC,
  SiCplusplus,
} from "react-icons/si";

import { FaJava } from "react-icons/fa";
import { useState } from "react";
import Navbar from "../components/Navbar";
import {
  analyzeCode,
  predictCode,
  reviewCodeWithAI,
} from "../services/api";
import "./Analysis.css";

const languages = [
  { label: "Python", value: "python", icon: SiPython },
  { label: "Java", value: "java", icon: FaJava },
  { label: "JavaScript", value: "javascript", icon: SiJavascript },
  { label: "TypeScript", value: "typescript", icon: SiTypescript },
  { label: "C", value: "c", icon: SiC },
  { label: "C++", value: "cpp", icon: SiCplusplus },
];

function Analysis() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiReview, setAiReview] = useState("");
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState("");

  const handleAnalysis = async () => {
    if (!code.trim()) {
      setError("Please enter source code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      // Calculate language-specific code metrics
      const metricsResponse = await analyzeCode(code, language);

      if (metricsResponse.status !== "success") {
        throw new Error(
          metricsResponse.message || "Unable to analyze code."
        );
      }

      let predictionResult = null;

      // Existing ML model supports Python only
      if (language === "python") {
        try {
          predictionResult = await predictCode(code);
        } catch {
          predictionResult = {
            status: "error",
            message: "Python metrics are available, but ML prediction failed."
          };
        }
      }

      setResult({
        language: metricsResponse.language,
        metrics: metricsResponse.metrics,
        prediction: predictionResult,
      });

    } catch (err: any) {
      setError(
        err.message || "Unable to connect to CodeGuardian backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAIReview = async () => {
    if (!code.trim()) {
      setAiReviewError("Please enter source code first.");
      return;
  }

  try {
    setAiReviewLoading(true);
    setAiReviewError("");
    setAiReview("");

    const extensions: Record<string, string> = {
      python: "main.py",
      java: "Main.java",
      javascript: "script.js",
      typescript: "script.ts",
      c: "main.c",
      cpp: "main.cpp",
    };

    const filename = extensions[language] || "source.txt";

    const response = await reviewCodeWithAI(filename, code);

    setAiReview(response.review || "No review was returned.");
  } catch (err: any) {
    setAiReviewError(
      err.message || "Unable to complete AI code review."
    );
  } finally {
    setAiReviewLoading(false);
  }
};

  return (
    <div className="analysis-page">
      <Navbar />

      <main className="analysis-content">

        <div className="analysis-header">
          <h1>Code Analysis</h1>
          <p>
            Analyze source code across multiple programming languages
            using CodeGuardian AI.
          </p>
        </div>

        <section className="analysis-section">
          <h2>Source Code Analysis</h2>

          <div className="analysis-panel">

           <label>Select Programming Language</label>

          <div className="language-options">
            {languages.map((item) => {
              const LanguageIcon = item.icon;

              return (
                <button
                  type="button"
                  key={item.value}
                  className={`language-option ${
                    language === item.value ? "selected" : ""
                }`}
                  onClick={() => {
                    setLanguage(item.value);
                    setResult(null);
                    setError("");
                    setAiReview("");
                    setAiReviewError("");
                  }}
              >
                  <LanguageIcon className="language-icon" />
                  <span>{item.label}</span>
               </button>
             );
          })}
        </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={`Paste your ${language} source code here...`}
              rows={14}
              className="code-input"
              spellCheck={false}
            />

            <button
              className="analysis-button"
              onClick={handleAnalysis}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Code"}
            </button>

            <button
              className="analysis-button"
              onClick={handleAIReview}
              disabled={aiReviewLoading}
            >
            {aiReviewLoading ? "Reviewing Code..." : "Review Code with AI"}
            </button>
            {error && (
              <p className="analysis-error">{error}</p>
            )}

          </div>
        </section>

        {result && (
          <>
            <section className="analysis-section">
              <h2>Analysis Results</h2>

              <div className="analysis-panel">
                <p>
                  <strong>Programming Language:</strong>{" "}
                  {languages.find(
                    (item) => item.value === result.language
                  )?.label || result.language}
                </p>

                <p>
                  <strong>Analysis Status:</strong> Completed
                </p>
              </div>
            </section>

            {result.prediction?.status === "success" && (
              <div className="analysis-grid">

                <div className="analysis-card">
                  <h3>Defect Prediction</h3>
                  <div className="analysis-value">
                    {result.prediction.prediction
                      ? "Potential Defect"
                      : "No Defect"}
                  </div>
                </div>

                <div className="analysis-card">
                  <h3>Defect Probability</h3>
                  <div className="analysis-value">
                    {(result.prediction.defect_probability * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="analysis-card">
                  <h3>Risk Level</h3>
                  <div className="analysis-value">
                    {result.prediction.risk_level}
                  </div>
                </div>

              </div>
            )}

            {result.prediction?.status === "error" && (
              <p className="analysis-error">
                {result.prediction.message}
              </p>
            )}

            <section className="analysis-section">
              <h2>Detected Code Metrics</h2>

              <div className="analysis-panel">
                {Object.entries(result.metrics).map(
                  ([name, value]) => (
                    <div className="recommendation" key={name}>
                      <strong>
                        {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </strong>
                      <span>{String(value)}</span>
                    </div>
                  )
                )}
              </div>
            </section>

            {result.prediction?.status === "success" && (
              <section className="analysis-section">
                <h2>AI Recommendations</h2>

                <div className="analysis-panel">
                  {result.prediction.recommendations.map(
                    (recommendation: string, index: number) => (
                      <div className="recommendation" key={index}>
                        <strong>
                          Recommendation {index + 1}
                        </strong>
                        <span>{recommendation}</span>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {language !== "python" && (
              <p className="analysis-error">
                ML defect prediction is currently available only
                for Python. Other languages receive code metrics analysis.
              </p>
            )}
          </>
        )}

        {aiReviewError && (
  <p className="analysis-error">{aiReviewError}</p>
)}

{aiReview && (
  <section className="analysis-section">
    <h2>AI Code Review Results</h2>

    <div className="analysis-panel">
      <pre
        style={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          fontFamily: "inherit",
          lineHeight: 1.7,
        }}
      >
        {aiReview}
      </pre>
    </div>
  </section>
)}

      </main>
    </div>
  );
}

export default Analysis;