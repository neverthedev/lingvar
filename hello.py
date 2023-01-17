from flask import Flask
from flask import session

app = Flask(__name__)

# import secrets; secrets.token_hex()
app.secret_key = '4953a156a4cf51d58ecd6418d0f3a2dd284ba789073858e5a8f90eabbba0ccff'

@app.route('/')
def hello_world():
    return "<p>Hello, World!</p>"
