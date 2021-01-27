from fabric.api import local, lcd, abort
import os.path

from fabric.colors import green, red, blue, yellow

GO_COBALT = r"""
  /$$$$$$   /$$$$$$         /$$$$$$   /$$$$$$  /$$$$$$$   /$$$$$$  /$$    /$$$$$$$$
 /$$__  $$ /$$__  $$       /$$__  $$ /$$__  $$| $$__  $$ /$$__  $$| $$   |__  $$__/
| $$  \__/| $$  \ $$      | $$  \__/| $$  \ $$| $$  \ $$| $$  \ $$| $$      | $$
| $$ /$$$$| $$  | $$      | $$      | $$  | $$| $$$$$$$ | $$$$$$$$| $$      | $$
| $$|_  $$| $$  | $$      | $$      | $$  | $$| $$__  $$| $$__  $$| $$      | $$
| $$  \ $$| $$  | $$      | $$    $$| $$  | $$| $$  \ $$| $$  | $$| $$      | $$
|  $$$$$$/|  $$$$$$/      |  $$$$$$/|  $$$$$$/| $$$$$$$/| $$  | $$| $$$$$$$$| $$
 \______/  \______/        \______/  \______/ |_______/ |__/  |__/|________/|__/
"""


def dev_setup_default_env():
    with lcd('tools'):
        local('cp .env.default .env')


def print_msg(msg, success=False, error=False, warning=False):
    string = '\n%s' % msg
    if error:
        abort(red(string))
    elif warning:
        print yellow(string)
    elif success:
        print green(string)
    else:
        print blue(string)


def require_yes(answer):
    return answer.lower() == 'y' or answer.lower() == 'yes'


def install_tools():
    with lcd('tools'):
        local('./install.sh')


def eslint_installed():
    return os.path.exists('tools/node_modules/.bin/eslint')


def prettier_installed():
    return os.path.exists('tools/node_modules/.bin/prettier')


def karma_installed():
    return os.path.exists('tools/node_modules/.bin/karma')


def tests(watch=False):
    test(watch)


def test(watch=False):
    if not karma_installed():
        print "karma not installed, installing tools.."
        install_tools()

    command = "NODE_ENV=development node_modules/.bin/karma start ../tests/karma.conf.js"

    if not watch:
        command += " --single-run"

    with lcd('tools'):
        local(command)


def generate_docs(open=False):
    local('tools/node_modules/.bin/jsdoc -c tools/jsdoc.conf.json')

    if open:
        local('open docs/index.html')


def stylelint(path=None):
    ignore_file = '.stylelintignore'
    stylelint_binary = 'node_modules/.bin/stylelint'
    config_file = '.stylelintrc.yml'

    command = '{0} --config {1} -i {2}'.format(
        stylelint_binary,
        config_file,
        ignore_file,
    )

    print blue("\nMaking sure your styles are up to snuff!")
    print blue("=====================================\n")

    with lcd('tools'):
        if path is None:
            paths = ' '.join([
                '../{}/**/*.{}'.format(p, ext)
                for p in ['shared', 'core', 'commander']
                for ext in ['js', 'jsx']
            ])
            local('{} {}'.format(command, paths))
        else:
            local('{} {}'.format(command, path))

    print green(GO_COBALT)
    print green("You're all set!")


def eslint(fix=False, path=None):
    if not eslint_installed():
        print "eslint not installed, installing tools.."
        install_tools()

    ignore_file = '.eslintignore'
    eslint_binary = 'node_modules/.bin/eslint'
    config_file = '.eslintrc.yml'

    command = '{0} --ext .js,.jsx -c {1} --ignore-path {2}'.format(
        eslint_binary,
        config_file,
        ignore_file,
    )

    if fix:
        command += ' --fix'

    print blue("\nMaking sure your code is up to snuff!")
    print blue("=====================================\n")

    with lcd('tools'):
        if path is None:
            local('{} {}'.format(command, '../shared ../core ../commander'))
            local('{} --env node,jasmine {}'.format(command, '../tests'))
        else:
            local('{} {}'.format(command, path))

    print green(GO_COBALT)
    print green("You're all set!")


def prettier(fix=False, path=None):
    if not prettier_installed():
        print "prettier not installed, installing tools.."
        install_tools()

    prettier_binary = 'node_modules/.bin/prettier'
    config_file = '.prettierrc'
    ignore_file = '.prettierignore'

    command = '{0} --config {1} --ignore-path {2}'.format(
        prettier_binary,
        config_file,
        ignore_file,
    )

    if fix:
        command += ' --write'
    else:
        command += ' --check'

    print blue("\nMaking sure your code is up to snuff!")
    print blue("=====================================\n")

    with lcd('tools'):
        if path is None:
            result = local('{} {}'.format(
                command,
                "\"../shared/**/*.{js,jsx}\" "
                "\"../core/**/*.{js,jsx}\" "
                "\"../commander/**/*.{js,jsx}\" "
                "\"../tests/**/*.js\""
            ))
        else:
            result = local('{} {}'.format(command, path))

        if result.return_code > 0:
            print red("Something went wrong.")

    print green(GO_COBALT)
    print green("You're all set!")


def build(product=None):
    product = product or 'core'
    if not (product == 'core' or product == 'commander' or product == 'storybook'):
        print red('Webpack can only build core, commander, and storybook.')
        return

    print green('Cleaning up last build. Please wait...')
    local('rm -rf built_*/{}'.format(product))

    print green('Building {} with webpack.'.format(product))
    with lcd('tools'):
        local('./build.sh {}'.format(product))

    print green(GO_COBALT)
    print green('You\'re all set!')


def watcher(product=None, extract_css=False):
    if not (product == 'core' or product == 'commander' or product == 'storybook'):
        print red("Webpack can only build 'core', 'commander', or 'storybook'.")
        return

    print green('Cleaning up last build. Please wait...')
    local('rm -rf built/{}'.format(product))

    print green('Launching webpack watcher for {}.'.format(product))
    with lcd('tools'):
        command = "npm run watch:{} -- ".format(product)

        if extract_css:
            command += "--env.extractCSS"

        local(command)
