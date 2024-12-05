import sys
import json
from bs4 import BeautifulSoup
import os

def log(message):
    """Custom logger to print messages."""
    print(f"[LOG] {message}", flush=True)

def parse_html(file_path):
    """Parse HTML file with BeautifulSoup."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()

        # Parse the HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        title = soup.title.string if soup.title else "No title available"

        # Extract all links
        links = [a['href'] for a in soup.find_all('a', href=True)]
        log(f"Extracted {len(links)} links from the HTML file.")

        return {
            "title": title,
            "links": links
        }

    except Exception as e:
        log(f"Error while parsing HTML: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "HTML file path is required"}))
        sys.exit(1)

    file_path = sys.argv[1]
    result = parse_html(file_path)
    print(json.dumps(result, indent=2))
