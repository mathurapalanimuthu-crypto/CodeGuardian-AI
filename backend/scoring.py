def calculate_scores(repository_metrics):
    """
    Calculate Software Health, Technical Debt,
    Risk Score, and Risk Level.
    """

    total_lines = repository_metrics.get("total_lines", 0)
    code_lines = repository_metrics.get("code_lines", 0)
    comment_lines = repository_metrics.get("comment_lines", 0)
    function_count = repository_metrics.get("function_count", 0)
    class_count = repository_metrics.get("class_count", 0)
    todo_count = repository_metrics.get("todo_count", 0)
    long_lines = repository_metrics.get("long_lines", 0)

    average_complexity = repository_metrics.get(
        "average_cyclomatic_complexity",
        0
    )

    high_complexity_blocks = repository_metrics.get(
        "high_complexity_blocks",
        0
    )

    # Avoid division by zero
    if total_lines == 0:
        return {
            "software_health_score": 0,
            "technical_debt_score": 0,
            "risk_score": 0,
            "risk_level": "Unknown"
        }

    # -----------------------------------------
    # 1. Technical Debt Indicators
    # -----------------------------------------

    long_line_ratio = long_lines / total_lines
    todo_ratio = todo_count / max(code_lines, 1)
    comment_ratio = comment_lines / total_lines

    complexity_penalty = min(
        20,
        average_complexity * 2
    )

    debt_penalty = (
        (long_line_ratio * 30)
        + (todo_ratio * 25)
        + (max(0, 0.15 - comment_ratio) * 25)
        + complexity_penalty
    )

    technical_debt_score = min(
        100,
        round(debt_penalty, 2)
    )

    # -----------------------------------------
    # 2. Risk Indicators
    # -----------------------------------------

    function_density = function_count / max(code_lines, 1)
    class_density = class_count / max(code_lines, 1)

    complexity_risk = min(
        30,
        average_complexity * 3
    )

    high_complexity_risk = min(
        20,
        high_complexity_blocks * 2
    )

    risk_score = (
        (long_line_ratio * 20)
        + (todo_ratio * 20)
        + (function_density * 100 * 10)
        + (class_density * 100 * 10)
        + complexity_risk
        + high_complexity_risk
    )

    risk_score = min(
        100,
        round(risk_score, 2)
    )

    # -----------------------------------------
    # 3. Risk Level
    # -----------------------------------------

    if risk_score <= 30:
        risk_level = "Low"

    elif risk_score <= 60:
        risk_level = "Medium"

    else:
        risk_level = "High"

    # -----------------------------------------
    # 4. Software Health Score
    # -----------------------------------------

    software_health_score = round(
        max(
            0,
            100
            - (technical_debt_score * 0.5)
            - (risk_score * 0.5)
        ),
        2
    )

    return {
        "software_health_score": software_health_score,
        "technical_debt_score": technical_debt_score,
        "risk_score": risk_score,
        "risk_level": risk_level
    }