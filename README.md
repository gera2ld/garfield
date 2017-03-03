web-commander
===

This is a lite server to execute commands according to web requests.

Usage
---
1. Start web-commander:

   ``` sh
   # Default address is `0.0.0.0:2333`
   $ npm start
   ```

   Configuration can be overridden by `config.yml` or environment variables.
   See [lib/config.js](lib/config.js).

1. Open dashboard, then add projects and commands.

1. Make a request to web-commander:

   ```
   POST http://server.address/cmd/command_name/command_type
   ```

Config
---
Default configurations can be overridden by environment variables.

* `HOST`

  The server host, default as `''`.

* `PORT`

  The server port, default as `2333`.

* `DATA_DIR`

  The directory to store data, also as current working directory to start each task. Default as `data`.

  `DATA_DIR` can either be a path relative to current working directory or an absolute path.

* `SUPER_USERS`

  A list of user IDs. Users with IDs in the list will have super user permissions temporarily.

* `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`

  Required to log in with GitHub.
