from flask import Flask, request, redirect, url_for, jsonify, render_template, session, g
from github import GitHub
from storage import Storage
import time, json, jinja2

app = Flask(__name__)
app.config.from_pyfile('config.cfg')

def error(code, msg):
	return (render_template('web/error.html', error={'code': code, 'message': msg}), code)

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
	return render_template('web/index.html')
  
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

		# Get a list of repos on github
		status, repos = g.github.list_repos(session['access_token'])
		if status:
			session['user_repos'] = [x['name'] for x in repos]

	return redirect(url_for('index'))

@app.route('/logout')
def logout():
	session.clear()
	return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	user = session['user_info']['login']
	repos = g.storage.get_repo_list(user)
	# Get status for each repo
	status = {}
	for r in repos:
		stat = g.storage.get_repo_status(user, r)
		
		if (stat is False):
			status[r] = False
		else:
			status[r] = True
			for v in stat.values():
				if len(v) is not 0:
					break;
			else:
				status[r] = False

	return render_template('web/dashboard.html', 
		repos=repos,
		status=status)

@app.route('/dashboard/commit/<repo>', methods=['POST'])
def commit(repo):
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	user = session['user_info']['login']
	msg = request.form.get('message')

	stat = g.storage.get_repo_status(user, repo)

	# Make commit list from modified/removed/untracked files
	commit = {'A': [], 'R': [], 'msg': msg}
	commit['A'] += stat['U']
	if 'M' in stat:
		for f in stat['M']:
			commit['A'].append(f['A'])
	if 'D' in stat:
		for f in stat['D']:
			commit['R'].append(f['A'])
	
	status = g.storage.commit_repo(user, repo, commit)
	if status is False:
		return redirect(url_for('dashboard', 
			alert="Unable to commit changes", 
			alert_type="danger"))

	return redirect(url_for('dashboard', 
		alert="Changes committed successfully", 
		alert_type="success"))

@app.route('/dashboard/init/<repo>')
def init(repo):
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	access_token = session['access_token']
	user = session['user_info']['login']

	# Init on github and on storage
	stat = g.github.init_repo(repo, access_token)
	if stat is False: 
		return redirect(url_for('dashboard', 
			alert="Unable to create remote repository on GitHub", 
			alert_type="danger"))

	stat = g.storage.init_repo(user, repo, access_token)
	if stat is False: 
		return redirect(url_for('dashboard', 
			alert="Unable to initialize local repository", 
			alert_type="danger"))

	# Update list of repos from github
	status, repos = g.github.list_repos(session['access_token'])
	if status:
		session['user_repos'] = [x['name'] for x in repos]

	# init gamedata.json
	g.storage.set_file(user, repo, 'gamedata.json', '{}')

	return redirect(url_for('dashboard', 
		alert="Repository initialized locally and remotely", 
		alert_type="success"))

@app.route('/dashboard/delete/<repo>')
def delete(repo):
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	user = session['user_info']['login']
	stat = g.storage.delete_repo(user, repo)

	if stat is False:
		return redirect(url_for('dashboard', 
			alert="Unable to delete repository locally", 
			alert_type="danger"))

	return redirect(url_for('dashboard', 
		alert="Delete completed successfully", 
		alert_type="success"))

@app.route('/dashboard/clone/<repo>')
def clone(repo):
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	access_token = session['access_token']
	user = session['user_info']['login']

	stat = g.storage.init_repo(user, repo, access_token)
	if stat is False: 
		redirect(url_for('dashboard', 
			alert="Unable to init repository", 
			alert_type="danger"))

	stat = g.storage.pull_repo(user, repo)
	if stat is False:
		redirect(url_for('dashboard', 
			alert="Unable to pull repository", 
			alert_type="danger"))

	return redirect(url_for('dashboard', 
		alert="Clone completed successfully", 
		alert_type="success"))

@app.route('/dashboard/push/<repo>')
def push(repo):
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	user = session['user_info']['login']
	if not g.storage.push_repo(user, repo):
		return redirect(url_for('dashboard', 
			alert="Unable to push to remote", 
			alert_type="danger"))

	return redirect(url_for('dashboard', 
		alert="Push completed successfully", 
		alert_type="success"))

@app.route('/dashboard/pull/<repo>')
def pull(repo):
	if 'access_token' not in session:
		return error(403, 'Forbidden')

	user = session['user_info']['login']
	if not g.storage.pull_repo(user, repo):
		return redirect(url_for('dashboard', 
			alert="Unable to pull to remote", 
			alert_type="danger"))

	return redirect(url_for('dashboard', 
		alert="Pull completed successfully", 
		alert_type="success"))

@app.route('/editor/<repo>')
def editor(repo):
	if ('access_token' in session):
		user = session['user_info']['login']
		if (g.storage.get_repo_exists(user, repo)):
			gamedata, components = g.storage.get_game_files(user, repo)
			tree = g.storage.get_tree(user, repo)

			return render_template(
				'editor/editor.html', 
				gamedata=gamedata, 
				components=components,
				tree=json.dumps(tree)
			)
		else:
			return error(404, 'Not Found')
	else:
		return error(403, 'Forbidden')

@app.route('/editor/<repo>/<path:file>', methods=['GET', 'POST', 'DELETE'])
def file(repo, file):
	if ('access_token' not in session):
		return error(403, 'Forbidden')

	user = session['user_info']['login']
	if not g.storage.get_repo_exists(user, repo):
		return error(404, 'Not Found')

	if request.method == 'GET':
		data = g.storage.get_file(user, repo, file)
		if data is not False:
			return data, 200
		return error(404, 'Not Found')
	if request.method == 'POST':
		if g.storage.set_file(user, repo, file, str(request.get_data(), 'utf-8')):
			return '', 200
		return error(500, 'Internal Server Error')
	if request.method == 'DELETE':
		if g.storage.delete_file(user, repo, file):
			return '', 200
		return error(500, 'Internal Server Error')


@app.route('/game/<user>/<repo>')
def game(user, repo):
	if ('access_token' in session and
		session['user_info']['login'] == user):

		if (g.storage.get_repo_exists(user, repo)):
			gamedata, components = g.storage.get_game_files(user, repo)

			return render_template(
				'game/game.html', 
				repo=repo,
				gamedata=gamedata, 
				components=components
			)
		else:
			return error(404, 'Not Found')
	else:
		return error(403, 'Forbidden')


if __name__ == '__main__':
	app.run(host='0.0.0.0', debug=True);
