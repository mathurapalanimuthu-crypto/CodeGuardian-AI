import re
from pathlib import Path


LANGUAGE_EXTENSIONS = {
    ".py": "python",
    ".java": "java",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".hpp": "cpp",
}


def detect_language(filename):
    extension = Path(filename).suffix.lower()
    return LANGUAGE_EXTENSIONS.get(extension, "unknown")


def calculate_code_metrics(code: str, language="python"):
    lines = code.splitlines()

    total_lines = len(lines)

    blank_lines = sum(
        1 for line in lines if not line.strip()
    )

    comment_prefixes = {
        "python": ("#",),
        "javascript": ("//", "/*", "*", "*/"),
        "typescript": ("//", "/*", "*", "*/"),
        "java": ("//", "/*", "*", "*/"),
        "c": ("//", "/*", "*", "*/"),
        "cpp": ("//", "/*", "*", "*/"),
    }

    prefixes = comment_prefixes.get(
        language, ("#", "//", "/*", "*", "*/")
    )

    comment_lines = sum(
        1 for line in lines
        if line.strip().startswith(prefixes)
    )

    code_lines = max(
        0, total_lines - blank_lines - comment_lines
    )

    function_patterns = {
        "python": r"\bdef\s+\w+\s*\(",
        "javascript": r"\bfunction\s+\w+\s*\(|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>",
        "typescript": r"\bfunction\s+\w+\s*\(|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>",
        "java": r"\b(?:public|private|protected|static|final|synchronized|\s)+[\w<>\[\], ?]+\s+\w+\s*\([^;]*\)\s*(?:throws\s+[\w, ]+)?\s*\{",
        "c": r"\b[\w*]+\s+\w+\s*\([^;]*\)\s*\{",
        "cpp": r"\b[\w:*&<>, ]+\s+\w+\s*\([^;]*\)\s*(?:const\s*)?\{",
    }

    pattern = function_patterns.get(language)

    function_count = (
        len(re.findall(pattern, code))
        if pattern else 0
    )

    class_count = len(
        re.findall(r"\bclass\s+\w+", code)
    )

    todo_count = len(
        re.findall(
            r"\b(TODO|FIXME|HACK)\b",
            code,
            re.IGNORECASE
        )
    )

    long_lines = sum(
        1 for line in lines if len(line) > 120
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
    }