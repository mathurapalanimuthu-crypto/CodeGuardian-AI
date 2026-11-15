import Navbar from "../components/Navbar";
import {
  Activity,
  AlertTriangle,
  Clock3,
  FolderGit2,
  Gauge,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import "./Dashboard.css";
import { Link } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";
import { useState } from "react";

function Dashboard() {
  const { latestAnalysis } = useAnalysis();
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const scores = latestAnalysis?.scores;
  const files = latestAnalysis?.files ?? [];

  const repositoryName =
    latestAnalysis?.repositoryInfo?.full_name ||
    latestAnalysis?.repositoryInfo?.name ||
    latestAnalysis?.repositoryUrl ||
    "No repository selected";

  const healthScore =
    scores?.software_health_score ?? "--";

  const debtScore =
    scores?.technical_debt_score ?? "--";

  const riskScore =
    scores?.risk_score ?? scores?.risk_level ?? "--";

  // Count ML predictions from analyzed Python files
  const riskCounts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  files.forEach((file: any) => {
    const risk = file.ml_prediction?.risk_level?.toLowerCase();

    if (risk === "low") riskCounts.low++;
    if (risk === "medium") riskCounts.medium++;
    if (risk === "high") riskCounts.high++;
  });

  const totalPredictions =
    riskCounts.low + riskCounts.medium + riskCounts.high;

  const riskFiles = files
  .filter((file: any) => file.ml_prediction?.risk_level)
  .sort((a: any, b: any) => {
    const priority: Record<string, number> = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return (
      (priority[b.ml_prediction.risk_level] ?? 0) -
      (priority[a.ml_prediction.risk_level] ?? 0)
    );
  });

  // Collect recommendations from ML predictions
  const recommendations: string[] = Array.from(
  new Set<string>(
    files.flatMap((file: any): string[] =>
      (file.ml_prediction?.recommendations ?? []) as string[]
    )
  )
).slice(0, 5);

  const analyzedDate = latestAnalysis?.analyzedAt
    ? new Date(latestAnalysis.analyzedAt).toLocaleString()
    : null;

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content">

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow">
              <Activity size={15} />
              SOFTWARE INTELLIGENCE CENTER
            </div>

            <h1>
              Software Intelligence <span>Dashboard</span>
            </h1>

            <p>
              Monitor software health, technical debt, and development risks
              through intelligent code analysis.
            </p>
          </div>

          <div className="dashboard-live-indicator">
            <span className="live-dot"></span>
            {latestAnalysis ? "Analysis Complete" : "System Ready"}
          </div>
        </div>

        {/* Repository Overview */}
        <section className="repository-bar">
          <div className="repository-info">
            <div className="repository-icon">
              <FolderGit2 size={25} />
            </div>

            <div>
              <div className="repository-name">
                {repositoryName}
              </div>

              <div className="score-label">
                {latestAnalysis
                  ? `${latestAnalysis.analyzedFileCount} files analyzed`
                  : "Connect a GitHub repository to begin analysis"}
              </div>
            </div>
          </div>

          <div className="repository-actions">
            <div className="repository-status">
              <span className="status-dot"></span>
              {latestAnalysis ? "Analysis completed" : "Ready for analysis"}
            </div>

            <Link to="/repository" className="repository-select-button">
              <GitBranch size={17} />
              {latestAnalysis ? "Analyze Repository" : "Select Repository"}
            </Link>
          </div>
        </section>

        {/* Score Cards */}
        <div className="dashboard-section-heading">
          <div>
            <h2>Software Performance</h2>
            <p>Key indicators of your software quality</p>
          </div>

          <span className="section-tag">OVERVIEW</span>
        </div>

        <div className="score-grid">

          {/* Health */}
          <div className="score-card health-card">
            <div className="score-card-top">
              <div className="score-icon health-icon">
                <ShieldCheck size={23} />
              </div>
              <span className="score-category">QUALITY</span>
            </div>

            <h3>Software Health Score</h3>

            <div className="health-score">
              {healthScore}
              {typeof healthScore === "number" ? "/100" : ""}
            </div>

            <div className="score-label">
              {latestAnalysis
                ? "Overall repository health"
                : "Waiting for repository analysis"}
            </div>

            <div className="score-card-footer">
              <ShieldCheck size={15} />
              Overall code quality
            </div>
          </div>

          {/* Technical Debt */}
          <div className="score-card debt-card">
            <div className="score-card-top">
              <div className="score-icon debt-icon">
                <Wrench size={23} />
              </div>
              <span className="score-category">MAINTENANCE</span>
            </div>

            <h3>Technical Debt</h3>

            <div className="metric-value">
              {debtScore}
              {typeof debtScore === "number" ? "/100" : ""}
            </div>

            <div className="score-label">
              {latestAnalysis
                ? "Repository maintainability score"
                : "Awaiting analysis"}
            </div>

            <div className="score-card-footer">
              <Wrench size={15} />
              Code maintainability
            </div>
          </div>

          {/* Risk */}
          <div className="score-card risk-card">
            <div className="score-card-top">
              <div className="score-icon risk-icon">
                <AlertTriangle size={23} />
              </div>
              <span className="score-category">SECURITY & RISK</span>
            </div>

            <h3>Risk Score</h3>

            <div className="metric-value">
              {riskScore}
              {typeof riskScore === "number" ? "/100" : ""}
            </div>

            <div className="score-label">
              {latestAnalysis
                ? "Repository risk assessment"
                : "Awaiting analysis"}
            </div>

            <div className="score-card-footer">
              <AlertTriangle size={15} />
              Software risk assessment
            </div>
          </div>

        </div>

        {/* Risk Overview */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>
                <Activity size={21} />
                Risk Overview
              </h2>
              <p>Understand potential software quality issues</p>
            </div>
          </div>

          <div className="dashboard-panel risk-overview-panel">

            {latestAnalysis && totalPredictions > 0 ? (
              <>
                <h3>ML Defect Risk Distribution</h3>

                <p>
                  Risk predictions from {totalPredictions} analyzed Python files.
                </p>

                <div className="risk-summary-grid">
                  <div className="risk-summary-card low-summary">
                    <span>Low Risk</span>
                    <strong>{riskCounts.low}</strong>
                    <small>
                      {((riskCounts.low / totalPredictions) * 100).toFixed(1)}%
                    </small>
                  </div>

                  <div className="risk-summary-card medium-summary">
                    <span>Medium Risk</span>
                    <strong>{riskCounts.medium}</strong>
                    <small>
                      {((riskCounts.medium / totalPredictions) * 100).toFixed(1)}%
                    </small>
                  </div>

                  <div className="risk-summary-card high-summary">
                    <span>High Risk</span>
                    <strong>{riskCounts.high}</strong>
                    <small>
                      {((riskCounts.high / totalPredictions) * 100).toFixed(1)}%
                    </small>
                  </div>
                </div>

                <h4 className="risk-bar-heading">Risk Distribution</h4>

                <div className="risk-distribution-bar">
                  <div
                    className="risk-bar-low"
                    style={{
                      width: `${(riskCounts.low / totalPredictions) * 100}%`
                    }}
                  />

                  <div
                    className="risk-bar-medium"
                    style={{
                      width: `${(riskCounts.medium / totalPredictions) * 100}%`
                    }}
                  />

                  <div
                    className="risk-bar-high"
                    style={{
                      width: `${(riskCounts.high / totalPredictions) * 100}%`
                    }}
                  />
                </div>

                <div className="risk-legend">
                  <span><i className="low-dot"></i> Low Risk</span>
                  <span><i className="medium-dot"></i> Medium Risk</span>
                  <span><i className="high-dot"></i> High Risk</span>
                </div>
              </>
            ) : (
              <>
                <div className="empty-state-icon">
                  <Gauge size={32} />
                </div>

                <h3>
                  {latestAnalysis
                    ? "No ML Risk Predictions Available"
                    : "No Risk Data Available"}
                </h3>

                <p>
                  {latestAnalysis
                    ? "ML risk predictions are currently available for Python files only."
                    : "Risk distribution and analysis insights will appear here after you analyze a repository."}
                </p>

                <div className="risk-legend">
                  <span><i className="low-dot"></i> Low Risk</span>
                  <span><i className="medium-dot"></i> Medium Risk</span>
                  <span><i className="high-dot"></i> High Risk</span>
                </div>
              </>
            )}

          </div>
        </section>
        {/* File-Level Risk Breakdown */}
        <section className="dashboard-section">

          <div className="dashboard-section-heading">
            <div>
              <h2>
                <AlertTriangle size={21} />
                File-Level Risk Breakdown
              </h2>

              <p>
                Identify source files with potential defect risks
              </p>
            </div>

            <span className="section-tag">
              {riskFiles.length} FILES
            </span>
          </div>

          <div className="dashboard-panel file-risk-panel">

            {riskFiles.length > 0 ? (
              <>
              <div className="file-risk-list">

                {riskFiles.map((file: any, index: number) => {
                  const risk = file.ml_prediction.risk_level;
                  const probability =
                    Number(file.ml_prediction.defect_probability);

                  return (
                    <button
                      type="button"
                      className="file-risk-item"
                      key={file.path || index}
                      onClick={() => setSelectedFile(file)}
                    >

                      <div className="file-risk-info">
                        <div className="file-risk-icon">
                          <FolderGit2 size={19} />
                        </div>

                        <div className="file-risk-details">
                          <h4>{file.path}</h4>

                          <p>
                            {file.language || "Source file"}
                          </p>
                        </div>
                      </div>

                      <div className="file-risk-result">

                        <span
                          className={`file-risk-badge ${risk.toLowerCase()}-risk`}
                        >
                          {risk} Risk
                        </span>

                        <span className="file-risk-probability">
                          {(probability * 100).toFixed(1)}%
                        </span>

                      </div>

                    </button>
                  );
                })}

              </div>
              {selectedFile && (
                <div className="selected-file-details">

                  <div className="selected-file-heading">
                    <div>
                      <h3>{selectedFile.path}</h3>
                      <p>{selectedFile.language} source file</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="selected-file-stats">
                    <div>
                      <span>Predicted Risk</span>
                      <strong>
                        {selectedFile.ml_prediction.risk_level}
                      </strong>
                    </div>

                    <div>
                      <span>Defect Probability</span>
                      <strong>
                        {(Number(
                          selectedFile.ml_prediction.defect_probability
                        ) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  <h4>Code Metrics</h4>

                  <div className="file-metrics-grid">
                    {Object.entries(selectedFile.metrics ?? {})
                      .slice(0, 8)
                      .map(([name, value]) => (
                        <div key={name}>
                          <span>{name}</span>
                          <strong>{String(value)}</strong>
                        </div>
                      ))}
                  </div>

                  {selectedFile.ml_prediction.recommendations?.length > 0 && (
                    <>
                      <h4>Suggested Improvements</h4>
                      <ul>
                        {selectedFile.ml_prediction.recommendations.map(
                          (item: string, index: number) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </>
                  )}

                </div>
              )}
            </>
              
            ) : (
              <div className="file-risk-empty">
                <Gauge size={30} />

                <h3>No File-Level Risk Data</h3>

                <p>
                  Analyze a repository containing Python files
                  to view ML defect-risk predictions.
                </p>
              </div>
            )}

          </div>

        </section>




        {/* Recommendations */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>
                <Sparkles size={21} />
                Code Quality Recommendations
              </h2>
              <p>Suggestions to improve your codebase</p>
            </div>

            <span className="ai-label">ANALYSIS BASED</span>
          </div>

          <div className="dashboard-panel recommendation-panel">
            <div className="recommendation-icon">
              <Sparkles size={25} />
            </div>

            <div>
              {recommendations.length > 0 ? (
                <>
                  <h3>Recommended Improvements</h3>

                  <ul>
                    {recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h3>
                    {latestAnalysis
                      ? "No ML Recommendations Available"
                      : "Analysis Recommendations Will Appear Here"}
                  </h3>

                  <p>
                    {latestAnalysis
                      ? "No metric-based ML recommendations were returned for the analyzed Python files."
                      : "CodeGuardian AI will provide recommendations after repository analysis."}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>
                <Clock3 size={21} />
                Recent Activity
              </h2>
              <p>Your latest software analysis activities</p>
            </div>
          </div>

          <div className="dashboard-panel activity-panel">

            {latestAnalysis ? (
              <>
                <div className="activity-empty-icon">
                  <GitBranch size={27} />
                </div>

                <h3>Repository Analysis Completed</h3>

                <p>{repositoryName}</p>

                <p>
                  {analyzedDate || "Analysis date unavailable"}
                </p>

                <p>
                  {latestAnalysis.analyzedFileCount} files analyzed
                </p>
              </>
            ) : (
              <>
                <div className="activity-empty-icon">
                  <GitBranch size={27} />
                </div>

                <h3>No Recent Activity</h3>

                <p>
                  Your repository analysis history will be displayed here.
                </p>
              </>
            )}

          </div>
        </section>

        {/* Footer */}
        <footer className="dashboard-footer">
          <span>CodeGuardian AI</span>
          <span>Intelligent Software Risk Analysis</span>
        </footer>

      </main>
    </div>
  );
}

export default Dashboard;