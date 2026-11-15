from radon.complexity import cc_visit
import lizard


def calculate_complexity(code: str, language="python"):
    """
    Calculate cyclomatic complexity.

    Radon: Python
    Lizard: JavaScript, TypeScript, Java, C and C++
    """

    try:
        # Keep the existing Radon implementation for Python
        if language == "python":

            blocks = cc_visit(code)

            complexity_values = [
                block.complexity
                for block in blocks
            ]

        else:
            # Use Lizard for other supported languages
            file_extensions = {
                "javascript": "sample.js",
                "typescript": "sample.ts",
                "java": "sample.java",
                "c": "sample.c",
                "cpp": "sample.cpp",
            }

            filename = file_extensions.get(language)

            if not filename:
                return {
                    "cyclomatic_complexity": 0,
                    "complexity_blocks": 0,
                    "high_complexity_blocks": 0
                }

            analysis = lizard.analyze_file.analyze_source_code(
                filename,
                code
            )

            complexity_values = [
                function.cyclomatic_complexity
                for function in analysis.function_list
            ]

        if not complexity_values:
            return {
                "cyclomatic_complexity": 0,
                "complexity_blocks": 0,
                "high_complexity_blocks": 0
            }

        average_complexity = sum(
            complexity_values
        ) / len(complexity_values)

        high_complexity_blocks = sum(
            1
            for value in complexity_values
            if value > 10
        )

        return {
            "cyclomatic_complexity": round(
                average_complexity, 2
            ),
            "complexity_blocks": len(complexity_values),
            "high_complexity_blocks": high_complexity_blocks
        }

    except Exception as error:
        print(f"Complexity analysis failed: {error}")

        return {
            "cyclomatic_complexity": 0,
            "complexity_blocks": 0,
            "high_complexity_blocks": 0
        }