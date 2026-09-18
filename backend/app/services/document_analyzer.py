import re
from typing import Dict, Any, List

DISCLAIMER_LEGAL = "This is an informational document analysis, not legal advice. A qualified lawyer should review important decisions."

class DocumentAnalyzer:
    @staticmethod
    def analyze_content(filename: str, text: str) -> Dict[str, Any]:
        # Regex heuristics for deterministic extraction
        dates = list(set(re.findall(r"\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})\b", text)))[:8]
        amounts = list(set(re.findall(r"\b\d{1,3}(?:[.,\s]\d{3})*(?:\s?(?:UZS|USD|so'm|som|\$|EUR))\b", text, re.IGNORECASE)))[:8]
        
        # Simple extraction heuristics
        parties = []
        for line in text.split("\n")[:30]:
            lower = line.lower()
            if any(k in lower for k in ["mchj", "llc", "korxona", "tomon", "buyurtmachi", "ijarachi", "mijoz", "kompaniya"]):
                clean_line = line.strip()[:100]
                if clean_line and clean_line not in parties:
                    parties.append(clean_line)
        if not parties:
            parties = ["Aniqlanmadi (Hujjat matnida ko'rsatilmagan)"]

        # Obligations / Key clauses
        obligations = []
        for line in text.split("\n"):
            lower = line.lower()
            if any(k in lower for k in ["majbur", "lozim", "shart", "to'lov", "muddat", "yetkazib", "talab"]):
                clean_line = line.strip()[:150]
                if clean_line and len(clean_line) > 15 and clean_line not in obligations:
                    obligations.append(clean_line)
                if len(obligations) >= 5:
                    break

        # Risks identification
        risks = []
        lower_text = text.lower()
        if "jarima" in lower_text or "penya" in lower_text or "penalty" in lower_text:
            risks.append("Kechiktirilgan to'lovlar uchun jarima yoki penya sanksiyalari mavjud.")
        if "bekor qilish" in lower_text or "bir tomonlama" in lower_text:
            risks.append("Shartnomani bir tomonlama bekor qilish shartlari mavjud.")
        if not amounts:
            risks.append("Aniq moliyaviy summa yoki to'lov miqdori to'liq ko'rsatilmagan.")
        if not dates:
            risks.append("Ijro yoki to'lovning aniq yakuniy muddatlari ko'rsatilmagan.")
        if not risks:
            risks.append("Muhim xavfli shartlar topilmadi, standart shartnoma qoidalari.")

        summary = (
            f"'{filename}' hujjati tahlil qilindi. Jami {len(text.split())} so'zdan iborat. "
            f"Hujjatda {len(parties)} ta tomon, {len(dates)} ta sana va {len(amounts)} ta moliyaviy summa aniqlandi."
        )

        return {
            "filename": filename,
            "summary": summary,
            "parties": parties[:5],
            "dates": dates,
            "amounts": amounts,
            "obligations": obligations[:6],
            "risks": risks,
            "word_count": len(text.split()),
            "disclaimer": DISCLAIMER_LEGAL
        }
