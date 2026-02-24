"""create import/export operational logs

Revision ID: 20260224_0003
Revises: 20260224_0002
Create Date: 2026-02-24 00:40:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "20260224_0003"
down_revision: Union[str, None] = "20260224_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "lotes_importacao" not in tables:
        op.create_table(
            "lotes_importacao",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("arquivo_nome", sa.String(length=255), nullable=False),
            sa.Column("arquivo_hash", sa.String(length=128), nullable=False, server_default=""),
            sa.Column("linhas_lidas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("linhas_validas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("linhas_ignoradas", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("registros_criados", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("registros_atualizados", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("sem_alteracao", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("duplicidade_id", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("duplicidade_ref", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("duplicidade_arquivo", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("conflito_id_ref", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("abas_lidas", sa.Text(), nullable=False, server_default=""),
            sa.Column("observacao", sa.Text(), nullable=False, server_default=""),
            sa.Column("origem_evento", sa.String(length=20), nullable=False, server_default="IMPORT"),
            sa.Column("usuario_id", sa.Integer(), nullable=True),
            sa.Column("usuario_nome", sa.String(length=120), nullable=False, server_default=""),
            sa.Column("setor", sa.String(length=40), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if "export_logs" not in tables:
        op.create_table(
            "export_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("formato", sa.String(length=10), nullable=False),
            sa.Column("arquivo_nome", sa.String(length=255), nullable=False),
            sa.Column("quantidade_registros", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("quantidade_eventos", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("filtros_json", sa.Text(), nullable=False, server_default=""),
            sa.Column("modo_headers", sa.String(length=30), nullable=False, server_default="normalizados"),
            sa.Column("round_trip_ok", sa.Boolean(), nullable=True),
            sa.Column("round_trip_issues", sa.Text(), nullable=False, server_default=""),
            sa.Column("origem_evento", sa.String(length=20), nullable=False, server_default="EXPORT"),
            sa.Column("usuario_id", sa.Integer(), nullable=True),
            sa.Column("usuario_nome", sa.String(length=120), nullable=False, server_default=""),
            sa.Column("setor", sa.String(length=40), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "export_logs" in tables:
        op.drop_table("export_logs")
    if "lotes_importacao" in tables:
        op.drop_table("lotes_importacao")
