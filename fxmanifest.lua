fx_version "cerulean"
game "gta5"

title "Privy - Social Network App for LB Phone"
description "A premium content creator platform for LB Phone."
author "DevBH"

shared_script "config.lua"
client_script "client/**.lua"
server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/**.lua'
}

file "ui/dist/**/*"

-- Switch to 'ui/dist/index.html' for production
ui_page "ui/dist/index.html"
-- ui_page "http://localhost:3000/"
