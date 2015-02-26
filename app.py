from flask import Flask, request, redirect, url_for, jsonify, render_template, session, g
from github import GitHub
from storage import Storage
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

	# Set up Storage API
	g.storage = Storage(
		app.config.get('STORAGE_ADDR'),
		app.config.get('STORAGE_PORT')
	)

	if ('access_token' in session and
		(time.time() - session.get('last_visit', 0)) > 
		app.config.get('ACCESS_TOKEN_UPDATE_TIME')):

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

@app.route('/projects')
def projects():
	if 'access_token' in session:
		return render_template('projects.html')
	else:
		return error(403, 'Forbidden')

@app.route('/editor/<repo>')
def editor(repo):
	if 'access_token' in session:
		return render_template('editor.html')
	else:
		return error(403, 'Forbidden')

@app.route('/game/<user>/<repo>')
def game(user, repo):
	if ('access_token' in session and
		session['user_info']['login'] == user):

		if (g.storage.repo_exists(user, repo)):
			gamedata, components = g.storage.get_game_files(user, repo)
			return render_template('game.html', gamedata=gamedata, components=components)
		else:
			return error(404, 'Not Found')
	else:
		return error(403, 'Forbidden')


if __name__ == '__main__':
	app.run(host='0.0.0.0', debug=True);
