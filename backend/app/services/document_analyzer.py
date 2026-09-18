import re
from typing import Dict, Any, List

LEGAL_DISCLAIMER = (
    "This is an informational document analysis, not legal advice. A qualified lawyer should review important decisions."
)


class DocumentAnalyzer:
    @classmethod
    def analyze_document_deterministically(cls, text: str, filename: str, mode: str = "general") -> Dict[str, Any]:
        """
        Extracts parties, dates, monetary amounts, obligations, deadlines, and risks
        using robust pattern matching when Claude is unavailable or as baseline.
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        # 1. Dates (e.g. 2026-01-31, 31.01.2026, January 31, 2026)
        date_patterns = [
            r"\b\d{4}-\d{2}-\d{2}\b",
            r"\b\d{2}\.\d{2}\.\d{4}\b",
            r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b",
        ]
        found_dates = set()
        for pat in date_patterns:
            matches = re.findall(pat, text, flags=re.IGNORECASE)
            for m in matches:
                found_dates.add(m)

        # 2. Amounts (e.g. 1,000,000 UZS, $5,000, 50 000 000 sum)
        amount_patterns = [
            r"\b\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?\s*(?:UZS|USD|EUR|sum|so['`]?m|\$|€)\b",
            r"[\$€]\s*\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?",
        ]
        found_amounts = set()
        for pat in amount_patterns:
            matches = re.findall(pat, text, flags=re.IGNORECASE)
            for m in matches:
                found_amounts.add(m)

        # 3. Parties
        party_candidates = []
        party_keywords = ["Party", "Buyer", "Seller", "Tenant", "Landlord", "Provider", "Client", "Customer", "Company", "LLC", "OOO", "MCHJ"]
        for line in lines[:30]:
            for kw in party_keywords:
                if kw.lower() in line.lower() and len(line) < 120:
                    party_candidates.append(line)
                    break

        # 4. Obligations & Duties
        obligation_keywords = ["shall", "must", "agrees to", "responsible for", "obligation", "will provide", "majbur", "majburiyati"]
        obligations = []
        for line in lines:
            for kw in obligation_keywords:
                if kw in line.lower() and len(line) < 200:
                    obligations.append(line)
                    break

        # 5. Deadlines
        deadline_keywords = ["deadline", "within", "no later than", "by the end of", "expiration", "valid until", "muddat"]
        deadlines = []
        for line in lines:
            for kw in deadline_keywords:
                if kw in line.lower() and len(line) < 200:
                    deadlines.append(line)
                    break

        # 6. Potential Risks
        risk_keywords = ["penalty", "fine", "termination", "breach", "liability", "damages", "default", "loss", "jarima"]
        risks = []
        for line in lines:
            for kw in risk_keywords:
                if kw in line.lower() and len(line) < 250:
                    risks.append(line)
                    break

        # Missing information checks
        missing_info = []
        if not found_dates:
            missing_info.append("No explicit effective date or expiration date specified.")
        if not found_amounts:
            missing_info.append("No explicit monetary sums or payment schedules detected.")
        if not party_candidates:
            missing_info.append("Signatories or legal entity identifiers are unclear or missing.")

        # Summary generation
        summary_sentences = []
        summary_sentences.append(f"Document '{filename}' contains {len(lines)} lines of text.")
        if party_candidates:
            summary_sentences.append(f"Identified potential parties: {', '.join(party_candidates[:2])}.")
        if found_amounts:
            summary_sentences.append(f"Referenced financial terms: {', '.join(list(found_amounts)[:3])}.")
        if deadlines:
            summary_sentences.append(f"Key timing conditions: {deadlines[0]}.")
        summary = " ".join(summary_sentences)

        simple_explanation = (
            f"This document appears to outline agreements, operations, or commercial terms with {len(obligations)} key obligations "
            f"and {len(risks)} liability/penalty stipulations. Review highlighted obligations to ensure compliance with agreed timelines."
        )

        return {
            "summary": summary,
            "parties": party_candidates[:5] if party_candidates else ["Not explicitly structured in text header"],
            "dates": sorted(list(found_dates))[:10],
            "amounts": sorted(list(found_amounts))[:10],
            "obligations": obligations[:8] if obligations else ["Standard contractual performance terms apply."],
            "deadlines": deadlines[:8] if deadlines else ["No specific cutoff deadlines explicitly stated."],
            "risks": risks[:8] if risks else ["No severe penalty or forfeiture clauses identified."],
            "missing_information": missing_info if missing_info else ["No critical structural omissions detected."],
            "simple_explanation": simple_explanation,
            "disclaimer": LEGAL_DISCLAIMER,
        }

