import Navbar from "../components/Navbar";
import {
  History as HistoryIcon,
  Clock,
  Activity,
  TrendingUp,
  FileClock,
  FolderGit2,
} from "lucide-react";
import { useAnalysis } from "../context/AnalysisContext";
import "./History.css";
import { useState} from "react";

function History() {
  const { analysisHistory } = useAnalysis();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const totalAnalyses = analysisHistory.length;
  const latest = analysisHistory[0];

  const latestHealth =
    latest?.scores?.software_health_score ?? "--";

  const riskTrend =
    analysisHistory.length >= 2
      ? Number(latest?.scores?.risk_score) >
        Number(analysisHistory[1]?.scores?.risk_score)
        ? "Increasing"
        : Number(latest?.scores?.risk_score) <
          Number(analysisHistory[1]?.scores?.risk_score)
        ? "Decreasing"
        : "Stable"
      : "--";

  return (
    <div className="history-page">
      <Navbar />

      <main className="history-content">

        <div className="history-header">
          <div className="history-title">
            <HistoryIcon size={30} />
            <h1>Analysis History</h1>
          </div>

          <p>
            Track how your software health changes across repository analyses.
          </p>
        </div>

        <div className="history-summary">

          <div className="history-summary-card">
            <div className="history-card-heading">
              <Clock size={21} />
              <span>Total Analyses</span>
            </div>
            <strong>{totalAnalyses}</strong>
          </div>

          <div className="history-summary-card">
            <div className="history-card-heading">
              <Activity size={21} />
              <span>Latest Health Score</span>
            </div>
            <strong>
              {latestHealth}
              {typeof latestHealth === "number" ? "/100" : ""}
            </strong>
          </div>

          <div className="history-summary-card">
            <div className="history-card-heading">
              <TrendingUp size={21} />
              <span>Risk Trend</span>
            </div>
            <strong>{riskTrend}</strong>
          </div>

        </div>

        <section className="history-section">

          <div className="section-heading">
            <h2>
              <FileClock size={22} />
              Previous Analyses
            </h2>
            <span>Repository history</span>
          </div>

          <div className="history-panel">

            {analysisHistory.length > 0 ? (
              <div className="history-list">

                {analysisHistory.map((item: any, index: number) => {

                  const scores = item.scores ?? {};

                  const repositoryName =
                    item.full_name ||
                    item.repositoryInfo?.full_name ||
                    item.name ||
                    item.repositoryInfo?.name ||
                    item.repositoryUrl?.replace("https://github.com/", "") ||
                    "Unknown repository";

                  return (
                    <div className="history-item" key={`${item.analyzedAt}-${index}`}>

                      <div className="history-item-icon">
                        <FolderGit2 size={25} />
                      </div>

                      <div className="history-item-details">
                        <h3>{repositoryName}</h3>

                        <p>
                          {item.analyzedAt
                            ? new Date(item.analyzedAt).toLocaleString()
                            : "Date unavailable"}
                        </p>

                        <div className="history-item-scores">
                          <span>
                            Health: {scores.software_health_score ?? "--"}
                          </span>

                          <span>
                            Debt: {scores.technical_debt_score ?? "--"}
                          </span>

                          <span>
                            Risk: {scores.risk_score ?? "--"}
                          </span>
                        </div>

                        <small>
                          {item.analyzedFileCount ?? 0} files analyzed
                        </small>
                        <button
                          type="button"
                          className="history-details-button"
                          onClick={() =>
                            setExpandedIndex(
                              expandedIndex === index ? null : index
                            )
                          }
                        >
                          {expandedIndex === index ? "Hide Details ↑" : "View Details →"}
                        </button>

                        {expandedIndex === index && (
                          <div className="history-expanded-details">

                            <h4>Repository Analysis Details</h4>

                            <p>
                              <strong>Repository URL:</strong>{" "}
                              {item.repositoryUrl || "Not available"}
                            </p>

                            <p>
                              <strong>Software Health:</strong>{" "}
                              {scores.software_health_score ?? "--"}/100
                            </p>

                            <p>
                              <strong>Technical Debt:</strong>{" "}
                              {scores.technical_debt_score ?? "--"}/100
                            </p>

                            <p>
                              <strong>Risk Score:</strong>{" "}
                              {scores.risk_score ?? "--"}/100
                            </p>

                            <p>
                              <strong>Files Analyzed:</strong>{" "}
                              {item.analyzedFileCount ?? 0}
                            </p>

                            <p>
                              <strong>Analysis Date:</strong>{" "}
                              {item.analyzedAt
                                ? new Date(item.analyzedAt).toLocaleString()
                                : "Not available"}
                            </p>

                          </div>
                        )}



                      </div>

                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="empty-history">
                <div className="empty-icon">
                  <FolderGit2 size={38} />
                </div>

                <h3>No analysis history yet</h3>

                <p>
                  Once you analyze a repository, CodeGuardian will store
                  previous results here so you can compare software health,
                  technical debt, and risk over time.
                </p>
              </div>
            )}

          </div>

        </section>

      </main>
    </div>
  );
}

export default History;