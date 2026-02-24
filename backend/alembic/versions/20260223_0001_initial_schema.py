"""initial schema

Revision ID: 20260223_0001
Revises:
Create Date: 2026-02-23 23:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260223_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("setor", sa.String(length=40), nullable=False),
        sa.Column("perfil", sa.String(length=40), nullable=False),
        sa.Column("senha_salt", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("senha_hash", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("ultimo_login", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_usuarios_nome", "usuarios", ["nome"], unique=False)

    op.create_table(
        "emendas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("id_interno", sa.String(length=40), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("identificacao", sa.String(length=255), nullable=False),
        sa.Column("cod_subfonte", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("deputado", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("cod_uo", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("sigla_uo", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("cod_orgao", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("cod_acao", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("descricao_acao", sa.Text(), nullable=False, server_default=""),
        sa.Column("municipio", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("valor_inicial", sa.Numeric(16, 2), nullable=False, server_default="0"),
        sa.Column("valor_atual", sa.Numeric(16, 2), nullable=False, server_default="0"),
        sa.Column("processo_sei", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("status_oficial", sa.String(length=60), nullable=False, server_default="Recebido"),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["emendas.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_emendas_id_interno", "emendas", ["id_interno"], unique=True)
    op.create_index("ix_emendas_parent_id", "emendas", ["parent_id"], unique=False)

    op.create_table(
        "usuario_sessoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_usuario_sessoes_usuario_id", "usuario_sessoes", ["usuario_id"], unique=False)
    op.create_index("ix_usuario_sessoes_token_hash", "usuario_sessoes", ["token_hash"], unique=True)

    op.create_table(
        "historico",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("emenda_id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("usuario_nome", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("setor", sa.String(length=40), nullable=False, server_default=""),
        sa.Column("tipo_evento", sa.String(length=40), nullable=False),
        sa.Column("campo_alterado", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("valor_antigo", sa.Text(), nullable=False, server_default=""),
        sa.Column("valor_novo", sa.Text(), nullable=False, server_default=""),
        sa.Column("motivo", sa.Text(), nullable=False, server_default=""),
        sa.Column("data_hora", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["emenda_id"], ["emendas.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_historico_emenda_id", "historico", ["emenda_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_historico_emenda_id", table_name="historico")
    op.drop_table("historico")

    op.drop_index("ix_usuario_sessoes_token_hash", table_name="usuario_sessoes")
    op.drop_index("ix_usuario_sessoes_usuario_id", table_name="usuario_sessoes")
    op.drop_table("usuario_sessoes")

    op.drop_index("ix_emendas_parent_id", table_name="emendas")
    op.drop_index("ix_emendas_id_interno", table_name="emendas")
    op.drop_table("emendas")

    op.drop_index("ix_usuarios_nome", table_name="usuarios")
    op.drop_table("usuarios")