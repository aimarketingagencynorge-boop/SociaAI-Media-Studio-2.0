"""Run in authorized Cloud Shell after cloud-prepare.sh; never prints credentials."""
import json, pathlib, subprocess, sys, tempfile, urllib.parse
import requests

PROJECT = 'gen-lang-client-0893574157'
DATABASE = 'ai-studio-da2c7ce8-8cbd-4a4d-a1f0-c740600206e8'
ACCOUNT = f'sociai-studio-runtime@{PROJECT}.iam.gserviceaccount.com'

def command(*args):
    return subprocess.check_output(['gcloud', *args, '--project='+PROJECT, '--quiet'], text=True).strip()

settings_path = pathlib.Path(sys.argv[1]).expanduser().resolve()
settings = json.loads(settings_path.read_text())
if not settings['STRIPE_SECRET_KEY'].startswith('sk_test_'):
    raise RuntimeError('Only test Stripe credentials are accepted by this deployment script')
url = command('run', 'services', 'describe', 'sociai-studio-app', '--region=us-west1', '--format=value(status.url)')
assert url.startswith('https://') and url.endswith('.run.app')
settings['APP_URL'] = url
token = command('auth', 'print-access-token')
session = requests.Session()
session.headers.update({'Authorization': 'Bearer '+token, 'x-goog-user-project': PROJECT})

def api(method, endpoint, **kwargs):
    response = session.request(method, endpoint, timeout=60, **kwargs)
    if not response.ok:
        raise RuntimeError(f'Google API error {response.status_code}: '+response.text[:1000])
    return response.json()

# Preserve existing OAuth domains and add only this app origin.
auth_url = f'https://identitytoolkit.googleapis.com/admin/v2/projects/{PROJECT}/config'
auth = api('GET', auth_url)
domains = auth.get('authorizedDomains', [])
host = urllib.parse.urlparse(url).hostname
if host not in domains:
    api('PATCH', auth_url, params={'updateMask': 'authorizedDomains'}, json={'name': f'projects/{PROJECT}/config', 'authorizedDomains': domains+[host]})
print('Firebase authorized domain configured')

# Publish rules only for SociAI's named database, preserving the prior release.
rules_base = f'https://firebaserules.googleapis.com/v1/projects/{PROJECT}'
release_name = f'projects/{PROJECT}/releases/cloud.firestore/{DATABASE}'
old_response = session.get('https://firebaserules.googleapis.com/v1/'+release_name, timeout=60)
if old_response.status_code not in (200, 404):
    raise RuntimeError('Cannot inspect the existing Firestore rules release')
if old_response.ok:
    backup = pathlib.Path.home()/'sociai-previous-rules-release.json'
    if not backup.exists():
        backup.write_text(json.dumps(old_response.json()))
rules = api('POST', rules_base+'/rulesets', json={'source': {'files': [{'name': 'firestore.rules', 'content': pathlib.Path('firestore.rules').read_text()}]}})
release = {'name': release_name, 'rulesetName': rules['name']}
if old_response.ok:
    api('PATCH', 'https://firebaserules.googleapis.com/v1/'+release_name, json={'release': release, 'updateMask': 'rulesetName'})
else:
    api('POST', rules_base+'/releases', json=release)
print('Named Firestore database rules deployed')

bucket = PROJECT+'-sociai-media'
bucket_url = f'https://firebasestorage.googleapis.com/v1beta/projects/{PROJECT}/buckets/{bucket}'
bucket_response = session.get(bucket_url, timeout=60)
if bucket_response.status_code == 404:
    api('POST', bucket_url+':addFirebase', json={})
elif not bucket_response.ok:
    raise RuntimeError(f'Cannot inspect Firebase Storage registration: {bucket_response.status_code} '+bucket_response.text[:700])
storage_rules = "rules_version = '2'; service firebase.storage { match /b/{bucket}/o { match /{path=**} { allow read, write: if false; } } }"
storage_set = api('POST', rules_base+'/rulesets', json={'source': {'files': [{'name': 'storage.rules', 'content': storage_rules}]}})
storage_release = {'name': f'projects/{PROJECT}/releases/firebase.storage/{bucket}', 'rulesetName': storage_set['name']}
storage_url = 'https://firebaserules.googleapis.com/v1/'+storage_release['name']
storage_old = session.get(storage_url, timeout=60)
if storage_old.ok:
    api('PATCH', storage_url, json={'release': storage_release, 'updateMask': 'rulesetName'})
elif storage_old.status_code == 404:
    api('POST', rules_base+'/releases', json=storage_release)
else:
    raise RuntimeError('Cannot inspect storage rules')
print('Generated media bucket linked with server-only writes')

secret_names = ['GEMINI_MASTER_KEY', 'AI_ENCRYPTION_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_FINGERPRINT_SECRET']
bindings = []
for name in secret_names:
    value = settings[name]
    assert isinstance(value, str) and len(value) >= 20
    secret = 'sociai-'+name.lower().replace('_', '-')
    exists = subprocess.run(['gcloud', 'secrets', 'describe', secret, '--project='+PROJECT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
    if not exists:
        command('secrets', 'create', secret, '--replication-policy=automatic')
    with tempfile.NamedTemporaryFile(mode='w') as file:
        file.write(value)
        file.flush()
        version = command('secrets', 'versions', 'add', secret, '--data-file='+file.name, '--format=value(name)').split('/')[-1]
    command('secrets', 'add-iam-policy-binding', secret, '--member=serviceAccount:'+ACCOUNT, '--role=roles/secretmanager.secretAccessor')
    bindings.append(f'{name}={secret}:{version}')
env = {name: settings[name] for name in ['APP_URL', 'STRIPE_PRICE_ID', 'STRIPE_PORTAL_CONFIGURATION_ID']}
command('run', 'services', 'update', 'sociai-studio-app', '--region=us-west1', '--update-secrets='+','.join(bindings), '--update-env-vars='+','.join(k+'='+v for k,v in env.items()))
print('Runtime secrets configured; billing uses Stripe test mode')
command('run', 'services', 'add-iam-policy-binding', 'sociai-studio-app', '--region=us-west1', '--member=allUsers', '--role=roles/run.invoker')
print('Application URL: '+url)
settings_path.unlink()
