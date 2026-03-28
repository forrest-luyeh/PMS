"""remove_room_types_name_unique_constraint

Revision ID: 333bab161081
Revises: fa775435e906
Create Date: 2026-03-27 05:37:25.872308

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '333bab161081'
down_revision: Union[str, Sequence[str], None] = 'fa775435e906'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite unnamed UNIQUE constraint — recreate via raw DDL
    op.execute("""
        CREATE TABLE room_types_new (
            id INTEGER NOT NULL PRIMARY KEY,
            hotel_id INTEGER NOT NULL,
            name VARCHAR NOT NULL,
            description TEXT,
            base_rate NUMERIC(10, 2) NOT NULL,
            max_occupancy INTEGER NOT NULL,
            room_code VARCHAR,
            bed_type VARCHAR,
            has_window BOOLEAN,
            size_sqm NUMERIC(6, 1)
        )
    """)
    op.execute("""
        INSERT INTO room_types_new
        SELECT id, hotel_id, name, description, base_rate, max_occupancy,
               room_code, bed_type, has_window, size_sqm
        FROM room_types
    """)
    op.execute("DROP TABLE room_types")
    op.execute("ALTER TABLE room_types_new RENAME TO room_types")
    op.create_index('ix_room_types_id',       'room_types', ['id'],       unique=False)
    op.create_index('ix_room_types_hotel_id', 'room_types', ['hotel_id'], unique=False)


def downgrade() -> None:
    pass
