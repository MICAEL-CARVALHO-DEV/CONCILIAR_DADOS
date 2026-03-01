"""add google auth fields to usuarios

Revision ID: 20260301_0008
Revises: 20260301_0007
Create Date: 2026-03-01 11:35:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260301_0008"
down_revision: Union[str, None] = "20260301_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("usuarios", sa.Column("google_sub", sa.String(length=255), nullable=True))

    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_email_ci ON usuarios (lower(email))")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_google_sub ON usuarios (google_sub)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_usuarios_google_sub")
    op.execute("DROP INDEX IF EXISTS ux_usuarios_email_ci")

    op.drop_column("usuarios", "google_sub")
    op.drop_column("usuarios", "email")
