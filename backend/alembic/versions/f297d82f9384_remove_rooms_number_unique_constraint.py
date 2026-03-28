"""remove_rooms_number_unique_constraint

Revision ID: f297d82f9384
Revises: 333bab161081
Create Date: 2026-03-27 22:41:04.110109

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f297d82f9384'
down_revision: Union[str, Sequence[str], None] = '333bab161081'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE rooms_new (
            id INTEGER NOT NULL PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            number VARCHAR NOT NULL,
            floor INTEGER NOT NULL,
            room_type_id INTEGER NOT NULL REFERENCES room_types (id),
            status VARCHAR(12) NOT NULL,
            notes TEXT
        )
    """)
    op.execute("INSERT INTO rooms_new SELECT id, hotel_id, number, floor, room_type_id, status, notes FROM rooms")
    op.execute("DROP TABLE rooms")
    op.execute("ALTER TABLE rooms_new RENAME TO rooms")
    op.create_index('ix_rooms_id',       'rooms', ['id'],       unique=False)
    op.create_index('ix_rooms_hotel_id', 'rooms', ['hotel_id'], unique=False)


def downgrade() -> None:
    pass
