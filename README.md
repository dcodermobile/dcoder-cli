# Dcoder CLI
Dcoder CLI allows you to manage blocks from your desktop.

## Installation
### npm
``` 
$ npm i -g @dcodermobile/dcoder-cli
```

## Quick start
Let's create a new project:
```
$ mkdir new-block
$ cd new-block
````

Connect it with dcoder:
```
$ dcoder-cli block init

Block created successfully
Initialising connection...
Connection established successfully.
Syncing data...
Data synced successfully.
```

Run it using CLI:
```
$ dcoder-cli block run

Initialising connection...
Connection established successfully.
Syncing changes...
Changes synced successfully.
Running block...


INPUTS
------------------
item                   Chair


OUTPUT
------------------
result                 Chair

```

## Usage
Explore the command-line interface at your leisure:
```
$ dcoder-cli -h

Usage: dcoder-cli [options] [command]

Options:
  -h, --help      display help for command

Commands:
  block           Block commands
  login           Login to dcoder
  authentication  List user authentications
  help [command]  display help for command

```
