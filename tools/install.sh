#!/bin/bash

if hash brew 2>/dev/null; then
    echo "Homebrew is already installed.."
else
    echo "Homebrew not found, installing..."
    echo

    echo "Making sure we have command line tools installed.."
    xcode-select --install
    echo

    echo "Installing homebrew.."
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    echo

    echo "Adding brew bin folder export in to PATH in .bash_profile.."
    echo 'export PATH="/usr/local/sbin:/usr/local/bin:$PATH' >> ~/.bash_profile
    echo

    echo "Installing latest version of git and bash completion"
    brew install git bash-completion

    echo "Adding bash completion to ~/.bash_profile.."

    echo >> ~/.bash_profile
    echo 'if [ -f $(brew --prefix)/etc/bash_completion ]; then' >> ~/.bash_profile
    echo '    . $(brew --prefix)/etc/bash_completion' >> ~/.bash_profile
    echo 'fi' >> ~/.bash_profile
    echo >> ~/.bash_profile
fi

if hash npm 2>/dev/null; then
    echo "Node/NPM already installed.."
else
    echo "Node/NPM not found, installing.."
    brew install nodejs
fi

echo "Installing npm dependecies for build script"
npm install
