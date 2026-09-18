from flask import Blueprint, jsonify
from backend.app.services.artifact_service import ArtifactService
from backend.app.utils.errors import NotFoundError

artifacts_bp = Blueprint("artifacts", __name__, url_prefix="/api/v1/artifacts")


@artifacts_bp.route("/<artifact_id>", methods=["GET"])
def get_artifact(artifact_id: str):
    art = ArtifactService.get_artifact_by_id(artifact_id)
    if not art:
        raise NotFoundError(f"Artifact with id '{artifact_id}' not found.")
    return jsonify(art.to_dict()), 200

