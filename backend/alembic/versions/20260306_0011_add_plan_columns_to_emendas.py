"""add plan_a and plan_b to emendas

Revision ID: 20260306_0011
Revises: 20260305_0010
Create Date: 2026-03-06 10:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260306_0011"
down_revision = "20260305_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "emendas" not in tables:
        return

    cols = {c["name"] for c in inspector.get_columns("emendas")}
    if "plan_a" not in cols:
        op.add_column(
            "emendas",
            sa.Column("plan_a", sa.Text(), nullable=False, server_default=""),
        )
    if "plan_b" not in cols:
        op.add_column(
            "emendas",
            sa.Column("plan_b", sa.Text(), nullable=False, server_default=""),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "emendas" not in tables:
        return

    cols = {c["name"] for c in inspector.get_columns("emendas")}
    if "plan_b" in cols:
        op.drop_column("emendas", "plan_b")
    if "plan_a" in cols:
        op.drop_column("emendas", "plan_a")

