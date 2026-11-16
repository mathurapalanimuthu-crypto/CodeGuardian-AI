from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from github_service import (
    parse_github_url,
    fetch_repository_info,
    fetch_repository_files,
    fetch_file_content,
    is_source_file,
)

from metrics import calculate_code_metrics, detect_language
from repository_metrics import calculate_repository_metrics
from scoring import calculate_scores
from complexity import calculate_complexity
from ai_reviewer import review_source_code
from pydantic import Field
from io import BytesIO
from fastapi import Body
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from xml.sax.saxutils import escape
from datetime import datetime

from ml.predict import (
    load_model,
    predict_python_code
)


# Load ML model
ml_model = load_model()


app = FastAPI(title="CodeGuardian AI API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://code-guardian-ai-two.vercel.app",
],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RepositoryRequest(BaseModel):
    repository_url: str


class CodePredictionRequest(BaseModel):
    code: str

class CodeMetricsRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50000)
    language: str


@app.get("/")
def root():
    return {
        "message": "CodeGuardian AI backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/analyze")
def analyze_repository(request: RepositoryRequest):

    try:

        repository = parse_github_url(
            request.repository_url
        )

        owner = repository["owner"]
        repo_name = repository["repository"]

        repository_info = fetch_repository_info(
            owner,
            repo_name
        )

        branch = repository_info["default_branch"]

        files = fetch_repository_files(
            owner,
            repo_name,
            branch
        )

        source_files = [
            file
            for file in files
            if is_source_file(file["path"])
        ]

        ignored_directories = {
            "build",
            "dist",
            "out",
            "node_modules",
            "tests",
            "test",
            "__tests__",
            "coverage",
            "vendor",
            "fixtures",
            "benchmarks",
        }

        files_to_analyze = [
            file
            for file in source_files
            if not any(
                part.lower() in ignored_directories
                for part in file["path"].split("/")
            )
            and file.get("size", 0) <= 300000
        ]
        

        analyzed_files = []

        for file in files_to_analyze[:200]:

            content = fetch_file_content(
                owner,
                repo_name,
                branch,
                file["path"]
            )

            if content is None:
                continue

            language = detect_language(file["path"])

            metrics = calculate_code_metrics(
                content,
                 language
              )

            complexity = calculate_complexity(
                 content,
                 language
            )

             # ML prediction (Python files only)
            ml_prediction = None

            if language == "python":
                try:
                  ml_prediction = predict_python_code(
                    ml_model,
                    content
              )

                except Exception as error:
                    print(
                         f"ML prediction failed for {file['path']}: {error}"
              )

            analyzed_files.append({
                "path": file["path"],
                "size": file["size"],
                "content": content[:10000],
                "language": language,
                "metrics": metrics,
                "complexity": complexity,
                "ml_prediction": ml_prediction
         })

        repository_metrics = calculate_repository_metrics(
            analyzed_files
        )

        scores = calculate_scores(
            repository_metrics
        )

        return {
            "message": "Repository source code retrieved successfully",
            "repository_url": request.repository_url,
            "owner": owner,
            "repository": repo_name,
            "status": "ready",
            "repository_info": repository_info,
            "file_count": len(files),
            "source_file_count": len(source_files),
            "analyzed_file_count": len(analyzed_files),
            "repository_metrics": repository_metrics,
            "scores": scores,
            "files": analyzed_files
        }

    except ValueError as error:

        return {
            "message": str(error),
            "status": "invalid"
        }


@app.post("/predict")
def predict_code(
    request: CodePredictionRequest
):

    try:

        result = predict_python_code(
            ml_model,
            request.code
        )

        return {
            "status": "success",
            "prediction": result["prediction"],
            "defect_probability": result["defect_probability"],
            "risk_level": result["risk_level"],
            "recommendations": result["recommendations"],
            "metrics": result["metrics"]
        }

    except ValueError as error:

        return {
            "status": "error",
            "message": str(error)
        }
    
class AIReviewRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=300)
    code: str = Field(min_length=1, max_length=12000)


