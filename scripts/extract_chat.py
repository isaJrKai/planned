"""Extract human-readable conversation from the chat.z.ai shared page HTML."""
import json
import re
from pathlib import Path

src = Path("/home/z/my-project/chat_content.json")
data = json.loads(src.read_text())

html = data.get("data", {}).get("html", "")
title = data.get("data", {}).get("title", "")
print("TITLE:", title)
print("HTML LEN:", len(html))

# Strip CSS / scripts
html_no_style = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL)
html_no_script = re.sub(r"<script[^>]*>.*?</script>", "", html_no_style, flags=re.DOTALL)

# Try to find user/assistant message blocks by common patterns
# z.ai chat typically renders messages in containers; let's look for common markers
text = re.sub(r"<[^>]+>", "\n", html_no_script)
text = re.sub(r"\n+", "\n", text)
text = re.sub(r"[ \t]+", " ", text)

out = Path("/home/z/my-project/chat_text.txt")
out.write_text(text)
print("Wrote", out, "len", len(text))
print("--- FIRST 3000 CHARS ---")
print(text[:3000])
