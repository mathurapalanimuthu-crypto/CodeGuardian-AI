const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export async function analyzeRepository(repositoryUrl: string) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 900000); // 5 minutes

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repository_url: repositoryUrl,
      }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || data.message || "Repository analysis failed."
      );
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Repository analysis timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function predictCode(code: string) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: code,
    }),
  });

  if (!response.ok) {
    throw new Error("Code prediction request failed");
  }

  return response.json();
}

export async function reviewCodeWithAI(filename: string, code: string) {
  const response = await fetch(`${API_BASE_URL}/ai-review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, code }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "AI review failed.");
  }

  return data;
}

export async function analyzeCode(
  code: string,
  language: string
) {
  const response = await fetch(`${API_BASE_URL}/analyze-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      language,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Code analysis request failed."
    );
  }

  return data;
}

export async function downloadAnalysisPDF(report: any) {
  const response = await fetch(`${API_BASE_URL}/download-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    let message = "PDF report generation failed.";

    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
}