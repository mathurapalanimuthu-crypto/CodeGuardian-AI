import { useState } from "react";
import Navbar from "../components/Navbar";
import {
  analyzeRepository,
  reviewCodeWithAI,
  downloadAnalysisPDF,
} from "../services/api";
import "./Repository.css";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  GitBranch,
  GitCompareArrows,
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  ChartPie,
  Download,
  BrainCircuit,
  ListChecks,
} from "lucide-react";

import { useAnalysis } from "../context/AnalysisContext";

type AIReviewFinding = {
  category: string;
  severity: string;
  line: number | null;
  title: string;
  explanation: string;
  recommendation: string;
  suggested_code: string | null;
};

type AIReviewData = {
  summary: string;
  overall_quality: string;
  findings: AIReviewFinding[];
  testing_suggestions: string[];
};

function Repository() {

  const { setLatestAnalysis } = useAnalysis();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [message, setMessage] = useState("");
  const [repositoryInfo, setRepositoryInfo] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [compareUrl, setCompareUrl] = useState("");
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  const [reviewFilename, setReviewFilename] = useState("example.py");
  const [reviewCode, setReviewCode] = useState("");
  const [aiReview, setAiReview] = useState<AIReviewData | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState("");

  const handleAnalysis = async () => {
    if (!repositoryUrl.trim()) {
      setMessage("Please enter a GitHub repository URL.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Analyzing GitHub repository...");
      setRepositoryInfo(null);
      setAnalysisResults(null);

      const result = await analyzeRepository(repositoryUrl);

      if (result.status === "ready") {
        setMessage("Repository analysis completed successfully.");
        setRepositoryInfo(result.repository_info);

        setAnalysisResults({
          metrics: result.repository_metrics,
          scores: result.scores,
          fileCount: result.file_count,
          sourceFileCount: result.source_file_count,
          analyzedFileCount: result.analyzed_file_count,
          files: result.files,
        });

      setLatestAnalysis({
        repositoryInfo: result.repository_info,
        repositoryUrl: result.repository_url,
        metrics: result.repository_metrics,
        scores: result.scores,
        fileCount: result.file_count,
        sourceFileCount: result.source_file_count,
        analyzedFileCount: result.analyzed_file_count,
        files: result.files,
        analyzedAt: new Date().toISOString(),
        });

      } else {
        setMessage(result.message || "Unable to analyze repository.");
      }
    } catch (error) {
      console.error("Repository Analysis Error:", error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("An unknown error occurred during analysis.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleComparison = async () => {
    if (!repositoryUrl.trim() || !compareUrl.trim()) {
      setMessage("Enter both repository URLs before comparing.");
      return;
    }

    if (repositoryUrl.trim() === compareUrl.trim()) {
      setMessage("Enter two different repository URLs.");
      return;
    }

    try {
      setComparing(true);
      setMessage("Analyzing repositories for comparison...");
      setComparisonResults(null);

      const [first, second] = await Promise.all([
        analyzeRepository(repositoryUrl),
        analyzeRepository(compareUrl),
      ]);

      if (first.status !== "ready" || second.status !== "ready") {
        setMessage("Both repositories must analyze successfully.");
        return;
      }

      setComparisonResults({
        first: {
          name: first.repository_info?.full_name || repositoryUrl,
          scores: first.scores,
          metrics: first.repository_metrics,
        },
        second: {
          name: second.repository_info?.full_name || compareUrl,
          scores: second.scores,
          metrics: second.repository_metrics,
        },
      });

      setMessage("Repository comparison completed.");
    } catch {
      setMessage("Unable to compare repositories. Check the backend connection.");
    } finally {
      setComparing(false);
    }
  };
 const findings: { path: string; message: string }[] = (
    analysisResults?.files ?? []
  ).flatMap((file: any) => {
    const fileFindings: string[] = [];

    const complexity = Number(
      file.complexity?.cyclomatic_complexity ?? 0
    );

    const longLines = Number(file.metrics?.long_lines ?? 0);
    const todoCount = Number(file.metrics?.todo_count ?? 0);

    if (complexity >= 10) {
      fileFindings.push(
        "High cyclomatic complexity: review the code structure."
      );
    }

    if (longLines > 0) {
      fileFindings.push(
        `${longLines} long line(s): consider improving readability.`
      );
    }

    if (todoCount > 0) {
      fileFindings.push(
        `${todoCount} TODO/FIXME comment(s): review pending work.`
      );
    }

    if (
      file.ml_prediction?.risk_level?.toLowerCase() === "high"
    ) {
      fileFindings.push(
        "ML model estimates high defect risk: review and test this file."
      );
    }

    return fileFindings.map((message: string) => ({
      path: file.path,
      message,
    }));
  });
  
  const riskDistribution = [
    {
      name: "High Risk",
      value: (analysisResults?.files ?? []).filter(
        (file: any) =>
          file.ml_prediction?.risk_level?.toLowerCase() === "high"
      ).length,
      color: "#ef4444",
    },
    {
      name: "Medium Risk",
      value: (analysisResults?.files ?? []).filter(
        (file: any) =>
          file.ml_prediction?.risk_level?.toLowerCase() === "medium"
      ).length,
      color: "#f59e0b",
    },
    {
      name: "Low Risk",
      value: (analysisResults?.files ?? []).filter(
        (file: any) =>
          file.ml_prediction?.risk_level?.toLowerCase() === "low"
      ).length,
      color: "#22c55e",
    },
  ];

  const predictedFileCount = (analysisResults?.files ?? []).filter(
  (file: any) =>
    ["high", "medium", "low"].includes(
      file.ml_prediction?.risk_level?.toLowerCase()
    )
  ).length;
  const priorityRecommendations = (analysisResults?.files ?? [])
    .flatMap((file: any) => {
      const recommendations: {
        path: string;
        priority: string;
        issue: string;
        action: string;
      }[] = [];

      const complexity = Number(
        file.complexity?.cyclomatic_complexity ?? 0
      );
      const longLines = Number(file.metrics?.long_lines ?? 0);
      const todoCount = Number(file.metrics?.todo_count ?? 0);
      const risk = file.ml_prediction?.risk_level?.toLowerCase();

      if (risk === "high") {
        recommendations.push({
          path: file.path,
          priority: "High",
          issue: "High estimated ML defect risk",
          action: "Review the code and add targeted tests.",
        });
      }

      if (complexity >= 10) {
        recommendations.push({
          path: file.path,
          priority: "High",
          issue: `High cyclomatic complexity (${complexity})`,
          action: "Simplify complex logic and split large functions.",
        });
      }

      if (todoCount > 0) {
        recommendations.push({
          path: file.path,
          priority: "Medium",
          issue: `${todoCount} TODO/FIXME comment(s)`,
          action: "Review pending tasks and resolve them where appropriate.",
        });
      }

      if (longLines > 0) {
        recommendations.push({
          path: file.path,
          priority: "Low",
          issue: `${longLines} long line(s)`,
          action: "Improve formatting and readability.",
        });
      }

      return recommendations;
    })
    .sort((a: any, b: any) => {
      const order: Record<string, number> = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      return order[a.priority] - order[b.priority];
    });

    const downloadReport = () => {
    if (!analysisResults) return;

    const reportLines: string[] = [
      "CODEGUARDIAN AI - REPOSITORY ANALYSIS REPORT",
      "============================================",
      "",
      `Repository: ${repositoryInfo?.full_name || "Unknown"}`,
      `Description: ${repositoryInfo?.description || "Not available"}`,
      `Language: ${repositoryInfo?.language || "Not specified"}`,
      "",
      "SOFTWARE HEALTH RESULTS",
      "-----------------------",
      `Software Health Score: ${analysisResults.scores.software_health_score}/100`,
      `Technical Debt Score: ${analysisResults.scores.technical_debt_score}/100`,
      `Risk Score: ${analysisResults.scores.risk_score}/100`,
      `Overall Risk Level: ${analysisResults.scores.risk_level}`,
      "",
      "REPOSITORY METRICS",
      "------------------",
      `Total files: ${analysisResults.fileCount}`,
      `Source files: ${analysisResults.sourceFileCount}`,
      `Files analyzed: ${analysisResults.analyzedFileCount}`,
      `Total lines: ${analysisResults.metrics.total_lines}`,
      `Code lines: ${analysisResults.metrics.code_lines}`,
      `Functions: ${analysisResults.metrics.function_count}`,
      `Classes: ${analysisResults.metrics.class_count}`,
      `TODO/FIXME comments: ${analysisResults.metrics.todo_count}`,
      `Long lines: ${analysisResults.metrics.long_lines}`,
      "",
      "ML RISK DISTRIBUTION",
      "--------------------",
      ...riskDistribution.map(
        (item) => `${item.name}: ${item.value} file(s)`
      ),
      `Files with ML predictions: ${predictedFileCount}`,
      "",
      "CODE QUALITY FINDINGS",
      "---------------------",
      ...(findings.length
        ? findings.map(
            (item) => `[${item.path}] ${item.message}`
          )
        : ["No warnings detected by the current checks."]),
      "",
      "PRIORITY-BASED RECOMMENDATIONS",
      "------------------------------",
      ...(priorityRecommendations.length
        ? priorityRecommendations.map(
            (item: any) =>
              `[${item.priority}] ${item.path}\nIssue: ${item.issue}\nAction: ${item.action}`
          )
        : ["No recommendations generated."]),
      "",
      "ANALYZED SOURCE FILES",
      "---------------------",
      ...(analysisResults.files ?? []).map((file: any) => {
        const prediction = file.ml_prediction;

        return [
          `File: ${file.path}`,
          `Size: ${file.size} bytes`,
          `Lines: ${file.metrics?.total_lines ?? 0}`,
          `Functions: ${file.metrics?.function_count ?? 0}`,
          `Cyclomatic complexity: ${file.complexity?.cyclomatic_complexity ?? "N/A"}`,
          `ML prediction: ${
            prediction
              ? prediction.prediction
                ? "Potential Defect"
                : "No Defect Predicted"
              : "Not available"
          }`,
          `ML risk level: ${prediction?.risk_level ?? "N/A"}`,
          "",
        ].join("\n");
      }),
      "",
      "Note: ML predictions and rule-based findings are estimates.",
      "They do not confirm the presence or absence of real defects.",
    ];

    const reportContent = reportLines.join("\n");
    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const repositoryName = (
      repositoryInfo?.full_name || "repository"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    link.href = url;
    link.download = `CodeGuardian_${repositoryName}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const comparisonChartData = comparisonResults
    ? [
        {
          metric: "Software Health",
          first: Number(
            comparisonResults.first.scores.software_health_score
          ),
          second: Number(
            comparisonResults.second.scores.software_health_score
          ),
        },
        {
          metric: "Technical Debt",
          first: Number(
            comparisonResults.first.scores.technical_debt_score
          ),
          second: Number(
            comparisonResults.second.scores.technical_debt_score
          ),
        },
        {
          metric: "Risk Score",
          first: Number(
            comparisonResults.first.scores.risk_score
          ),
          second: Number(
            comparisonResults.second.scores.risk_score
          ),
        },
      ]
    : [];

      const analysisExplanation = analysisResults
    ? (() => {
        const health = Number(
          analysisResults.scores.software_health_score
        );
        const debt = Number(
          analysisResults.scores.technical_debt_score
        );
        const risk = Number(
          analysisResults.scores.risk_score
        );

        const explanations: string[] = [];

        if (health >= 80) {
          explanations.push(
            "Software health score is high according to the current scoring rules. Continue regular code reviews and testing."
          );
        } else if (health >= 60) {
          explanations.push(
            "Software health score is moderate. Review the reported findings and look for opportunities to improve maintainability."
          );
        } else {
          explanations.push(
            "Software health score is low. Review complex code, reported warnings, and testing coverage before making changes."
          );
        }

        if (debt >= 70) {
          explanations.push(
            "The technical debt score is high. Review the backend scoring definition, then prioritize maintainability improvements."
          );
        } else if (debt >= 40) {
          explanations.push(
            "The technical debt score is moderate. Review maintenance warnings and TODO/FIXME comments."
          );
        } else {
          explanations.push(
            "The technical debt score is relatively low under the current scoring rules. Continue monitoring code quality."
          );
        }

        if (risk >= 70) {
          explanations.push(
            "The estimated risk score is high. Prioritize code review and targeted testing for files flagged by the analysis."
          );
        } else if (risk >= 40) {
          explanations.push(
            "The estimated risk score is moderate. Review ML predictions and complexity warnings."
          );
        } else {
          explanations.push(
            "The estimated risk score is relatively low under the current scoring rules. Continue routine testing and review."
          );
        }

        return explanations;
      })()
    : [];const codeReviewAssistant = (analysisResults?.files ?? [])
    .map((file: any) => {
      const suggestions: string[] = [];

      const complexity = Number(
        file.complexity?.cyclomatic_complexity ?? 0
      );
      const longLines = Number(file.metrics?.long_lines ?? 0);
      const todoCount = Number(file.metrics?.todo_count ?? 0);
      const risk = file.ml_prediction?.risk_level?.toLowerCase();

      if (complexity >= 10) {
        suggestions.push(
          "Review complex functions and consider simplifying their logic."
        );
      }

      if (longLines > 0) {
        suggestions.push(
          `Review ${longLines} long line(s) to improve readability.`
        );
      }

      if (todoCount > 0) {
        suggestions.push(
          `Review ${todoCount} TODO/FIXME comment(s) and resolve pending work where appropriate.`
        );
      }

      if (risk === "high") {
        suggestions.push(
          "The ML model estimates high defect risk. Review the code and add targeted tests."
        );
      }

      if (suggestions.length === 0) {
        return null;
      }

      return {
        path: file.path,
        suggestions,
      };
    })
    .filter((item: any) => item !== null);

    const handleDownloadPDF = async () => {
  if (!analysisResults) {
    alert("Please analyze a repository first.");
    return;
  }

  try {
    const reportData = {
      repositoryInfo,
      repositoryUrl:
        repositoryInfo?.html_url || repositoryUrl,
      selectedSourceFilename: reviewFilename || "Not selected",
      analysisResults,
      findings,
      riskDistribution,
      priorityRecommendations,
      codeReviewAssistant,
      analysisExplanation,
      aiReview,
};

    const blob = await downloadAnalysisPDF(reportData);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "CodeGuardian_Analysis_Report.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF download error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Unable to download the PDF report."
    );
  }
};


    const handleAIReview = async () => {
  if (!reviewCode.trim()) {
    setAiReviewError("Please paste source code first.");
    return;
  }

  try {
    setAiReviewLoading(true);
    setAiReviewError("");
    setAiReview(null);

    const result = await reviewCodeWithAI(
      reviewFilename,
      reviewCode
    );

    const parsedReview: AIReviewData =
      typeof result.review === "string"
        ? JSON.parse(result.review)
        : result.review;

    setAiReview(parsedReview);
  } catch (error) {
    setAiReviewError(
      error instanceof Error
        ? `Unable to display AI review: ${error.message}`
        : "AI review failed."
    );
  } finally {
    setAiReviewLoading(false);
  }
};




  return (
    <div className="repository-page">
      <Navbar />

      <main className="repository-content">
        <div className="repository-header">
          <h2 className="section-title">
            <GitBranch size={22} />
            Repository Analysis
          </h2>
          <p>
            Connect a GitHub repository and analyze its software
            health, technical debt, and software risk.
          </p>
        </div>

        <div className="repository-card">
          <h2>Analyze a Repository</h2>
          <p>
            Enter the public GitHub repository URL you want
            CodeGuardian AI to analyze.
          </p>

          <input
            className="repository-input"
            type="text"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            placeholder="https://github.com/username/repository"
          />

          <button
            className="repository-button"
            onClick={handleAnalysis}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Start Analysis →"}
          </button>

          {message && (
            <div className="repository-message">{message}</div>
          )}
        </div>
        <div className="repository-card">
        <h2 className="section-title">
          <GitCompareArrows size={22} />
           Compare Two Repositories
        </h2>
        <p>
        Enter the second public GitHub repository URL. The first
        repository uses the URL entered above.
        </p>

        <input
        className="repository-input"
        type="text"
        value={compareUrl}
        onChange={(event) => setCompareUrl(event.target.value)}
        placeholder="https://github.com/owner/another-repository"
        />

        <button
        className="repository-button"
        type="button"
        onClick={handleComparison}
        disabled={comparing || loading}
        >
        {comparing ? "Comparing..." : "Compare Repositories"}
        </button>
        </div>

        {repositoryInfo && (
          <section className="repository-info">
            <h3>Repository Information</h3>
            <div className="repository-details">
              <div>
                <span>Repository</span>
                <strong>{repositoryInfo.full_name}</strong>
              </div>
              <div>
                <span>Description</span>
                <strong>
                  {repositoryInfo.description || "No description available"}
                </strong>
              </div>
              <div>
                <span>Primary Language</span>
                <strong>{repositoryInfo.language || "Not specified"}</strong>
              </div>
              <div>
                <span>Default Branch</span>
                <strong>{repositoryInfo.default_branch}</strong>
              </div>
              <div>
                <span>Stars</span>
                <strong>{repositoryInfo.stars}</strong>
              </div>
              <div>
                <span>Forks</span>
                <strong>{repositoryInfo.forks}</strong>
              </div>
              <div>
                <span>Open Issues</span>
                <strong>{repositoryInfo.open_issues}</strong>
              </div>
              <div>
                <span>Repository Size</span>
                <strong>{repositoryInfo.size_kb} KB</strong>
              </div>
            </div>
          </section>
        )}

        {analysisResults && (
          <>
            <section className="repository-info">
             <h2 className="section-title">
              <ShieldCheck size={22} />
               Software Health Summary
            </h2>

            <div className="repository-details">
            <div>
            <span>Repository</span>
            <strong>
            {repositoryInfo?.full_name || "Unknown"}
            </strong>
            </div>

            <div>
            <span>Total Files</span>
            <strong>{analysisResults?.fileCount ?? 0}</strong>
            </div>

            <div>
            <span>Source Files</span>
            <strong>{analysisResults?.sourceFileCount ?? 0}</strong>
            </div>

            <div>
            <span>Files Analyzed</span>
            <strong>{analysisResults?.analyzedFileCount ?? 0}</strong>
            </div>

            <div>
            <span>Files with ML Predictions</span>
            <strong>
              {(analysisResults?.files ?? []).filter(
              (file: any) => file.ml_prediction
              ).length}
           </strong>
           </div>
           </div>
          </section>  
            <section className="repository-info">
              <h3>CodeGuardian AI Results</h3>
              <div className="repository-score-grid">
                <div className="repository-score-card">
                  <span>Software Health</span>
                  <strong>
                    {analysisResults.scores.software_health_score}
                  </strong>
                  <small>/ 100</small>
                </div>
                <div className="repository-score-card">
                  <span>Technical Debt</span>
                  <strong>
                    {analysisResults.scores.technical_debt_score}
                  </strong>
                  <small>/ 100</small>
                </div>
                <div className="repository-score-card">
                  <span>Risk Level</span>
                  <strong>{analysisResults.scores.risk_level}</strong>
                </div>
              </div>

              <div className="repository-info">
            <h3>Analysis Explanation</h3>

            <p>
            These explanations interpret the current scores using
            predefined rules; they are not generated by a language model.
            </p>

            <div className="analyzed-files">
              {analysisExplanation.map(
                (explanation: string, index: number) => (
            <div className="analyzed-file" key={index}>
              <p>{explanation}</p>
            </div>
            )
            )}
            </div>  
            </div>

      <div className="report-download-buttons">
        <button
            className="repository-button"
            type="button"
            onClick={handleDownloadPDF}
         >
           <Download size={18} />
          Download PDF Report
       </button>

       <button
          className="repository-button"
          type="button"
          onClick={downloadReport}
        >
       <Download size={18} />
           Download TXT Report
      </button>
    </div>

            </section>

            <section className="repository-info">
              <h2 className="section-title">
                <FileCode2 size={22} />
                Repository Code Metrics
              </h2>
              <div className="repository-details">
                <div>
                  <span>Total Files</span>
                  <strong>{analysisResults.fileCount}</strong>
                </div>
                <div>
                  <span>Source Files</span>
                  <strong>{analysisResults.sourceFileCount}</strong>
                </div>
                <div>
                  <span>Files Analyzed</span>
                  <strong>{analysisResults.analyzedFileCount}</strong>
                </div>
                <div>
                  <span>Total Lines</span>
                  <strong>{analysisResults.metrics.total_lines}</strong>
                </div>
                <div>
                  <span>Code Lines</span>
                  <strong>{analysisResults.metrics.code_lines}</strong>
                </div>
                <div>
                  <span>Functions</span>
                  <strong>{analysisResults.metrics.function_count}</strong>
                </div>
                <div>
                  <span>Classes</span>
                  <strong>{analysisResults.metrics.class_count}</strong>
                </div>
                <div>
                  <span>TODO / FIXME</span>
                  <strong>{analysisResults.metrics.todo_count}</strong>
                </div>
                <div>
                  <span>Long Lines</span>
                  <strong>{analysisResults.metrics.long_lines}</strong>
                </div>
                <div>
                  <span>Average Complexity</span>
                  <strong>
                    {analysisResults.metrics.average_cyclomatic_complexity}
                  </strong>
                </div>
                <div>
                  <span>Maximum Complexity</span>
                  <strong>
                    {analysisResults.metrics.maximum_cyclomatic_complexity}
                  </strong>
                </div>
                <div>
                  <span>High Complexity Blocks</span>
                  <strong>
                    {analysisResults.metrics.high_complexity_blocks}
                  </strong>
                </div>
              </div>
            </section>
            <section className="repository-info">
              <h2 className="section-title">
                <AlertTriangle size={22} />
                  Code Quality Findings
              </h2>

              {findings.length === 0 ? (
                <p>
                  No warnings were detected by the current checks
                  for the analyzed files.
                </p>
              ) : (
                <div className="analyzed-files">
                  {findings.map((finding, index) => (
                    <div
                      className="analyzed-file"
                      key={`${finding.path}-${index}`}
                    >
                      <strong>{finding.path}</strong>
                      <p>{finding.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="repository-info">
              <h2 className="section-title">
              <ChartPie size={22} />
                ML Risk Distribution
              </h2>
              <p>
                Risk levels among files with available ML predictions.
              </p>

              {predictedFileCount === 0 ? (
                <p>No ML risk predictions are available to display.</p>
              ) : (
                <>
                  <div className="repository-score-grid">
                    {riskDistribution.map((item) => (
                      <div
                        className="repository-score-card"
                        key={item.name}
                      >
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 320,
                      marginTop: 20,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskDistribution.filter(
                            (item) => item.value > 0
                          )}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label
                        >
                          {riskDistribution
                            .filter((item) => item.value > 0)
                            .map((item) => (
                              <Cell
                                key={item.name}
                                fill={item.color}
                              />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <p>
                    Files with ML predictions: {predictedFileCount}
                  </p>
                </>
              )}
            </section>
            
            <section className="repository-info">
            <h2 className="section-title">
              <ListChecks size={22} />
                Priority Based Recommendations
           </h2>
            <p>
            Suggested actions ordered by priority using the current
            code checks and available ML predictions.
            </p>

            {priorityRecommendations.length === 0 ? (
            <p>No recommendations were generated by the current checks.</p>
            ) : (
            <div className="analyzed-files">
            {priorityRecommendations.map((item: any, index: number) => (
            <div className="analyzed-file" key={`${item.path}-${index}`}>
            <div>
            <strong>{item.path}</strong>
            <span>Priority: {item.priority}</span>
            </div>
            <p>{item.issue}</p>
            <p>
            <strong>Recommended action:</strong> {item.action}
            </p>
            </div>
            ))}
            </div>
            )}
            </section>

            <section className="repository-info">
              <h3>Code Review Assistant</h3>

             <p>
                File-specific suggestions based on code metrics,
                quality checks, and available ML predictions.
              </p>

              {codeReviewAssistant.length === 0 ? (
                <p>
                  No review suggestions were generated by the current checks.
                </p>
              ) : (
                <div className="analyzed-files">
                  {codeReviewAssistant.map((item: any, index: number) => (
                    <div
                      className="analyzed-file"
                      key={`${item.path}-${index}`}
                    >
                    <strong>{item.path}</strong>

                    {item.suggestions.map(
                      (suggestion: string, suggestionIndex: number) => (
                        <p key={suggestionIndex}>
                          • {suggestion}
                       </p>
                     )
                    )}  
                    </div>
                  ))}
                </div>
              )}

              <p>
                These are rule-based suggestions, not verified bug detections
                or AI-generated conclusions.
             </p>
            </section>
            <section className="repository-info">
              <h3>Analyzed Source Files</h3>

              <div className="analyzed-files">
                {analysisResults.files.map(
                  (file: any, index: number) => (
                    <div className="analyzed-file" key={index}>
                      <div>
                        <strong>{file.path}</strong>
                        <span>{file.size} bytes</span>
                      </div>

                      <div className="file-metrics">
                        <span>
                          Lines: {file.metrics.total_lines}
                        </span>
                        <span>
                          Functions: {file.metrics.function_count}
                        </span>
                        <span>
                          Complexity:{" "}
                          {file.complexity.cyclomatic_complexity}
                        </span>
                      </div>

                      {file.ml_prediction && (
                        <div className="file-ml-results">
                          <h4>ML Defect Prediction</h4>

                          <div className="file-metrics">
                            <span>
                              Prediction:{" "}
                              {file.ml_prediction.prediction
                                ? "Potential Defect"
                                : "No Defect Predicted"}
                            </span>

                            <span>
                              Defect Probability:{" "}
                              {(
                                file.ml_prediction.defect_probability *
                                100
                              ).toFixed(2)}
                              %
                            </span>

                            <span>
                              Risk Level:{" "}
                              {file.ml_prediction.risk_level}
                            </span>
                          </div>

                          <div className="file-recommendations">
                            <strong>Recommendations</strong>

                            {file.ml_prediction.recommendations.map(
                              (
                                recommendation: string,
                                recommendationIndex: number
                              ) => (
                                <p key={recommendationIndex}>
                                  • {recommendation}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}
        {comparisonResults && (
        <section className="repository-info">
        <h3>Repository Comparison Results</h3>

        <div className="repository-details">
        <div>
        <span>Metric</span>
        <strong>First Repository</strong>
        <p>{comparisonResults.first.name}</p>
        </div>
        <div>
        <span>Metric</span>
        <strong>Second Repository</strong>
        <p>{comparisonResults.second.name}</p>
        </div>
        </div>

        {[
        {
        label: "Software Health Score",
        key: "software_health_score",
        },
        {
        label: "Technical Debt Score",
        key: "technical_debt_score",
        },
        { label: "Risk Score", key: "risk_score" },
        ].map((metric) => (
        <div className="analyzed-file" key={metric.key}>
        <strong>{metric.label}</strong>
        <div className="file-metrics">
          <span>
            First: {comparisonResults.first.scores[metric.key] ?? "N/A"}
          </span>
          <span>
            Second: {comparisonResults.second.scores[metric.key] ?? "N/A"}
          </span>
        </div>
        </div>
        ))}
        <h3>Visual Score Comparison</h3>

<div
  style={{
    width: "100%",
    height: 350,
    marginTop: 20,
  }}
>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={comparisonChartData}
      margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="metric" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Legend />
      <Bar
        dataKey="first"
        name={comparisonResults.first.name}
        fill="#3b82f6"
        radius={[4, 4, 0, 0]}
      />
      <Bar
        dataKey="second"
        name={comparisonResults.second.name}
        fill="#a78bfa"
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
</div>

        <p>
        Scores are estimates based on the current analysis. Interpret
        technical debt according to your backend's scoring definition.
        </p>
        </section>
        )}
        <section className="ai-reviewer">
        <h2 className="section-title">
         <BrainCircuit size={22} />
          Code Review Assistant
        </h2>
        <p>
        Analyze your source code using Google Gemini AI
        Get suggestions for potential bugs, security, and code quality.
        </p>

        <label htmlFor="source-file-select">
          Select an analyzed source file
        </label>

        <p>Files received: {analysisResults?.files?.length ?? 0}</p>

        <select
          id="source-file-select"
          value={reviewFilename}
          onChange={(event) => {
          const selectedPath = event.target.value;

          const selectedFile = (analysisResults?.files ?? []).find(
          (file: any) => file.path === selectedPath
          );

          setReviewFilename(selectedPath);
          setReviewCode(selectedFile?.content ?? "");
          setAiReview(null);
          setAiReviewError(
          selectedFile && !selectedFile.content
          ? "Source code is not available for this file."
          : ""
          );
          }}
        >
        <option value="">Choose a source file...</option>

          {(analysisResults?.files ?? []).map((file: any) => (
          <option key={file.path} value={file.path}>
           {file.path}
          </option>
        ))}
      </select>

      <label htmlFor="review-code">
      Source code
      </label>

      <textarea
      id="review-code"
      value={reviewCode}
      onChange={(event) => setReviewCode(event.target.value)}
      placeholder="Select a file to load its source code..."
      rows={12}
      spellCheck={false}
      />


        <button
        type="button"
        onClick={handleAIReview}
        disabled={aiReviewLoading}
        >
        {aiReviewLoading ? "Reviewing..." : "Review Code with AI"}
        </button>

        {aiReviewError && (
        <p role="alert">{aiReviewError}</p>
        )}

       {aiReview && (
  <div className="ai-review-result">
    <h3>AI Review Results</h3>

    <div className="ai-review-summary">
      <div>
        <span>Overall Quality</span>
        <strong>{aiReview.overall_quality || "Not specified"}</strong>
      </div>

      <p>{aiReview.summary || "No summary provided."}</p>
    </div>

    <h4>Findings ({aiReview.findings?.length ?? 0})</h4>

    {!aiReview.findings?.length ? (
      <p>No findings were returned by the AI review.</p>
    ) : (
      <div className="ai-review-findings">
        {aiReview.findings.map((finding, index) => (
          <div className="ai-review-finding" key={index}>
            <div className="ai-review-finding-header">
              <strong>{finding.title || "Untitled finding"}</strong>
              <span className={`ai-review-severity ${finding.severity?.toLowerCase()}`}>
                {finding.severity || "Unspecified"}
              </span>
            </div>

            <div className="ai-review-finding-meta">
              <span>{finding.category || "General"}</span>
              {finding.line != null && (
                <span>Line {finding.line}</span>
              )}
            </div>

            <p>{finding.explanation}</p>

            <div className="ai-review-recommendation">
              <strong>Recommendation</strong>
              <p>{finding.recommendation}</p>
            </div>
            {finding.suggested_code && (
              <div className="ai-suggested-code">
                <div className="ai-suggested-code-header">
                  <strong>Suggested Code Fix</strong>

                  <button
                    type="button"
                    onClick={() =>
            navigator.clipboard.writeText(finding.suggested_code!)
                    }
                  >
                    Copy Code
                  </button>
                </div>

              <pre>
                <code>{finding.suggested_code}</code>
              </pre>
            </div>
          )}
          </div>
        ))}
      </div>
    )}

    <h4>Testing Suggestions</h4>

    {!aiReview.testing_suggestions?.length ? (
      <p>No testing suggestions provided.</p>
    ) : (
      <ul className="ai-review-testing">
        {aiReview.testing_suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
    )}
  </div>
)}
</section>
      </main>
    </div>
  );
}

export default Repository;