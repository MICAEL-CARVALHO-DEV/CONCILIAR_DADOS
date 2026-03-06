"""create emenda_locks table

Revision ID: 20260306_0013
Revises: 20260306_0011
Create Date: 2026-03-06 12:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260306_0013"
down_revision = "20260306_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "emenda_locks" not in tables:
        op.create_table(
            "emenda_locks",
            sa.Column("emenda_id", sa.Integer(), sa.ForeignKey("emendas.id"), primary_key=True),
            sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
            sa.Column("usuario_nome", sa.String(length=120), nullable=False, server_default=""),
            sa.Column("setor", sa.String(length=40), nullable=False, server_default=""),
            sa.Column("acquired_at", sa.DateTime(), nullable=False),
            sa.Column("heartbeat_at", sa.DateTime(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
        )

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("emenda_locks")} if "emenda_locks" in set(inspector.get_table_names()) else set()
    if "ix_emenda_locks_expires_at" not in existing_indexes:
        op.create_index("ix_emenda_locks_expires_at", "emenda_locks", ["expires_at"])
    if "ix_emenda_locks_usuario_id" not in existing_indexes:
        op.create_index("ix_emenda_locks_usuario_id", "emenda_locks", ["usuario_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "emenda_locks" not in tables:
        return

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("emenda_locks")}
    if "ix_emenda_locks_usuario_id" in existing_indexes:
        op.drop_index("ix_emenda_locks_usuario_id", table_name="emenda_locks")
    if "ix_emenda_locks_expires_at" in existing_indexes:
        op.drop_index("ix_emenda_locks_expires_at", table_name="emenda_locks")

    op.drop_table("emenda_locks")
