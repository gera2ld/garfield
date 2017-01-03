web-commander
===

![NPM](https://img.shields.io/npm/v/web-commander.svg)
![License](https://img.shields.io/npm/l/web-commander.svg)
![Downloads](https://img.shields.io/npm/dt/web-commander.svg)

This is a lite server to execute commands according to web requests.

Installation
---
``` sh
$ npm i web-commander -g
```

Usage
---
1. Start web-commander at `0.0.0.0:2333`:

   ``` sh
   # Default address is `0.0.0.0:2333`
   $ web-commander

   # Host and port may be overridden by environment variables
   $ HOST=localhost PORT=8888 web-commander
   ```

1. Open dashboard by the address specified above, then add projects and commands.

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
