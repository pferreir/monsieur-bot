# Introduction

`monsieur-bot` is just your ordinay XMPP gentleman.

# Installation

Easy. Just do:

    npm install monsieur-bot

# Configuration

Just create a `config.json` file with the following data:

    {
        "jid": "your_bots_jid@example.com",
        "password": "password",
        "muc_room": "muc_room@conference.example.com",
        "owner": "theowner@example.com",
        "notify_owner": ["error", "warning"],
        "extensions": ["aggregator", "youtube", "imgur"],
        "annoying": true,
        "imgur": {
            "client_id": "imgur_client_id",
            "album": "album_id",
            "delete_hash": "album_delete_hash"
        },
        "youtube": {
            "upload_images": true
        },
        "db_path": "/path/to/sqlite/db",
    }

# Running it

    mbot -c /config/file/location.json

`monsieur-bot` tries to access `config.json` in the current directory if the `-c` option is not specified.