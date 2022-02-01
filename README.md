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

Please make sure that your index.js file contains below function


/**
* Write code here, must await the results using async await.
* Do not use promises .then or callback functions.
* Do not use try catch, Dcoder does error handling for you.
*/
const main = async(inputs, auths, context) => {
  console.log('Input provided : '+ inputs.item)
  return inputs.item
}

module.exports.main = main

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

## Command Reference
### Login
```
$ dcoder login
```

### Block commands
#### Creating new block
```
$ dcoder-cli block init
```

#### Initialising existing block on dcoder
```
dcoder-cli block init:existing
```

#### Run block
```
$ dcoder-cli block run
```

#### Sync changes
```
$ dcoder-cli block sync
```

#### Publish block to Dcoder feed
```
$ dcoder-cli block publish
```
#### Publish block to Dcoder feed
```
$ dcoder-cli block update-info
```
supported flags for update info
```
$ dcoder-cli block update-info -h
Usage: dcoder-cli block update-info [options]

Update block info

Options:
  --title [value]                 Block title
  --description [value]           Block description
  --tags [value]                  Block tags(comma seperated)
  --auto-install-package [value]  Auto install package config(true/false)
  -h, --help                      display help for command

```



#### Block authentication commands
##### Add authentication to block
``` 
$ dcoder-cli block authentication:add
````

##### Link existing block authentication
``` 
$ dcoder-cli block authentication:link
````

##### Unlink block authentication 
``` 
$ dcoder-cli block authentication:unlink
````

#### Block run commands
##### List run commands
``` 
$ dcoder-cli block run-command:list
````

##### Run block run command
``` 
$ dcoder-cli block run-command:run
````

#### Block version commands
##### Create version
``` 
$ dcoder-cli block version:create
````

##### list versions
``` 
$ dcoder-cli block version:list
````


### User authentication commands
#### List of user authentications
```
$ dcoder-cli authentication
My Authentications
1  Github (28/1/2022, 12:08:57 pm)
2  Github (28/1/2022, 1:56:58 am)
3  Google Calendar (25/1/2022, 5:00:28 pm)
4  Github (25/1/2022, 2:10:25 pm)
5  Github (25/1/2022, 2:04:18 pm)
6  Jira (14/1/2022, 8:00:18 pm)
7  Slack (21/12/2021, 4:48:19 pm)
8  Google Search Console (28/11/2021, 6:13:54 pm)
9  Google Analytics (27/11/2021, 3:50:54 pm)
10 Google Analytics (27/11/2021, 3:45:06 pm)
11 Github (28/1/2022, 12:08:57 pm)
12 Github (28/1/2022, 1:56:58 am)
13 Google Calendar (25/1/2022, 5:00:28 pm)
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
