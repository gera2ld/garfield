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
