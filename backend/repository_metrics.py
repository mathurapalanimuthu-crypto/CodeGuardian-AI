def calculate_repository_metrics(analyzed_files):
    total_lines = 0
    code_lines = 0
    blank_lines = 0
    comment_lines = 0
    function_count = 0
    class_count = 0
    todo_count = 0
    long_lines = 0

    # Complexity metrics
    complexity_values = []
    total_complexity_blocks = 0
    high_complexity_blocks = 0

    for file in analyzed_files:
        metrics = file.get("metrics", {})
        complexity = file.get("complexity", {})

        total_lines += metrics.get("total_lines", 0)
        code_lines += metrics.get("code_lines", 0)
        blank_lines += metrics.get("blank_lines", 0)
        comment_lines += metrics.get("comment_lines", 0)
        function_count += metrics.get("function_count", 0)
        class_count += metrics.get("class_count", 0)
        todo_count += metrics.get("todo_count", 0)
        long_lines += metrics.get("long_lines", 0)

        # Collect complexity information
        complexity_value = complexity.get(
            "cyclomatic_complexity",
            0
        )

        if complexity_value > 0:
            complexity_values.append(
                complexity_value
            )

        total_complexity_blocks += complexity.get(
            "complexity_blocks",
            0
        )

        high_complexity_blocks += complexity.get(
            "high_complexity_blocks",
            0
        )

    # Calculate average complexity
    if complexity_values:
        average_cyclomatic_complexity = round(
            sum(complexity_values)
            / len(complexity_values),
            2
        )
    else:
        average_cyclomatic_complexity = 0

    # Calculate maximum complexity
    maximum_cyclomatic_complexity = (
        max(complexity_values)
        if complexity_values
        else 0
    )

    return {
        "total_lines": total_lines,
        "code_lines": code_lines,
        "blank_lines": blank_lines,
        "comment_lines": comment_lines,
        "function_count": function_count,
        "class_count": class_count,
        "todo_count": todo_count,
        "long_lines": long_lines,

        "average_cyclomatic_complexity":
            average_cyclomatic_complexity,

        "maximum_cyclomatic_complexity":
            maximum_cyclomatic_complexity,

        "total_complexity_blocks":
            total_complexity_blocks,

        "high_complexity_blocks":
            high_complexity_blocks,

        "files_analyzed":
            len(analyzed_files)
    }