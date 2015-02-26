import json
from http.client import HTTPConnection

class Storage:
	def __init__(self, addr, port):
		self.addr = addr;
		self.port = port;

	def call(self, route, method):
		conn = HTTPConnection(self.addr, self.port)
		conn.request(method, route)
		resp = conn.getresponse()
		
		return resp.status, resp

	def repo_exists(self, user, repo):
		stat, re = self.call('/' + user + '/' + repo, 'GET')
		
		return stat == 200

	def get_game_files(self, user, repo):
		baseurl = '/' + user + '/' + repo + '/'

		stat, re = self.call(baseurl + 'tree', 'GET')
		j = json.loads(str(re.read(), 'utf-8'))

		if (stat != 200 or 'gamedata.json' not in j):
			return (False, [])

		# List of component filenames
		cfiles = []
		if 'components' in j:
			cfiles = ['components/' + x for x in j['components'].keys()]

		# Get gamedata.json
		stat, re = self.call(baseurl + 'file/gamedata.json', 'GET')
		if stat != 200:
			return (False, [])
		gamedata = json.loads(str(re.read(), 'utf-8'))['data']

		# Get component data
		components = []
		for f in cfiles:
			stat, re = self.call(baseurl + 'file/' + f, 'GET')
			if stat != 200:
				return (False, [])

			components.append(json.loads(str(re.read(), 'utf-8'))['data'])
		
		return gamedata, components
