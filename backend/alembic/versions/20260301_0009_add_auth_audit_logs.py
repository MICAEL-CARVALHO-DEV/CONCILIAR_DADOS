"""add auth audit logs

Revision ID: 20260301_0009
Revises: 20260301_0008
Create Date: 2026-03-01 19:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260301_0009"
down_revision = "20260301_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("user_nome", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("login_identificador", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False, server_default="LOCAL"),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("ip_origem", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("user_agent", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_auth_audit_logs_user_id", "auth_audit_logs", ["user_id"])
    op.create_index("ix_auth_audit_logs_event_type", "auth_audit_logs", ["event_type"])


def downgrade() -> None:
    op.drop_index("ix_auth_audit_logs_event_type", table_name="auth_audit_logs")
    op.drop_index("ix_auth_audit_logs_user_id", table_name="auth_audit_logs")
    op.drop_table("auth_audit_logs")
