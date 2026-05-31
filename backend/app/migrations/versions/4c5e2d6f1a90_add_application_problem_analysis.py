"""Add application problem and commission analysis

Revision ID: 4c5e2d6f1a90
Revises: 9bb1e384aa47
Create Date: 2026-05-20 08:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4c5e2d6f1a90"
down_revision: Union[str, Sequence[str], None] = "9bb1e384aa47"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("problem", sa.Text(), nullable=True))
    op.add_column("applications", sa.Column("commission_analysis", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("applications", "commission_analysis")
    op.drop_column("applications", "problem")
