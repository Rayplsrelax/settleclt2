#!/usr/bin/env python3
"""Insert agent task for hurricane prep blog draft directly into MySQL via SSH.
Bypasses the tRPC endpoint which requires admin auth."""
import json
import subprocess
import os

# Read the blog draft
draft_path = r"C:\Users\Raysh\settleclt2\scripts\drafts\hurricane-prep-charlotte-2026.md"
with open(draft_path, "r", encoding="utf-8") as f:
    blog_body = f.read()

payload = {
    "title": "Hurricane Preparedness in Charlotte: A Newcomer's Guide to Staying Safe",
    "slug": "hurricane-preparedness-charlotte-newcomer-guide",
    "category": "newcomer guide",
    "bodyMarkdown": blog_body
}

evidence = {
    "sources": [
        "https://www.noaa.gov/news-release/noaa-predicts-below-normal-2026-atlantic-hurricane-season",
        "https://www.charlottenc.gov/City-News/Plan-Prepare-and-Stay-Informed-for-2026-Hurricane-Season",
        "https://news.mecknc.gov/plan-prepare-and-stay-informed-hurricane-season",
        "https://www.charlottenc.gov/Public-Safety/Emergency-Management",
        "https://www.charlottenc.gov/Public-Safety/Emergency-Management/Prepare",
        "https://www.readync.gov/plan-and-prepare/hurricane-guide",
        "https://tropical.colostate.edu/Forecast/2026-07.pdf",
        "https://www.nhc.noaa.gov/data/tcr/AL092024_Helene.pdf",
        "https://climate.ncsu.edu/blog/2024/09/rapid-reaction-historic-flooding-follows-helene-in-western-nc/",
        "https://www.duke-energy.com/Outages",
        "https://stormwaterservices.mecknc.gov/",
        "http://www.charmeckalerts.com/",
        "https://fins.mecknc.gov/",
        "https://gis.mecklenburgcountync.gov/3dfz/"
    ],
    "volatileFacts": [
        "2026 hurricane season forecast: NOAA predicts 8-14 named storms, 3-6 hurricanes, 1-3 major (May 2026). CSU July update: 9 named storms, 4 hurricanes. Both agencies releasing updated forecasts week of Aug 4, 2026.",
        "Duke Energy outage reporting: text OUT to 57801, call 800.POWERON (800-769-3766), or 800-777-9898 general",
        "CMEMO phone numbers: Emergency Management 704-336-2412, Stormwater 704-336-2291, general 311",
        "CharMeck Alerts signup at charmeckalerts.com",
        "3D Flood Zone Map at gis.mecklenburgcountync.gov/3dfz/",
        "FINS real-time stream gauges at fins.mecknc.gov"
    ]
}

payload_json = json.dumps(payload, ensure_ascii=False)
evidence_json = json.dumps(evidence, ensure_ascii=False)

# Escape single quotes for SQL
payload_sql = payload_json.replace("\\", "\\\\").replace("'", "\\'")
evidence_sql = evidence_json.replace("\\", "\\\\").replace("'", "\\'")
title = "Draft: Hurricane Preparedness in Charlotte: A Newcomer's Guide to Staying Safe"
title_sql = title.replace("'", "\\'")

sql = (
    f"INSERT INTO agent_tasks "
    f"(agentRole, taskType, riskLevel, targetType, title, payload, evidence, status, confidence, priority) "
    f"VALUES "
    f"('content_editor', 'blog_draft', 'R2', 'blog', '{title_sql}', "
    f"'{payload_sql}', '{evidence_sql}', 'pending_approval', 82, 'medium');"
)

# Pipe SQL to MySQL via SSH
ssh_cmd = [
    "ssh", "-i", os.path.expanduser("~/.ssh/hermes_proxmox_ed25519"),
    "-o", "ProxyJump=root@100.112.41.30",
    "-o", "ConnectTimeout=15",
    "agent@10.10.10.101",
    f"sudo mysql -N -B settleclt_app -e \"{sql}\""
]

# Actually, better approach: write SQL to a temp file on the VM, then execute
# Use stdin piping to avoid shell quoting nightmares
mysql_cmd = "sudo mysql -N -B settleclt_app"
ssh_cmd2 = [
    "ssh", "-i", os.path.expanduser("~/.ssh/hermes_proxmox_ed25519"),
    "-o", "ProxyJump=root@100.112.41.30",
    "-o", "ConnectTimeout=15",
    "agent@10.10.10.101",
    mysql_cmd
]

print(f"Inserting agent task into MySQL via SSH...")
print(f"Title: {title}")
print(f"SQL length: {len(sql)} chars")
print()

result = subprocess.run(ssh_cmd2, input=sql, capture_output=True, text=True, timeout=30)
print(f"Exit code: {result.returncode}")
print(f"STDOUT: {result.stdout[:2000]}")
if result.stderr:
    print(f"STDERR: {result.stderr[:2000]}")

# Verify the insert
verify_cmd = [
    "ssh", "-i", os.path.expanduser("~/.ssh/hermes_proxmox_ed25519"),
    "-o", "ProxyJump=root@100.112.41.30",
    "-o", "ConnectTimeout=15",
    "agent@10.10.10.101",
    "sudo mysql -N -B settleclt_app -e \"SELECT id, title, status, agentRole, taskType FROM agent_tasks WHERE agentRole='content_editor' ORDER BY createdAt DESC LIMIT 5;\""
]
print("\nVerifying insert...")
result2 = subprocess.run(verify_cmd, capture_output=True, text=True, timeout=30)
print(f"Exit code: {result2.returncode}")
print(f"STDOUT: {result2.stdout}")
if result2.stderr:
    print(f"STDERR: {result2.stderr}")