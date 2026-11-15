import ast
import math
import re


def calculate_python_jm1_metrics(code: str):
    """
    Extract a practical set of JM1-style software metrics
    from Python source code.
    """

    lines = code.splitlines()

    # -----------------------------------------
    # Basic line metrics
    # -----------------------------------------

    loc = len(lines)

    blank_lines = sum(
        1
        for line in lines
        if not line.strip()
    )

    comment_lines = sum(
        1
        for line in lines
        if line.strip().startswith("#")
    )

    code_lines = loc - blank_lines - comment_lines

    loc_code_and_comment = code_lines + comment_lines

    # -----------------------------------------
    # Parse Python AST
    # -----------------------------------------

    try:
        tree = ast.parse(code)
    except SyntaxError:
        return None

    operators = []
    operands = []

    branch_count = 0
    function_count = 0

    # -----------------------------------------
    # AST traversal
    # -----------------------------------------

    for node in ast.walk(tree):

        # Functions
        if isinstance(
            node,
            (
                ast.FunctionDef,
                ast.AsyncFunctionDef
            )
        ):
            function_count += 1

        # Branches
        if isinstance(
            node,
            (
                ast.If,
                ast.For,
                ast.While,
                ast.IfExp,
                ast.Try,
                ast.ExceptHandler
            )
        ):
            branch_count += 1

        # Operators
        if isinstance(
            node,
            (
                ast.Add,
                ast.Sub,
                ast.Mult,
                ast.Div,
                ast.FloorDiv,
                ast.Mod,
                ast.Pow,
                ast.Eq,
                ast.NotEq,
                ast.Lt,
                ast.LtE,
                ast.Gt,
                ast.GtE,
                ast.And,
                ast.Or,
                ast.Not,
                ast.In,
                ast.NotIn,
                ast.Is,
                ast.IsNot
            )
        ):
            operators.append(type(node).__name__)

        # Operands
        if isinstance(
            node,
            ast.Name
        ):
            operands.append(node.id)

        elif isinstance(
            node,
            ast.Constant
        ):
            if isinstance(
                node.value,
                (
                    str,
                    int,
                    float,
                    bool
                )
            ):
                operands.append(
                    str(node.value)
                )

    # -----------------------------------------
    # Halstead metrics
    # -----------------------------------------

    total_operators = len(operators)
    total_operands = len(operands)

    unique_operators = len(
        set(operators)
    )

    unique_operands = len(
        set(operands)
    )

    vocabulary = (
        unique_operators
        + unique_operands
    )

    length = (
        total_operators
        + total_operands
    )

    if vocabulary > 0:
        volume = (
            length
            * math.log2(vocabulary)
        )
    else:
        volume = 0

    if unique_operands > 0:
        difficulty = (
            (unique_operators / 2)
            * (
                total_operands
                / unique_operands
            )
        )
    else:
        difficulty = 0

    effort = volume * difficulty

    # -----------------------------------------
    # McCabe-style complexity
    # -----------------------------------------

    cyclomatic = 1 + branch_count

    # -----------------------------------------
    # JM1-style output
    # -----------------------------------------

    return {
        "loc": loc,
        "v(g)": cyclomatic,
        "ev(g)": cyclomatic,
        "iv(g)": max(
            1,
            function_count
        ),
        "n": length,
        "v": round(volume, 4),
        "l": round(
            1 / max(difficulty, 1),
            4
        ),
        "d": round(
            difficulty,
            4
        ),
        "i": round(
            volume,
            4
        ),
        "e": round(
            effort,
            4
        ),
        "b": round(
            volume / 3000,
            6
        ),
        "t": round(
            effort / 18,
            4
        ),
        "lOCode": code_lines,
        "lOComment": comment_lines,
        "lOBlank": blank_lines,
        "locCodeAndComment": loc_code_and_comment,
        "uniq_Op": unique_operators,
        "uniq_Opnd": unique_operands,
        "total_Op": total_operators,
        "total_Opnd": total_operands,
        "branchCount": branch_count,
    }
if __name__ == "__main__":

    sample_code = """
def calculate_total(a, b):
    if a > b:
        return a + b
    else:
        return b - a
"""

    metrics = calculate_python_jm1_metrics(
        sample_code
    )

    print("\n========== JM1 METRICS ==========")

    for name, value in metrics.items():
        print(f"{name}: {value}")