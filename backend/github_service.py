from urllib.parse import urlparse
import requests
import time


def parse_github_url(repository_url: str):
    parsed_url = urlparse(repository_url.strip())

    if parsed_url.scheme not in ["http", "https"]:
        raise ValueError("Repository URL must start with http:// or https://")

    if parsed_url.netloc.lower() not in ["github.com", "www.github.com"]:
        raise ValueError("Only GitHub repository URLs are supported")

    path_parts = [
        part for part in parsed_url.path.strip("/").split("/")
        if part
    ]

    if len(path_parts) < 2:
        raise ValueError("Invalid GitHub repository URL")

    owner = path_parts[0]
    repository = path_parts[1]

    if repository.endswith(".git"):
        repository = repository[:-4]

    return {
        "owner": owner,
        "repository": repository
    }


def fetch_repository_info(owner: str, repository: str):
    url = f"https://api.github.com/repos/{owner}/{repository}"

    response = requests.get(url, timeout=10)

    if response.status_code == 404:
        raise ValueError("GitHub repository not found")

    if response.status_code != 200:
        raise ValueError(
            f"GitHub API request failed with status {response.status_code}"
        )

    data = response.json()

    return {
        "name": data["name"],
        "full_name": data["full_name"],
        "description": data["description"],
        "default_branch": data["default_branch"],
        "language": data["language"],
        "stars": data["stargazers_count"],
        "forks": data["forks_count"],
        "open_issues": data["open_issues_count"],
        "size_kb": data["size"],
        "created_at": data["created_at"],
        "updated_at": data["updated_at"],
    }

def fetch_repository_files(owner: str, repository: str, branch: str):
    url = f"https://api.github.com/repos/{owner}/{repository}/git/trees/{branch}?recursive=1"

    response = requests.get(url, timeout=20)

    if response.status_code != 200:
        raise ValueError(
            f"Unable to retrieve repository files. GitHub returned {response.status_code}"
        )

    data = response.json()

    files = []

    for item in data.get("tree", []):
        if item.get("type") != "blob":
            continue

        path = item.get("path", "")

        files.append({
            "path": path,
            "size": item.get("size", 0)
        })

    return files

def fetch_file_content(owner: str, repository: str, branch: str, path: str):
    url = (
        f"https://raw.githubusercontent.com/"
        f"{owner}/{repository}/{branch}/{path}"
    )

    time.sleep(0.3)

    for attempt in range(4):
        try:
            response = requests.get(
                url,
                timeout=(15, 90),
                headers={
                    "User-Agent": "CodeGuardianAI"
                }
            )

            # Handle GitHub rate limiting
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")

                try:
                    wait_time = int(retry_after) if retry_after else 5 * (attempt + 1)
                except ValueError:
                    wait_time = 5 * (attempt + 1)

                print(
                    f"Rate limit reached for {path}. "
                    f"Retrying after {wait_time} seconds..."
                )

                time.sleep(min(wait_time, 60))
                continue

            # Retry temporary server errors
            if response.status_code in [500, 501, 502, 503, 504]:
                wait_time = 5 * (attempt + 1)

                print(
                    f"Temporary GitHub server error "
                    f"{response.status_code} for {path}. "
                    f"Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)
                continue

            response.raise_for_status()
            return response.text

        except requests.exceptions.RequestException as error:
            print(
                f"Download attempt {attempt + 1} failed "
                f"for {path}: {error}"
            )

            if attempt < 3:
                time.sleep(3 * (attempt + 1))
            else:
                print(f"Skipping file after retries: {path}")

    return None

def is_source_file(path: str):
    source_extensions = {
        ".py",
        ".java",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".html",
        ".css",
    }

    return any(path.lower().endswith(ext) for ext in source_extensions)