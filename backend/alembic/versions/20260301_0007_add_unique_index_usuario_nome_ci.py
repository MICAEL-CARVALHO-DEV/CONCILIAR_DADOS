"""add case-insensitive unique index for usuarios.nome

Revision ID: 20260301_0007
Revises: 20260224_0006
Create Date: 2026-03-01 10:40:00
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import inspect, text


revision: str = "20260301_0007"
down_revision: Union[str, None] = "20260224_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "usuarios" not in tables:
        return

    duplicate_rows = list(
        bind.execute(
            text(
                """
                SELECT lower(nome) AS nome_key, COUNT(*) AS total
                FROM usuarios
                GROUP BY lower(nome)
                HAVING COUNT(*) > 1
                ORDER BY lower(nome)
                """
            )
        )
    )
    if duplicate_rows:
        duplicate_names = ", ".join(str(row[0]) for row in duplicate_rows[:10])
        raise RuntimeError(
            "nao foi possivel criar indice unico de usuarios.nome; "
            "existem nomes duplicados (case-insensitive): " + duplicate_names
        )

    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_nome_ci ON usuarios (lower(nome))")


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "usuarios" in tables:
        op.execute("DROP INDEX IF EXISTS ux_usuarios_nome_ci")
