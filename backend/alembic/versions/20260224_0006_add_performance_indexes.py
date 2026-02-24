"""add performance indexes for operations

Revision ID: 20260224_0006
Revises: 20260224_0005
Create Date: 2026-02-24 23:35:00
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import inspect


revision: str = "20260224_0006"
down_revision: Union[str, None] = "20260224_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "emendas" in tables:
        op.execute("CREATE INDEX IF NOT EXISTS ix_emendas_status_oficial ON emendas(status_oficial)")
        op.execute("CREATE INDEX IF NOT EXISTS ix_emendas_updated_at ON emendas(updated_at)")
        op.execute("CREATE INDEX IF NOT EXISTS ix_emendas_is_current ON emendas(is_current)")

    if "historico" in tables:
        op.execute("CREATE INDEX IF NOT EXISTS ix_historico_data_hora ON historico(data_hora)")

    if "import_linhas" in tables:
        op.execute("CREATE INDEX IF NOT EXISTS ix_import_linhas_id_interno ON import_linhas(id_interno)")
        op.execute("CREATE INDEX IF NOT EXISTS ix_import_linhas_ref_key ON import_linhas(ref_key)")

    if "export_logs" in tables:
        op.execute("CREATE INDEX IF NOT EXISTS ix_export_logs_created_at ON export_logs(created_at)")


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    tables = set(insp.get_table_names())

    if "export_logs" in tables:
        op.execute("DROP INDEX IF EXISTS ix_export_logs_created_at")

    if "import_linhas" in tables:
        op.execute("DROP INDEX IF EXISTS ix_import_linhas_ref_key")
        op.execute("DROP INDEX IF EXISTS ix_import_linhas_id_interno")

    if "historico" in tables:
        op.execute("DROP INDEX IF EXISTS ix_historico_data_hora")

    if "emendas" in tables:
        op.execute("DROP INDEX IF EXISTS ix_emendas_is_current")
        op.execute("DROP INDEX IF EXISTS ix_emendas_updated_at")
        op.execute("DROP INDEX IF EXISTS ix_emendas_status_oficial")
