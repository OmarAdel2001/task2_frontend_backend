import re
from typing import List, Tuple
from .schemas import ThreatIndicator, ScanResult

def analyze_content(content: str) -> ScanResult:
    indicators: List[ThreatIndicator] = []
    score = 100

    if not content or len(content.strip()) < 5:
        return ScanResult(
            score=100,
            level="Safe",
            indicators=[
                ThreatIndicator(type="safe", message="No content analyzed. Input is empty or too short.")
            ]
        )

    normalized = content.lower()

    # 1. URL Analysis
    # Match strings starting with http:// or https:// up to whitespace or quotes
    url_regex = r"(https?://[^\s]+)"
    urls = re.findall(url_regex, content)

    if len(urls) > 0:
        indicators.append(
            ThreatIndicator(type="warning", message=f"Found {len(urls)} link(s) in the analyzed content.")
        )

        for url in urls:
            # Check for HTTP instead of HTTPS
            if url.startswith("http://"):
                score -= 20
                indicators.append(
                    ThreatIndicator(
                        type="danger",
                        message=f'Insecure connection: Link "{url[:40]}..." uses http instead of https.'
                    )
                )

            # Check for suspicious words in domains
            suspicious_domain_words = [
                "verify", "update", "login", "secure", "account", "signin",
                "support", "billing", "banking", "netflix", "paypal", "google",
                "microsoft", "amazon", "apple"
            ]
            legitimate_domains = [
                "paypal.com", "google.com", "microsoft.com", "amazon.com",
                "apple.com", "netflix.com"
            ]

            for word in suspicious_domain_words:
                if word in url:
                    # check if it is part of a legitimate domain
                    is_legitimate = any(legit in url for legit in legitimate_domains)
                    if not is_legitimate:
                        score -= 15
                        indicators.append(
                            ThreatIndicator(
                                type="danger",
                                message=f'Suspicious domain keyword: Link contains "{word}" which is commonly used to spoof domains.'
                            )
                        )

            # Check for IP addresses instead of domains (e.g. //192.168.1.1)
            ip_regex = r"//(\d{1,3}\.){3}\d{1,3}"
            if re.search(ip_regex, url):
                score -= 25
                indicators.append(
                    ThreatIndicator(
                        type="danger",
                        message="IP address used as link host. Legitimate organizations rarely use IP addresses directly."
                    )
                )

            # Check for long subdomains or dash usage
            # Strip scheme (http:// or https://)
            hostname_match = re.search(r"https?://([^/]+)", url)
            if hostname_match:
                hostname = hostname_match.group(1)
                if len(hostname.split(".")) > 4:
                    score -= 10
                    indicators.append(
                        ThreatIndicator(
                            type="warning",
                            message=f'Extremely long subdomain structure in "{hostname[:30]}...". This is often used to hide the actual domain name.'
                        )
                    )

                if "-" in hostname and any("-" in part for part in hostname.split(".")):
                    score -= 5
                    indicators.append(
                        ThreatIndicator(
                            type="warning",
                            message="Domain contains hyphens in subdomains, often a tactic to mimic official brands."
                        )
                    )

    # 2. Text / Content Analysis (Urgency, Greetings, Bad Grammar)
    urgent_keywords = [
        "urgent", "immediate action", "suspend", "restricted", "unauthorized",
        "expire", "security breach", "verify your account", "action required",
        "reset password immediately", "compromised"
    ]
    urgent_count = sum(1 for kw in urgent_keywords if kw in normalized)
    if urgent_count > 0:
        score -= (10 * urgent_count)
        indicators.append(
            ThreatIndicator(
                type="danger",
                message=f"High urgency language: Found {urgent_count} phishing-related pressure words (e.g. urgent, suspended, verify)."
            )
        )

    # Generic greetings
    generic_greetings = [
        "dear customer", "dear user", "valued customer", "undisclosed-recipients", "hello user"
    ]
    generic_found = any(greeting in normalized for greeting in generic_greetings)
    if generic_found:
        score -= 10
        indicators.append(
            ThreatIndicator(
                type="warning",
                message="Generic greeting detected: Phishing emails often use generic greetings instead of your name."
            )
        )

    # Financial request trigger
    financial_triggers = [
        "bank transfer", "wire transfer", "routing number", "credit card details",
        "social security", "gift card", "bitcoin", "cryptocurrency", "tax refund",
        "invoice payment"
    ]
    finance_count = sum(1 for trigger in financial_triggers if trigger in normalized)
    if finance_count > 0:
        score -= 15
        indicators.append(
            ThreatIndicator(
                type="danger",
                message="Financial/Identity trigger: Content requests sensitive information, transfers, or banking details."
            )
        )

    # Guarantee score is within bounds
    score = max(0, min(100, score))

    # Determine threat level
    level = "Safe"
    if score < 50:
        level = "Dangerous"
    elif score < 85:
        level = "Suspicious"

    # If no negative indicators, add a positive one
    if len(indicators) == 0:
        indicators.append(
            ThreatIndicator(
                type="safe",
                message="No suspicious keywords, insecure URLs, or phishing patterns detected. This content appears normal."
            )
        )
    elif score >= 85:
        indicators.append(
            ThreatIndicator(
                type="safe",
                message="Basic security structures are intact, though minor precautions are recommended."
            )
        )

    return ScanResult(score=score, level=level, indicators=indicators)
