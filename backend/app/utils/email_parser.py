import re

DEPT_MAP = {
    "aids": "AI&DS", "aiml": "AI&ML", "cse": "CSE",
    "ece": "ECE",    "eee": "EEE",    "it": "IT",
    "mech": "Mechanical", "civil": "Civil", "mba": "MBA",
}

def validate_college_email(email: str, domain: str = "citchennai.net") -> bool:
    return email.lower().endswith(f"@{domain}")

def parse_college_email(email: str) -> dict:
    try:
        prefix = email.split("@")[0].lower()
        match = re.search(r'([a-z]+)(\d{4})$', prefix)
        if not match:
            return {"department": None, "batch_year": None}
        dept  = DEPT_MAP.get(match.group(1))
        year  = int(match.group(2))
        return {"department": dept, "batch_year": f"{year}-{year+4}"}
    except Exception:
        return {"department": None, "batch_year": None}
