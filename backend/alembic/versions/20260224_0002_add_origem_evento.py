"""add origem_evento on historico

Revision ID: 20260224_0002
Revises: 20260223_0001
Create Date: 2026-02-24 00:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260224_0002"
down_revision: Union[str, None] = "20260223_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("historico")}
    if "origem_evento" not in cols:
        op.add_column(
            "historico",
            sa.Column("origem_evento", sa.String(length=20), nullable=False, server_default="API"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("historico")}
    if "origem_evento" in cols:
        op.drop_column("historico", "origem_evento")
