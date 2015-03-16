import json
from http.client import HTTPConnection

class Storage:
	def __init__(self, addr, port):
		self.addr = addr;
		self.port = port;

	def call(self, route, method, body=None):
		conn = HTTPConnection(self.addr, self.port)
		conn.request(method, route, body)
		resp = conn.getresponse()
		
		return resp.status, resp

	def init_repo(self, user, repo, access_token):
		stat, re = self.call('/' + user + '/' + repo,
			'POST', 
			json.dumps({
				'origin': 'https://' + user + ':' + access_token + 
					'@github.com/' + user + '/' + repo + '.git'
			})
		)

		return stat == 201

	def pull_repo(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo + '/pull/origin', 'POST')
		return stat == 200

	def push_repo(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo + '/push/origin', 'POST')
		return stat == 200

	def delete_repo(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo, 'DELETE')
		return stat == 200

	def commit_repo(self, user, repo, data):
		stat, re = self.call('/' + user + '/' + repo + '/commit', 
			'POST', 
			json.dumps(data)
		)
		return stat == 200

	def get_repo_status(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo + '/status', 'GET')

		if stat != 200:
			return False

		j = json.loads(str(re.read(), 'utf-8'))
		return j

	def get_repo_exists(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo, 'GET')
		return stat == 200

	def list_repos(self, user):
		stat, re = self.call('/list/' + user, 'GET')

		if stat != 200:
			return False

		j = json.loads(str(re.read(), 'utf-8'))
		return j

	def get_tree(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo + '/tree', 'GET')

		if stat != 200:
			return False
		j = json.loads(str(re.read(), 'utf-8'))
		return j

	def create_file(self, user, repo, path):
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'POST', '{"data":""}')

		return stat == 201

	def delete_file(self, user, repo, path):
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'DELETE')

		return stat == 200 or stat == 404

	def get_file(self, user, repo, path):
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'GET')

		if stat != 200:
			return False

		j = json.loads(str(re.read(), 'utf-8'))

		if 'data' in j:
			return j['data']
		else:
			return j

	def set_file(self, user, repo, path, data):
		if self.get_file(user, repo, path) == False:
			if not self.create_file(user, repo, path):
				return False

		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'PUT', json.dumps({'data': data}))

		return stat == 200

	def get_game_files(self, user, repo):
		baseurl = '/' + user + '/' + repo + '/'

		tree = self.get_tree(user, repo)

		if (tree == False or 'gamedata.json' not in tree):
			return (False, [])

		# List of component filenames
		cfiles = []
		if 'components' in tree:
			cfiles = ['components/' + x for x in tree['components'].keys()]

		# Get gamedata.json
		gamedata = self.get_file(user, repo, 'gamedata.json')
		if gamedata == False:
			return (False, [])

		# Get component data
		components = []
		for f in cfiles:
			re = self.get_file(user, repo, f)
			if re == False:
				return (False, [])
			components.append(re)
		
		return gamedata, components
