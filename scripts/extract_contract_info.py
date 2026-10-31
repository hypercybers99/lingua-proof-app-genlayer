import re
import json

code = open('contracts-reference/linguaproof.py', encoding='utf-8').read()

# Public methods
methods = re.findall(r'def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)', code)
public_methods = {}
for m, args in methods:
    if not m.startswith('_'):
        params = [p.split(':')[0].strip() for p in args.split(',') if p.strip() and p.strip() != 'self']
        public_methods[m] = params

# All UserError messages
errors = sorted(list(set(re.findall(r'raise\s+gl\.vm\.UserError\(\s*["\']([^"\']+)["\']\s*\)', code))))

result = {
    'public_methods': public_methods,
    'user_errors': errors
}

print(json.dumps(result, indent=2))
