from flask import (
    Blueprint, flash, g, redirect, render_template, request, url_for
)
from werkzeug.exceptions import abort

from src.auth import login_required
from src.db import get_db

bp = Blueprint('vocabulary', __name__)


@bp.route('/')
def homepage():
    if g.user:
        words = get_db().execute(
            'SELECT w.id, w.user_id, w.original, w.translation FROM word as w'
            ' WHERE user_id = ?', (g.user['id'],)
        ).fetchall()

        return render_template('vocabulary/words_list.html', words=words)
    else:
        return render_template('homepage.html')


@bp.route('/vocabulary/create', methods=('POST',))
@login_required
def create():
    original = request.form['original']
    translation = request.form['translation']
    error = None

    if not original:
        error = 'Original word is required.'

    if not translation:
        error = 'Translation for word is required.'

    if error is not None:
        flash(error)
    else:
        db = get_db()
        db.execute(
            'INSERT INTO word (user_id, original, translation)'
            ' VALUES (?, ?, ?)',
            (g.user['id'], original, translation)
        )
        db.commit()
        return redirect(url_for('homepage'))

    return render_template('vocabulary/words_list.html')


@bp.route('/vocabulary/delete/<int:word_id>', methods=('POST',))
@login_required
def remove_word(word_id):
    word = get_word(word_id)
    db = get_db()
    db.execute('DELETE FROM word WHERE id = ?', (word['id'],))
    db.commit()

    return redirect(url_for('homepage'))


def get_word(id):
    word = get_db().execute(
        'SELECT w.id, w.original, w.translation FROM word w WHERE w.id = ? AND w.user_id = ?',
        (id, g.user['id'])
    ).fetchone()

    if word is None:
        abort(404, f"Word id {id} doesn't exist.")

    return word
