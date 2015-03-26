import urllib.request, json

class GitHub:
	githubaddr = 'https://github.com/'
	apiaddr = 'https://api.github.com/'

	def __init__(self, client_id, client_secret, useragent):
		self.client_id = client_id
		self.client_secret = client_secret
		self.useragent = useragent

	def api_call(self, path, access_token=None, post_json=None, addr=apiaddr, raw_output=False, headers=[], get_params={}):
		# Authorize with Application details if no access token provided
		if not access_token:
			get_params['client_id'] = self.client_id
			get_params['client_secret'] = self.client_secret

		# Build URL and request
		url = addr + path + '?' + urllib.parse.urlencode(get_params)
		req = urllib.request.Request(url)

		# If access token is used, add the authorization header
		if access_token:
			req.add_header('Authorization', 'token ' + access_token)

		# Add any post data to the request
		if post_json:
			req.data = bytes(json.dumps(post_json), 'utf-8')

		# Add User-Agent (GitHub API requirement)
		req.add_header('User-Agent', self.useragent)

		# Add specified headers
		for v in headers:
			req.add_header(*v)

		response = None
		try:
			# Attempt to perform the request
			response = urllib.request.urlopen(req)
		except Exception as e:
			return (False, e)

		# If the response was successful, read all the data and return it.
		if response:
			data = response.readall().decode('utf-8')
			if raw_output:
				return (True, data)
			else:
				return (True, json.loads(data))
		else:
			return (False, None)

	def init_repo(self, repo, access_token):
		# Create a specified repository on GitHub
		status, data = self.api_call('user/repos', access_token=access_token, 
			post_json={'name': repo})

		if status and 'name' in data:
			return data['name']
		return False

	def list_repos(self, access_token):
		# Get a list of repositories for the user with this access token
		return self.api_call('user/repos', access_token=access_token)

	def rate_limit(self, access_token=None):
		# The rate limit shows how many API requests are available. This isn't a problem if
		# an access token is being used.
		if access_token:
			return self.api_call('rate_limit', access_token=access_token)
		else:
			return self.api_call('rate_limit')

	def get_access_token(self, code):
		# Using the GitHub OAuth API, use the specified login code to obtain a new access token.
		return self.api_call('login/oauth/access_token',
				get_params={'code': code},
				addr=self.githubaddr,
				headers=[('Accept', 'application/json')]
			)

	def get_user(self, access_token):
		# Get all user details for the user that owns this access token
		return self.api_call('user', access_token=access_token)

	def get_user_emails(self, access_token):
		# Get all user email addresses associated with the access token
		return self.api_call('user/emails', access_token=access_token)
