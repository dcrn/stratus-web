import json
from http.client import HTTPConnection

class Storage:
	def __init__(self, addr, port):
		self.addr = addr;
		self.port = port;

	def call(self, route, method, body=None):
		# Create a connection to the storage server
		conn = HTTPConnection(self.addr, self.port)
		# Perform the request
		conn.request(method, route, body)

		# Return the response from the server
		resp = conn.getresponse()
		
		return resp.status, resp

	def init_repo(self, user, repo, access_token):
		# Tell the storage server to create a new repository
		# by POSTing the remote details for this user, repo and access token
		stat, re = self.call('/' + user + '/' + repo,
			'POST', 
			json.dumps({
				'origin': 'https://' + user + ':' + access_token + 
					'@github.com/' + user + '/' + repo + '.git'
			})
		)

		# 201 Created is successful.
		return stat == 201

	def pull_repo(self, user, repo):
		# Perform the pull action on the 'origin' remote for this repo
		stat, re = self.call('/' + user + '/' + repo + '/pull/origin', 'POST')
		return stat == 200

	def push_repo(self, user, repo):
		# Perform the push action on the 'origin' remote for this repo
		stat, re = self.call('/' + user + '/' + repo + '/push/origin', 'POST')
		return stat == 200

	def delete_repo(self, user, repo):
		# Delete the repo by sending a DELETE request to the repo URL
		stat, re = self.call('/' + user + '/' + repo, 'DELETE')
		return stat == 200

	def commit_repo(self, user, repo, data):
		# Post the commit data to /user/repo/commit to perform the commit operation
		stat, re = self.call('/' + user + '/' + repo + '/commit', 
			'POST', 
			json.dumps(data)
		)
		return stat == 200

	def get_repo_status(self, user, repo):
		# Get the git status of the repository
		stat, re = self.call('/' + user + '/' + repo + '/status', 'GET')

		if stat != 200:
			return False

		# Unserialise the JSON data returned into a Python dictionary, and return it
		j = json.loads(str(re.read(), 'utf-8'))
		return j

	def get_repo_exists(self, user, repo):
		# Check to make sure a repository exists
		stat, re = self.call('/' + user + '/' + repo, 'GET')
		return stat == 200

	def get_repo_list(self, user):
		# List the repositories for the specified user
		stat, re = self.call('/' + user, 'GET')

		if stat != 200:
			return []

		j = json.loads(str(re.read(), 'utf-8'))
		return j

	def get_tree(self, user, repo):
		# Get the tree of the repository
		stat, re = self.call('/' + user + '/' + repo + '/tree', 'GET')

		if stat != 200:
			return False

		# Return the object containing the tree 
		j = json.loads(str(re.read(), 'utf-8'))
		return j

	def create_file(self, user, repo, path):
		# Create an empty file at the specified path
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'POST', '{"data":""}')

		return stat == 201

	def delete_file(self, user, repo, path):
		# Delete the specified file
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'DELETE')

		# This is successful if the file was deleted or never existed.
		return stat == 200 or stat == 404

	def get_file(self, user, repo, path):
		# Get the contents of the specified file
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'GET')

		if stat != 200:
			return False

		# load the JSON received from the storage server
		j = json.loads(str(re.read(), 'utf-8'))

		# return the file contents
		if 'data' in j:
			return j['data']
		else:
			return j

	def set_file(self, user, repo, path, data):
		# Set the contents of a file
		if self.get_file(user, repo, path) == False: # If it doesn't exist, create it.
			if not self.create_file(user, repo, path):
				return False

		# Convert the contents to JSON then post it
		stat, re = self.call('/' + user + '/' + repo + '/file/' + path, 
			'PUT', json.dumps({'data': data}))

		return stat == 200

	def get_game_files(self, user, repo):
		# Get all of the game files for a specified repository
		baseurl = '/' + user + '/' + repo + '/'

		# Get the tree structure of the repository
		tree = self.get_tree(user, repo)

		# Ensure it has a gamedata file
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
		
		# Return game file contents
		return gamedata, components
