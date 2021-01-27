if hash npm 2>/dev/null; then
    echo "Node/NPM already installed.."
else
    echo "Node/NPM not found, installing.."
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install nodejs
fi

if hash gem 2>/dev/null; then
    echo "Rubygems already installed.."
else
    echo "Rubygems not found, installing.."
    sudo apt-get install ruby-full rubygems
fi

if hash sass 2>/dev/null; then
    echo "Sass already installed.."
else
    echo "Sass not found, installing.."
    sudo gem install sass
fi

echo "Installing npm dependecies for build script"
npm install
