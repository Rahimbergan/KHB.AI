import json
import uuid
from flask import Blueprint, request, jsonify
from backend.app.extensions import db
from backend.app.models import Conversation, Message
from backend.app.services.agent_orchestrator import MainAdvisorAgent
from backend.app.utils.errors import NotFoundError, ValidationError

conversations_bp = Blueprint("conversations", __name__, url_prefix="/api/v1/conversations")


@conversations_bp.route("", methods=["POST"])
def create_conversation():
    body = request.get_json(silent=True) or {}
    title = body.get("title", "New Conversation")
    conv_id = body.get("id") or str(uuid.uuid4())

    conv = Conversation(id=conv_id, title=title)
    db.session.add(conv)
    db.session.commit()
    return jsonify(conv.to_dict()), 201


@conversations_bp.route("", methods=["GET"])
def list_conversations():
    convs = Conversation.query.order_by(Conversation.updated_at.desc()).all()
    return jsonify([c.to_dict() for c in convs]), 200


@conversations_bp.route("/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id: str):
    conv = db.session.get(Conversation, conversation_id)
    if not conv:
        raise NotFoundError(f"Conversation with id '{conversation_id}' not found.")
    return jsonify(conv.to_dict(include_messages=True)), 200


@conversations_bp.route("/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id: str):
    conv = db.session.get(Conversation, conversation_id)
    if not conv:
        raise NotFoundError(f"Conversation with id '{conversation_id}' not found.")
    db.session.delete(conv)
    db.session.commit()
    return jsonify({"success": True, "message": f"Conversation '{conversation_id}' deleted."}), 200


@conversations_bp.route("/<conversation_id>/messages", methods=["POST"])
def send_message(conversation_id: str):
    body = request.get_json(silent=True) or {}
    content = body.get("content", "").strip()
    if not content:
        raise ValidationError("Message 'content' is required and cannot be empty.")

    attachment_ids = body.get("attachment_ids", [])
    context = body.get("context", {})

    # Ensure conversation exists; auto-create if needed (e.g. for "demo" or client-generated ids)
    conv = db.session.get(Conversation, conversation_id)
    if not conv:
        conv = Conversation(
            id=conversation_id,
            title=content[:30] + ("..." if len(content) > 30 else ""),
        )
        db.session.add(conv)
        db.session.flush()

    # Record user message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=content,
        context_json=json.dumps(context),
    )
    db.session.add(user_msg)
    db.session.flush()

    # Process message through AI Agent Pipeline
    advisor = MainAdvisorAgent()
    agent_output = advisor.process_message(
        conversation_id=conversation_id,
        user_content=content,
        attachment_ids=attachment_ids,
        context=context,
    )

    # Record assistant message
    asst_msg_data = agent_output["message"]
    asst_msg = Message(
        id=asst_msg_data["id"],
        conversation_id=conversation_id,
        role="assistant",
        content=asst_msg_data["content"],
        sources_json=json.dumps(agent_output.get("sources", [])),
        usage_json=json.dumps(agent_output.get("usage", {})),
    )
    db.session.add(asst_msg)

    # Link created artifacts to the assistant message
    from backend.app.models import Artifact
    for art_data in agent_output.get("artifacts", []):
        art_entity = db.session.get(Artifact, art_data["id"])
        if art_entity:
            art_entity.message_id = asst_msg.id

    db.session.commit()

    return jsonify(agent_output), 200
