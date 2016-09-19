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
1. Create a `commands.js` file (`.json` should work too) like this:

   ``` js
   module.exports = {
     greet: {
       command: 'echo "Hello world"',
     },
   };
   ```

1. Start web-commander at `0.0.0.0:2333`:

   ``` sh
   $ web-commander -p 2333 -c ./path/to/commands.js
   ```

1. Make a request to web-commander:

   ```
   GET http://server.address:2333/greet
   ```

   Then the command for `greet` will be executed.

Document
---

* Commands defined in `commands.js`

  Exports an object for commands. Each key as the name of command, and value as the command options.
  The value may have properties below:

  * methods

    `null` for unlimited. Array of methods (`GET`, `POST`, etc.) for allowed methods.

  * predicate

    Function called with two parameters: `payload` and `method`.
    If returned value is falsy, the command will not be executed.
    Otherwise, the returned value will override the pre-defined properties of this command.

  * description

    String, description of this command.

  * command

    String, space-separated arguments.

  * jobKey

    A key of the running command, used to mark the processes doing the same thing.

  * cwd

    Same as that in `child_process.exec`.

  * env

    Same as that in `child_process.exec`.

  * timeout

    Same as that in `child_process.exec`.

* `web-commander`

  ```
  usage: web-commander [-h] [-v] [-p PORT] [-c COMMANDS]

  Start a web command server.

  Optional arguments:
    -h, --help            Show this help message and exit.
    -v, --version         Show program's version number and exit.
    -p PORT, --port PORT  the port for server to listen on
    -c COMMANDS, --commands COMMANDS
                          the file path for commands to import
  ```
