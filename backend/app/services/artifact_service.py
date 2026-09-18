import json
import uuid
from typing import Dict, Any, List, Optional
from backend.app.extensions import db
from backend.app.models import Artifact
from backend.app.utils.dates import format_iso


class ArtifactService:
    @staticmethod
    def create_artifact(
        artifact_type: str,
        title: str,
        data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        source_ids: Optional[List[str]] = None,
        message_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Artifact:
        artifact = Artifact(
            id=str(uuid.uuid4()),
            message_id=message_id,
            conversation_id=conversation_id,
            type=artifact_type,
            title=title,
            description=description,
            data_json=json.dumps(data),
            config_json=json.dumps(config or {}),
            source_ids_json=json.dumps(source_ids or []),
        )
        db.session.add(artifact)
        db.session.flush()
        return artifact

    @classmethod
    def create_metric_artifact(
        cls,
        title: str,
        value: Any,
        formatted_value: str,
        change_percent: Optional[float] = None,
        trend: str = "neutral",
        description: Optional[str] = None,
        message_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Artifact:
        data = {
            "value": value,
            "formatted_value": formatted_value,
            "change_percent": change_percent,
            "trend": trend,
        }
        return cls.create_artifact(
            artifact_type="metric",
            title=title,
            description=description,
            data=data,
            message_id=message_id,
            conversation_id=conversation_id,
        )

    @classmethod
    def create_line_chart_artifact(
        cls,
        title: str,
        x_key: str,
        series: List[Dict[str, Any]],
        rows: List[Dict[str, Any]],
        description: Optional[str] = None,
        message_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Artifact:
        data = {
            "x_key": x_key,
            "series": series,
            "rows": rows,
        }
        return cls.create_artifact(
            artifact_type="line_chart",
            title=title,
            description=description,
            data=data,
            message_id=message_id,
            conversation_id=conversation_id,
        )

    @classmethod
    def create_bar_chart_artifact(
        cls,
        title: str,
        x_key: str,
        series: List[Dict[str, Any]],
        rows: List[Dict[str, Any]],
        description: Optional[str] = None,
        message_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Artifact:
        data = {
            "x_key": x_key,
            "series": series,
            "rows": rows,
        }
        return cls.create_artifact(
            artifact_type="bar_chart",
            title=title,
            description=description,
            data=data,
            message_id=message_id,
            conversation_id=conversation_id,
        )

    @classmethod
    def create_table_artifact(
        cls,
        title: str,
        columns: List[str],
        rows: List[Dict[str, Any]],
        description: Optional[str] = None,
        message_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Artifact:
        data = {
            "columns": columns,
            "rows": rows,
        }
        return cls.create_artifact(
            artifact_type="table",
            title=title,
            description=description,
            data=data,
            message_id=message_id,
            conversation_id=conversation_id,
        )

    @classmethod
    def create_document_extract_artifact(
        cls,
        title: str,
        analysis_data: Dict[str, Any],
        description: Optional[str] = None,
        source_ids: Optional[List[str]] = None,
        message_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Artifact:
        return cls.create_artifact(
            artifact_type="document_extract",
            title=title,
            description=description,
            data=analysis_data,
            source_ids=source_ids,
            message_id=message_id,
            conversation_id=conversation_id,
        )

    @staticmethod
    def get_artifact_by_id(artifact_id: str) -> Optional[Artifact]:
        return db.session.get(Artifact, artifact_id)
