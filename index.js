var handlebars = require('handlebars');
var path = require('path');

var createTemplateName = function (basePath, parentPath, filePath) {	
	var extensionRegex = /(\.[a-z]+)+$/;
	var absolutePath = path.join(basePath, parentPath);
	var normalizedAbsolutePath = absolutePath.lastIndexOf('/') == absolutePath.length - 1 
					? absolutePath
					: absolutePath + '/';
	var templateName = filePath.replace(normalizedAbsolutePath, '')
				   .replace(extensionRegex, '');
	
	return templateName;
};

/**
 *  config options:
 *   - function that transforms original file path to path of the processed file
 *   - templatePath - relative path to configured karma basePath
 *   - templateName - function that translates original file path to template name
 *   - templates - name of the variable to store the templates hash
 */
var createHandlebarsPreprocessor = function(args, config, logger, basePath) {
  config = config || {};

  var log = logger.create('preprocessor.handlebars');

  var templateName = args.templateName || config.templateName || function(filepath) {
    return filepath.replace(/_(.*)/, '$1');
  };

  var transformPath = args.transformPath || config.transformPath || function (filePath) {
    var extensionRegex = /(\.[a-z]+)+$/;
    return filePath.replace(extensionRegex, '.js');
  };

  var templates = args.templates || config.templates || "Handlebars.templates";

  return function(content, file, done) {
    var processed = null;

    log.debug('Processing "%s".', file.originalPath);

    file.path = transformPath(file.originalPath);
    var template = templateName(createTemplateName(basePath, config.templatePath, file.originalPath));

    try {
      processed = "(function() {" + templates + " = " + templates + " || {};"
      + templates + "['" + template + "'] = Handlebars.template("
      + handlebars.precompile(content)
      + ");})();";
    } catch (e) {
      log.error('%s\n  at %s', e.message, file.originalPath);
    }

    done(processed);
  };
};

createHandlebarsPreprocessor.$inject = ['args', 'config.handlebarsPreprocessor', 'logger', 'config.basePath'];

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:handlebars': ['factory', createHandlebarsPreprocessor]
};
