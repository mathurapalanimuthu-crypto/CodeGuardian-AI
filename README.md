CodeGuardian AI

AI-Based Software Risk and Technical Debt Prediction

CodeGuardian AI is an intelligent software analysis platform designed to evaluate GitHub repositories, identify potential software risks, measure technical debt, and provide AI-powered code review suggestions.

The system combines static code analysis, software metrics, machine learning, and AI-based review to help developers understand and improve code quality.

Key Features

- GitHub Repository Analysis: Analyze public GitHub repositories.
- Software Health Score: Evaluate overall repository health.
- Technical Debt Score: Measure potential technical debt.
- Software Risk Prediction: Identify software risk levels.
- Machine Learning Prediction: Use a Random Forest model to predict defect risk for Python files.
- AI Code Review: Generate code review findings and recommendations using Ollama.
- Repository Comparison: Compare software quality metrics across repositories.
- Analysis History: View previously analyzed repositories.
- Report Generation: Export analysis results as PDF and TXT reports.

Technologies Used

Frontend

- React
- TypeScript
- Vite
- HTML
- CSS
- JavaScript
- Chart.js

Backend

- Python
- FastAPI
- Scikit-learn
- Radon
- Lizard

Machine Learning and AI

- Random Forest Classifier
- JM1 Dataset
- Ollama
- Qwen2.5-Coder

Development Tools

- Visual Studio Code
- Git
- GitHub

System Workflow

1. Enter a public GitHub repository URL.
2. Retrieve repository information and source files.
3. Calculate code quality and complexity metrics.
4. Evaluate software health, technical debt, and risk scores.
5. Apply machine learning-based defect risk prediction to supported Python files.
6. Generate AI-powered code review findings and recommendations.
7. Display analysis results through charts and dashboards.
8. Export the analysis report in PDF or TXT format.

Project Structure

software-risk-prediction/
│
├── backend/
│   ├── ml/
│   ├── main.py
│   ├── github_service.py
│   ├── metrics.py
│   ├── repository_metrics.py
│   ├── scoring.py
│   ├── complexity.py
│   ├── ai_reviewer.py
│   └── requirements.txt
│
├── frontend/
│
├── datasets/
│   └── jm1.csv
│
└── .gitignore

Running the Project Locally

1. Clone the Repository

git clone https://github.com/mathurapalanimuthu-crypto/CodeGuardian-AI.git
cd CodeGuardian-AI

2. Start the Backend

Open a terminal:

cd backend
python -m venv venv

Activate the virtual environment on Windows:

.\venv\Scripts\Activate

Install dependencies:

pip install -r requirements.txt

Start the FastAPI server:

uvicorn main:app --reload

Backend address: "http://127.0.0.1:8000"

3. Start the Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Open the local frontend URL displayed in the terminal.

4. AI Code Review

Ollama must be installed and running locally for the current AI code review implementation. The configured model is Qwen2.5-Coder.

Important Notes

- Machine learning-based defect risk predictions are currently supported for Python source files.
- Other supported programming languages can be analyzed using the available code metrics and scoring functionality.
- The current repository analysis implementation supports analysis of up to 200 selected source files.
- AI code review currently depends on the locally configured Ollama service.

Project Objective

To develop an AI-based software analysis platform that helps developers identify potential defects, understand technical debt, evaluate software quality, and make informed decisions to improve software maintainability.

Repository

GitHub: https://github.com/mathurapalanimuthu-crypto/CodeGuardian-AI

---

CodeGuardian AI – Making Software Quality Smarter.