from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, scoped_session

import click
from flask import current_app, g


def init_db():
    with current_app.app_context():
        from src.adapters.orm import user_table
        get_metadata().create_all(bind=get_engine())

def get_metadata():
    if 'metadata' not in g:
        g.metadata = MetaData()

    return g.metadata

def get_engine():
    if 'engine' not in g:
        g.engine = create_engine(
            f"sqlite:///{current_app.config['DATABASE']}", echo=True)
        print(f"Database url: {current_app.config['DATABASE']}")

    return g.engine

def get_db():
    if 'db' not in g:
        g.db = scoped_session(sessionmaker(autocommit=False,
                                           autoflush=False,
                                           bind=get_engine()))
    return g.db


def close_db(exception=None):
    db = g.pop('db', None)

    if db is not None:
        db.remove()


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)


@click.command('init-db')
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo('Initialized the database.')
