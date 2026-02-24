"""add escopo_exportacao to export_logs

Revision ID: 20260224_0005
Revises: 20260224_0004
Create Date: 2026-02-24 22:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260224_0005"
down_revision: Union[str, None] = "20260224_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "export_logs" not in tables:
        return

    cols = {c["name"] for c in insp.get_columns("export_logs")}
    if "escopo_exportacao" not in cols:
        op.add_column(
            "export_logs",
            sa.Column("escopo_exportacao", sa.String(length=20), nullable=False, server_default="ATUAIS"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "export_logs" not in tables:
        return

    cols = {c["name"] for c in insp.get_columns("export_logs")}
    if "escopo_exportacao" in cols:
        op.drop_column("export_logs", "escopo_exportacao")
