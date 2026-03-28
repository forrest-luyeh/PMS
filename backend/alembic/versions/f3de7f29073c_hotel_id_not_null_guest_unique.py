"""hotel_id_not_null_guest_unique

Revision ID: f3de7f29073c
Revises: 4db4f2bbca2a
Create Date: 2026-03-25 15:33:56.021360

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3de7f29073c'
down_revision: Union[str, Sequence[str], None] = '4db4f2bbca2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — SQLite requires batch mode for column changes."""
    for table in ('folios', 'reservations', 'room_types', 'rooms'):
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column('hotel_id', existing_type=sa.INTEGER(), nullable=False)

    with op.batch_alter_table('guests') as batch_op:
        batch_op.alter_column('hotel_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.create_unique_constraint('uq_guest_hotel_id_number', ['hotel_id', 'id_number'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('guests') as batch_op:
        batch_op.drop_constraint('uq_guest_hotel_id_number', type_='unique')
        batch_op.alter_column('hotel_id', existing_type=sa.INTEGER(), nullable=True)

    for table in ('folios', 'reservations', 'room_types', 'rooms'):
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column('hotel_id', existing_type=sa.INTEGER(), nullable=True)
