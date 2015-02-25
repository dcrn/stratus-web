from flask import Flask, request, redirect, url_for, jsonify, render_template, session, g
from github import GitHub
import time

app = Flask(__name__)
app.config.from_pyfile('config.cfg')

def error(code, msg):
	return (render_template('error.html', error={'code': code, 'message': msg}), code)

# Catch all requests
@app.after_request
def after_req(resp):
	if 'access_token' in session:
		session['last_visit'] = time.time()
	return resp

@app.before_request
def before_req():
	# Set up GitHub API
	g.github = GitHub(
		app.config.get('GITHUB_CLIENT_ID'),
		app.config.get('GITHUB_CLIENT_SECRET'),
		'github.com/dcrn/fyp'
	)

	if 'access_token' in session and \
		(time.time() - session.get('last_visit', 0)) > app.config.get('ACCESS_TOKEN_UPDATE_TIME'):

		# Validate the user's access token
		status, resuser = g.github.get_user(session.get('access_token'))
		if status: 	# Update user details
			session['user_info'] = resuser
		else:		# Clear session info if access token was revoked
			session.clear()

@app.route('/')
def index():
	return render_template('index.html')
  
@app.route('/login', methods=['GET', 'POST'])
def login():
	code = request.args.get('code')
	if code is None:
		return error(403, 'Forbidden')
	else:
		status, restoken = g.github.get_access_token(code)

		if not status:
			return error(500, 'Internal Server Error')
		if 'access_token' not in restoken:
			return error(401, 'Unauthorized')

		status, resuser = g.github.get_user(restoken['access_token'])

		if not status:
			return error(500, 'Internal Server Error')
		
		# Set up session variables
		session['access_token'] = restoken['access_token']
		session['user_info'] = resuser

	return redirect(url_for('index'))

@app.route('/logout')
def logout():
	session.clear()
	return redirect(url_for('index'))

@app.route('/editor/<repo>')
def editor(repo):
	if 'access_token' in session:
		return render_template('editor.html')
	else:
		return redirect(url_for('index'))

@app.route('/game/<user>/<repo>')
def game(user, repo):
	return render_template('game.html', gamedata='', components=[])


if __name__ == '__main__':
	app.run(host='0.0.0.0', debug=True);
