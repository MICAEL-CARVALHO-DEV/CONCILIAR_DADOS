"""add row_version to emendas

Revision ID: 20260305_0010
Revises: 20260301_0009
Create Date: 2026-03-05 16:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260305_0010"
down_revision = "20260301_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "emendas" not in tables:
        return

    cols = {c["name"] for c in inspector.get_columns("emendas")}
    if "row_version" not in cols:
        op.add_column(
            "emendas",
            sa.Column("row_version", sa.Integer(), nullable=False, server_default="1"),
        )
        op.execute("UPDATE emendas SET row_version = 1 WHERE row_version IS NULL")

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("emendas")}
    if "ix_emendas_row_version" not in existing_indexes:
        op.create_index("ix_emendas_row_version", "emendas", ["row_version"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "emendas" not in tables:
        return

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("emendas")}
    if "ix_emendas_row_version" in existing_indexes:
        op.drop_index("ix_emendas_row_version", table_name="emendas")

    cols = {c["name"] for c in inspector.get_columns("emendas")}
    if "row_version" in cols:
        op.drop_column("emendas", "row_version")
