import os
from flask import Flask, render_template
from . import db, auth, vocabulary


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='bd5a54fb6fdeffbefd8273f91dfb8d3a332ab41572b35bf761dcf7cfbc31294b',
        DATABASE=os.path.join(app.instance_path, 'lingvar.db'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testin
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    db.init_app(app)
    app.register_blueprint(auth.bp)
    app.register_blueprint(vocabulary.bp)

    app.add_url_rule('/', endpoint='homepage')

    @app.route('/hello')
    def hello():
        return 'Hello, world'

    return app
