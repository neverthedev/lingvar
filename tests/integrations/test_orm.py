from src.models.user import User
from src.db import get_db


def test_orderline_mapper_can_load_lines(app):  # (1)
    with app.app_context():
        db = get_db()
        res = db.query(User).all()

    assert res[0].username == 'test'
    assert res[1].username == 'other'
