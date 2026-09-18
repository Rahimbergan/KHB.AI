import json
import os
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from backend.app.config import Config
from backend.app.extensions import db
from backend.app.models import UploadedFile
from backend.app.services.document_extractor import DocumentExtractor
from backend.app.services.document_analyzer import DocumentAnalyzer
from backend.app.utils.errors import NotFoundError, ValidationError, BadRequestError

files_bp = Blueprint("files", __name__, url_prefix="/api/v1/files")


@files_bp.route("", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        raise BadRequestError("No file provided in request (expected multipart form key 'file').")

    file_obj = request.files["file"]
    if not file_obj or not file_obj.filename:
        raise BadRequestError("No file selected for upload.")

    filename = file_obj.filename
    # Check length
    file_obj.seek(0, os.SEEK_END)
    file_size = file_obj.tell()
    file_obj.seek(0)

    # Validate size & extension
    ext = DocumentExtractor.validate_file(
        filename=filename,
        file_size=file_size,
        allowed_extensions=Config.ALLOWED_EXTENSIONS,
        max_size_bytes=Config.MAX_CONTENT_LENGTH,
    )

    # Save safely
    orig_name, stored_name, actual_size = DocumentExtractor.save_file_safely(
        file_obj, Config.UPLOAD_DIR
    )

    # Extract text and metadata
    stored_path = os.path.join(Config.UPLOAD_DIR, stored_name)
    extracted_text, metadata = DocumentExtractor.extract_content(stored_path, ext)

    uploaded_file = UploadedFile(
        id=str(uuid.uuid4()),
        filename=orig_name,
        stored_filename=stored_name,
        file_type=ext,
        file_size=actual_size,
        extracted_text=extracted_text,
        extracted_metadata_json=json.dumps(metadata),
    )
    db.session.add(uploaded_file)
    db.session.commit()

    return jsonify(uploaded_file.to_dict()), 201


@files_bp.route("", methods=["GET"])
def list_files():
    files = UploadedFile.query.order_by(UploadedFile.created_at.desc()).all()
    return jsonify([f.to_dict() for f in files]), 200


@files_bp.route("/<file_id>", methods=["GET"])
def get_file_detail(file_id: str):
    uf = db.session.get(UploadedFile, file_id)
    if not uf:
        raise NotFoundError(f"File with id '{file_id}' not found.")
    return jsonify(uf.to_dict(include_full_text=True)), 200


@files_bp.route("/<file_id>/download", methods=["GET"])
def download_file(file_id: str):
    uf = db.session.get(UploadedFile, file_id)
    if not uf:
        raise NotFoundError(f"File with id '{file_id}' not found.")

    upload_dir = Path(Config.UPLOAD_DIR).resolve()
    stored_path = (upload_dir / uf.stored_filename).resolve()

    # Prevent traversal
    if not str(stored_path).startswith(str(upload_dir)) or not stored_path.exists():
        raise NotFoundError("Stored file not found on filesystem.")

    return send_from_directory(
        directory=str(upload_dir),
        path=uf.stored_filename,
        as_attachment=True,
        download_name=uf.filename,
    )


@files_bp.route("/<file_id>/analyze", methods=["POST"])
def analyze_file(file_id: str):
    uf = db.session.get(UploadedFile, file_id)
    if not uf:
        raise NotFoundError(f"File with id '{file_id}' not found.")

    body = request.get_json(silent=True) or {}
    mode = body.get("mode", "general")

    if not uf.extracted_text:
        # Re-extract if text was empty
        stored_path = os.path.join(Config.UPLOAD_DIR, uf.stored_filename)
        if os.path.exists(stored_path):
            uf.extracted_text, _ = DocumentExtractor.extract_content(stored_path, uf.file_type)
            db.session.commit()

    analysis_res = DocumentAnalyzer.analyze_document_deterministically(
        text=uf.extracted_text or "",
        filename=uf.filename,
        mode=mode,
    )
    analysis_res["file_id"] = uf.id
    analysis_res["filename"] = uf.filename

    return jsonify(analysis_res), 200
