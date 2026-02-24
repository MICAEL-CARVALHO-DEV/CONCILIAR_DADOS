"""create import_linhas table

Revision ID: 20260224_0004
Revises: 20260224_0003
Create Date: 2026-02-24 01:35:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260224_0004"
down_revision: Union[str, None] = "20260224_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "import_linhas" not in tables:
        op.create_table(
            "import_linhas",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("lote_id", sa.Integer(), nullable=False),
            sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("sheet_name", sa.String(length=120), nullable=False, server_default=""),
            sa.Column("row_number", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("status_linha", sa.String(length=30), nullable=False, server_default="UNCHANGED"),
            sa.Column("id_interno", sa.String(length=60), nullable=False, server_default=""),
            sa.Column("ref_key", sa.String(length=255), nullable=False, server_default=""),
            sa.Column("mensagem", sa.Text(), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["lote_id"], ["lotes_importacao.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_import_linhas_lote_id", "import_linhas", ["lote_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "import_linhas" in tables:
        op.drop_index("ix_import_linhas_lote_id", table_name="import_linhas")
        op.drop_table("import_linhas")