@app.post("/ai-review")
def ai_review_endpoint(request: AIReviewRequest):
    from fastapi import HTTPException

    try:
        review = review_source_code(request.filename, request.code)
        return {
            "status": "success",
            "filename": request.filename,
            "review": review
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        print(f"AI review error: {exc}")
        raise HTTPException(
            status_code=502,
            detail="AI review failed. Check Ollama and the backend terminal."
        )
@app.post("/analyze-code")
def analyze_code_endpoint(request: CodeMetricsRequest):

    supported_languages = [
        "python",
        "java",
        "javascript",
        "typescript",
        "c",
        "cpp",
    ]

    language = request.language.lower().strip()

    if language not in supported_languages:
            return {
            "status": "error",
            "message": "Unsupported programming language."
        }

    if not request.code.strip():
        return {
            "status": "error",
            "message": "Please enter source code."
        }

    try:
            metrics = calculate_code_metrics(
            request.code,
            language
        )

            return {
            "status": "success",
            "language": language,
            "metrics": metrics,
            "message": "Code metrics calculated successfully."
        }

    except Exception as error:
            print(f"Code analysis error: {error}")

            return {
            "status": "error",
            "message": "Unable to analyze the source code."
        }

def safe_text(value):
    """Convert values safely for PDF paragraphs."""
    if value is None:
        return "N/A"

    return escape(str(value)).replace("\n", "<br/>")


def add_section_title(story, title, styles):
    story.append(Spacer(1, 8))
    story.append(Paragraph(safe_text(title), styles["Heading2"]))
    story.append(Spacer(1, 5))


def add_key_value_table(story, rows):
    if not rows:
        return

    table_data = [
        [
            Paragraph(f"<b>{safe_text(label)}</b>", getSampleStyleSheet()["BodyText"]),
            Paragraph(safe_text(value), getSampleStyleSheet()["BodyText"]),
        ]
        for label, value in rows
    ]

    table = Table(table_data, colWidths=[55 * mm, 115 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EAF1F8")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D5DEE8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))

    story.append(table)
    story.append(Spacer(1, 8))


def add_bullet_list(story, items, styles):
    if not items:
        story.append(Paragraph("No items available.", styles["BodyText"]))
        return

    for item in items:
        story.append(
            Paragraph(
                f"&bull; {safe_text(item)}",
                styles["BodyText"]
            )
        )
        story.append(Spacer(1, 4))


def build_analysis_pdf(report):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=20 * mm,
        title="CodeGuardian AI Repository Analysis Report",
        author="CodeGuardian AI",
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        parent=styles["Title"],
        fontSize=21,
        leading=27,
        textColor=colors.HexColor("#17365D"),
        alignment=TA_CENTER,
        spaceAfter=10,
    ))

    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#526579"),
        alignment=TA_CENTER,
        spaceAfter=18,
    ))

    story = []

    repository = report.get("repositoryInfo") or {}
    analysis = report.get("analysisResults") or {}
    scores = analysis.get("scores") or {}
    metrics = analysis.get("metrics") or {}

    report_generated = datetime.now().astimezone().strftime(
    "%d-%m-%Y %I:%M:%S %p %Z"
    )

    repository_url = report.get("repositoryUrl") or "Not available"

    selected_filename = (
        report.get("selectedSourceFilename") or "Not selected"
    )

    story.append(Spacer(1, 8 * mm))
    cover_box = Table(
        [
            [Paragraph("CODEGUARDIAN AI", styles["ReportTitle"])],
            [Paragraph("Repository Analysis Report", styles["ReportSubtitle"])],
        ],
        colWidths=[150 * mm],
    )

    cover_box.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#2563EB")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F9FF")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))

    story.append(cover_box)
    story.append(Spacer(1, 12 * mm))
    story.append(Paragraph(
        safe_text(repository.get("full_name", "Repository Analysis")),
        styles["Heading2"]
    ))
    story.append(Paragraph(
    safe_text(
        repository.get("description")
        or "No repository description available."
    ),
    styles["BodyText"]
))

    story.append(Spacer(1, 8))

    if repository_url.startswith("https://github.com/"):
        github_link = (
        f'<link href="{escape(repository_url)}" '
        f'color="#2563EB">{safe_text(repository_url)}</link>'
    )

        story.append(Paragraph(
        f"<b>GitHub Repository:</b> {github_link}",
        styles["BodyText"]
    ))
    else:
        story.append(Paragraph(
            f"<b>GitHub Repository:</b> {safe_text(repository_url)}",
        styles["BodyText"]
    ))

    story.append(Spacer(1, 10))

    add_key_value_table(story, [
    ("Report Generated", report_generated),
    ("GitHub Repository URL", repository_url),
    ("AI Review Source File", selected_filename),
])

    story.append(Spacer(1, 12))

    add_key_value_table(story, [
        ("Primary Language", repository.get("language", "Not specified")),
        ("Default Branch", repository.get("default_branch", "N/A")),
        ("Stars", repository.get("stars", "N/A")),
        ("Forks", repository.get("forks", "N/A")),
        ("Open Issues", repository.get("open_issues", "N/A")),
        ("Repository Size", f'{repository.get("size_kb", "N/A")} KB'),
    ])

    add_section_title(story, "1. Executive Summary", styles)

    add_key_value_table(story, [
        ("Software Health Score", scores.get("software_health_score", "N/A")),
        ("Technical Debt Score", scores.get("technical_debt_score", "N/A")),
        ("Risk Score", scores.get("risk_score", "N/A")),
        ("Risk Level", scores.get("risk_level", "N/A")),
        ("Total Files", analysis.get("fileCount", 0)),
        ("Source Files", analysis.get("sourceFileCount", 0)),
        ("Files Analyzed", analysis.get("analyzedFileCount", 0)),
    ])

    add_section_title(story, "2. Repository Code Metrics", styles)

    metric_labels = [
        ("Total Lines", "total_lines"),
        ("Code Lines", "code_lines"),
        ("Functions", "function_count"),
        ("Classes", "class_count"),
        ("TODO / FIXME", "todo_count"),
        ("Long Lines", "long_lines"),
        ("Average Cyclomatic Complexity", "average_cyclomatic_complexity"),
        ("Maximum Cyclomatic Complexity", "maximum_cyclomatic_complexity"),
        ("High Complexity Blocks", "high_complexity_blocks"),
    ]

    add_key_value_table(story, [
        (label, metrics.get(key, "N/A"))
        for label, key in metric_labels
    ])

    add_section_title(story, "3. ML Risk Distribution", styles)

    risk_items = report.get("riskDistribution") or []

    add_key_value_table(story, [
        (item.get("name", "Unknown"), item.get("value", 0))
        for item in risk_items
    ])

    add_section_title(story, "4. Code Quality Findings", styles)

    findings = report.get("findings") or []

    if not findings:
        story.append(Paragraph(
            "No warnings were detected by the current checks for the analyzed files.",
            styles["BodyText"]
        ))
    else:
        for finding in findings:
            story.append(Paragraph(
                f"<b>{safe_text(finding.get('path'))}</b>",
                styles["BodyText"]
            ))
            story.append(Paragraph(
                safe_text(finding.get("message")),
                styles["BodyText"]
            ))
            story.append(Spacer(1, 6))

    add_section_title(story, "5. Priority-Based Recommendations", styles)

    recommendations = report.get("priorityRecommendations") or []

    if not recommendations:
        story.append(Paragraph(
            "No recommendations were generated by the current checks.",
            styles["BodyText"]
        ))
    else:
        for item in recommendations:
            story.append(Paragraph(
                f"<b>{safe_text(item.get('priority'))} — "
                f"{safe_text(item.get('path'))}</b>",
                styles["BodyText"]
            ))
            story.append(Paragraph(
                safe_text(item.get("issue")),
                styles["BodyText"]
            ))
            story.append(Paragraph(
                f"<b>Recommended action:</b> {safe_text(item.get('action'))}",
                styles["BodyText"]
            ))
            story.append(Spacer(1, 7))

    add_section_title(story, "6. Rule-Based Code Review Suggestions", styles)

    assistant_items = report.get("codeReviewAssistant") or []

    if not assistant_items:
        story.append(Paragraph(
            "No rule-based review suggestions were generated.",
            styles["BodyText"]
        ))
    else:
        for item in assistant_items:
            story.append(Paragraph(
                f"<b>{safe_text(item.get('path'))}</b>",
                styles["BodyText"]
            ))
            add_bullet_list(story, item.get("suggestions") or [], styles)
            story.append(Spacer(1, 5))

    # 7. Ollama AI Code Review Results

    add_section_title(story, "7. Ollama AI Code Review Results", styles)

    ai_review = report.get("aiReview") or {}

    if not ai_review:
        story.append(Paragraph(
            "AI code review was not performed before generating this report.",
            styles["BodyText"]
        ))
    else:
        story.append(Paragraph(
            f"<b>Overall Quality:</b> "
            f"{safe_text(ai_review.get('overall_quality'))}",
            styles["BodyText"]
        ))

        story.append(Spacer(1, 5))

        story.append(Paragraph(
            "<b>AI Review Summary</b>",
            styles["BodyText"]
        ))

        story.append(Paragraph(
            safe_text(ai_review.get("summary")),
            styles["BodyText"]
        ))

        story.append(Spacer(1, 8))

        ai_findings = ai_review.get("findings") or []

        story.append(Paragraph(
            f"<b>AI Findings ({len(ai_findings)})</b>",
            styles["BodyText"]
        ))

        if not ai_findings:
            story.append(Paragraph(
                "No findings were returned by the AI review.",
                styles["BodyText"]
            ))
        else:
            for finding in ai_findings:
                story.append(Paragraph(
                    f"<b>{safe_text(finding.get('title'))}</b>",
                    styles["BodyText"]
                ))

                add_key_value_table(story, [
                    ("Severity", finding.get("severity", "N/A")),
                    ("Category", finding.get("category", "N/A")),
                    ("Line", finding.get("line", "N/A")),
                ])

                story.append(Paragraph(
                    f"<b>Explanation:</b> "
                    f"{safe_text(finding.get('explanation'))}",
                    styles["BodyText"]
                ))

                story.append(Spacer(1, 4))

                story.append(Paragraph(
                    f"<b>Recommendation:</b> "
                    f"{safe_text(finding.get('recommendation'))}",
                    styles["BodyText"]
                ))

                if finding.get("suggested_code"):
                    story.append(Spacer(1, 4))
                    story.append(Paragraph(
                        "<b>Suggested Code Fix:</b>",
                        styles["BodyText"]
                    ))
                    story.append(Paragraph(
                        safe_text(finding.get("suggested_code")),
                        styles["Code"]
                    ))

                story.append(Spacer(1, 10))

        story.append(Paragraph(
            "<b>Testing Suggestions</b>",
            styles["BodyText"]
        ))

        add_bullet_list(
            story,
            ai_review.get("testing_suggestions") or [],
            styles
        )

    add_section_title(story, "8. Analyzed Source Files", styles)

    files = analysis.get("files") or []

    if not files:
        story.append(Paragraph(
            "No analyzed source files were included.",
            styles["BodyText"]
        ))
    else:
        for file in files:
            story.append(Paragraph(
                f"<b>{safe_text(file.get('path'))}</b>",
                styles["Heading3"]
            ))

            file_metrics = file.get("metrics") or {}
            complexity = file.get("complexity") or {}
            prediction = file.get("ml_prediction") or {}

            add_key_value_table(story, [
                ("File Size", f"{file.get('size', 'N/A')} bytes"),
                ("Lines", file_metrics.get("total_lines", "N/A")),
                ("Functions", file_metrics.get("function_count", "N/A")),
                ("Cyclomatic Complexity", complexity.get("cyclomatic_complexity", "N/A")),
                ("ML Prediction", (
                    "Potential Defect" if prediction.get("prediction")
                    else "No Defect Predicted"
                ) if prediction else "Not available"),
                ("Defect Probability", (
                    f"{prediction.get('defect_probability', 0) * 100:.2f}%"
                    if prediction else "N/A"
                )),
                ("Risk Level", prediction.get("risk_level", "N/A")),
            ])

            if prediction.get("recommendations"):
                story.append(Paragraph(
                    "<b>ML Recommendations</b>",
                    styles["BodyText"]
                ))
                add_bullet_list(
                    story,
                    prediction.get("recommendations"),
                    styles
                )

    add_section_title(story, "9. Conclusion and Limitations", styles)

    story.append(Paragraph(
        "This report presents repository-level metrics, machine-learning "
        "predictions, and code-quality suggestions generated by CodeGuardian AI.",
        styles["BodyText"]
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "<b>Important:</b> Scores and ML predictions are estimates based on "
        "the analyzed files. They are not confirmed defects, security "
        "vulnerabilities, or a substitute for manual code review and testing.",
        styles["BodyText"]
    ))

    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.drawString(18 * mm, 10 * mm, "Generated by CodeGuardian AI")
        canvas.drawRightString(
            A4[0] - 18 * mm,
            10 * mm,
            f"Page {doc.page}"
        )
        canvas.restoreState()

    document.build(
        story,
        onFirstPage=add_page_number,
        onLaterPages=add_page_number
    )

    buffer.seek(0)
    return buffer


@app.post("/download-report")
async def download_analysis_report(report: dict = Body(...)):
    try:
        pdf_buffer = build_analysis_pdf(report)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="CodeGuardian_Analysis_Report.pdf"'
            }
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(error)}"
        )