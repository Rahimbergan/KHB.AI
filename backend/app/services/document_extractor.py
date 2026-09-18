import os
import csv
import io
from pathlib import Path

class DocumentExtractor:
    @staticmethod
    def extract_text(file_path: str, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        if not os.path.exists(file_path):
            return ""

        try:
            if ext in [".txt", ".md", ".log"]:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()

            elif ext == ".csv":
                rows = []
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.reader(f)
                    for i, row in enumerate(reader):
                        if i > 100:  # Cap at 100 rows
                            rows.append("... [truncated]")
                            break
                        rows.append(" | ".join(row))
                return "\n".join(rows)

            elif ext == ".json":
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()

            else:
                # For PDF, DOCX, XLSX without binary heavy libs, extract readable ASCII/UTF strings
                with open(file_path, "rb") as f:
                    raw = f.read(1024 * 1024) # Read first 1MB
                    # extract printable chars
                    text = "".join([chr(b) if 32 <= b <= 126 or b in (10, 13) else " " for b in raw])
                    words = [w for w in text.split() if len(w) > 2]
                    return " ".join(words[:2000])

        except Exception as e:
            return f"Xatolik yuz berdi: {str(e)}"
