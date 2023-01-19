import os
from os import listdir
from os.path import isfile, join, dirname

import tempfile

import pytest
from src import create_app
from src.db import get_db, init_db


class AuthActions(object):
    def __init__(self, client):
        self._client = client

    def login(self, username='test', password='test'):
        return self._client.post(
            '/auth/login',
            data={'username': username, 'password': password}
        )

    def logout(self):
        return self._client.get('/auth/logout')


@pytest.fixture
def app():
    db_fd, db_path = tempfile.mkstemp()

    app = create_app({
        'TESTING': True,
        'DATABASE': db_path,
    })

    with app.app_context():
        init_db()
        session = get_db()
        fixtures_path = join(dirname(__file__), 'fixtures')
        for f in listdir(fixtures_path):
            if isfile(join(fixtures_path, f)):
                with open(join(fixtures_path, f), 'rb') as f:
                    sql = f.read().decode('utf8')
                    session.execute(sql)
                    session.commit()


    yield app

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


@pytest.fixture
def auth(client):
    return AuthActions(client)
