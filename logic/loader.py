from sys import modules

def import_template(module_path):
	try:
		module = modules[module_path]
	except KeyError:
		try:
			module = get_module(module_path, globals(), locals(), [])
		except ImportError, e:
			raise ImportError, 'Unable to load: %s\n%s' % (module_path, e)

	class_name = module_path.split('.')[-1]

	try:
		return getattr(module, class_name)
	except AttributeError:
		raise Exception, 'Module does not contain class ' + class_name

def get_module(path, *args, **kwargs):
	try:
		mod = __import__(path, *args, **kwargs)
	except ValueError, e:
		# __import__("") throws a ValueError("Empty module name")
		raise ImportError, e

	components = path.split('.')

	for comp in components[1:]:
		try:
			mod = getattr(mod, comp)
		except AttributeError, e:
			raise ImportError, e

	return mod
