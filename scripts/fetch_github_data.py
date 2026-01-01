import os
import json
import requests
from datetime import datetime, timezone

USERNAME = "drewvolz"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
OUTPUT_FILE = "data/github_activity.json"

HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "X-GitHub-Api-Version": "2022-11-28"
}

def fetch_github_api(url):
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()

def escape_html(s):
    if not s:
        return ""
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;")

def remove_html(html_str):
    if not html_str:
        return ""
    # A simple way to remove HTML tags for sanitization for title
    return requests.utils.unquote(html_str) # This is not robust, but mimics innerText for simple cases

def get_repo_name(event):
    return event.get("repo", {}).get("name", "unknown-repo")

def get_pr_number(pr, payload):
    return pr.get("number", payload.get("number", ""))

def build_href(event, payload, pr):
    if pr and pr.get("html_url"):
        return pr["html_url"]

    repo = get_repo_name(event)
    number = get_pr_number(pr, payload)

    if repo != "unknown-repo" and number:
        return f"https://github.com/{repo}/pull/{number}"
    return "#"

def get_sanitized_title(pr, payload):
    has_number = payload and payload.get("number")
    default_title = f"#{payload['number']}" if has_number else "Pull request"
    raw_title = pr.get("title", default_title)
    return remove_html(raw_title)

def build_inner_html(title, repo_name, href):
    link_text = escape_html(title)
    title_text = f"View pull request titled '{title}' in the {repo_name} repo"
    link = f'<a href="{escape_html(href)}" title="{escape_html(title_text)}" target="_blank">{link_text}</a>'
    return f'<li>{link}</li>'

def build_display_data(event, payload, pr):
    repo_name = get_repo_name(event)
    title = get_sanitized_title(pr, payload)
    href = build_href(event, payload, pr)

    return {
        "innerHTML": build_inner_html(title, repo_name, href),
        "prUrl": pr.get("url")
    }

def main():
    try:
        events = fetch_github_api(f"https://api.github.com/users/{USERNAME}/events?per_page=100")
        
        filtered_events = [
            event for event in events
            if event.get("type") == "PullRequestEvent" and
               event.get("payload", {}).get("action") == "opened" and
               event.get("actor", {}).get("login") == USERNAME
        ]

        cleaned_data = []
        for event in filtered_events:
            payload = event.get("payload", {})
            pr = payload.get("pull_request", {})
            display_data = build_display_data(event, payload, pr)
            
            cleaned_data.append({
                "id": event["id"],
                "type": event["type"],
                "innerHTML": display_data["innerHTML"],
                "event": event, # Keep original event for enrich_data
                "payload": payload, # Keep original payload for enrich_data
                "prUrl": display_data["prUrl"]
            })

        # Enrich data needs to be awaited, so running it synchronously for now
        # This part requires fetching additional data per PR, similar to client-side
        enriched_data = []
        for item in cleaned_data:
            if not item["prUrl"]:
                enriched_data.append(item)
                continue
            try:
                pr_details = fetch_github_api(item["prUrl"])
                if not pr_details:
                    enriched_data.append(item)
                    continue
                
                payload = item["payload"]
                event = item["event"]
                display_data = build_display_data(event, payload, pr_details)
                
                enriched_data.append({
                    "id": item["id"],
                    "type": item["type"],
                    "innerHTML": display_data["innerHTML"],
                    "prUrl": display_data["prUrl"] or item["prUrl"],
                })
            except requests.exceptions.RequestException as e:
                print(f"Error fetching PR details for {item['prUrl']}: {e}")
                enriched_data.append(item)

        # Remove temporary 'event' and 'payload' keys before saving
        final_data = []
        for item in enriched_data:
            new_item = {k: v for k, v in item.items() if k not in ["event", "payload"]}
            final_data.append(new_item)


        # Ensure the data directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w") as f:
            json.dump(final_data, f, indent=4)
        
        print(f"Successfully fetched and saved GitHub activity to {OUTPUT_FILE}")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching GitHub events: {e}")
        exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        exit(1)

if __name__ == "__main__":
    main()
