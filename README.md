# Pratham 2.0

## Host App

### teachers

Next JS, run:

```sh
nx dev teachers --port=3001 --verbose
```

### admin

Next JS, run:

```sh
nx dev admin-app-repo --port=3002 --verbose
```

### learner-web-app

Next JS, run:

```sh
nx dev learner-web-app --port=3003 --verbose
```

##

## Micro Frontend List

### authentication

Next JS, run:

```sh
nx dev authentication --port=4101 --verbose
```

basePath : `http://localhost:4101/authentication/`
Port : `4101`

### scp-teacher-repo

Next JS, run:

```sh
nx dev scp-teacher-repo --port=4102 --verbose
```

basePath : `http://localhost:4102/scp-teacher-repo/`
Port : `4102`

### youthNet

Next JS, run:

```sh
nx dev youthNet --port=4103 --verbose
```

basePath : `http://localhost:4103/youthnet/`
Port : `4103`

### workspace

Next JS, run:

```sh
nx dev workspace --port=4104 --verbose
```

basePath : `http://localhost:4104/workspace/`
Port : `4104`

### notification

Next JS, run:

```sh
nx dev notification --port=4105 --verbose
```

basePath : `http://localhost:4105`
Port : `4105`

### sbplayer admin

Next JS, run:

```sh
nx dev players --port=4106 --verbose
```

basePath : `http://localhost:4106`
Port : `4106`

### sbplayer teacher

Next JS, run:

```sh
nx dev players --port=4107 --verbose
```

basePath : `http://localhost:4107`
Port : `4107`

### sbplayer learner

Next JS, run:

```sh web
nx dev players --port=4108 --verbose
```

basePath : `http://localhost:4108`
Port : `4108`

### forget-password

Next JS, run:

```sh
nx dev forget-password --port=4109 --verbose
```

basePath : `http://localhost:4109`
Port : `4109`

### login

Next JS, run:

```sh
nx dev login --port=4110 --verbose
```

basePath : `http://localhost:4110`
Port : `4110`

### profile-manage

Next JS, run:

```sh
nx dev profile-manage --port=4111 --verbose
```

basePath : `http://localhost:4111`
Port : `4111`

### survey-observations

Next JS, run:

```sh
nx dev survey-observations --port=4112 --verbose
```

basePath : `http://localhost:4112`
Port : `4112`

##

### content

Next JS, run:

```sh web
nx dev content --port=4113 --verbose
```

basePath : `http://localhost:4113/mfe_content/`
Port : `4113`

## NX Command

### View Nx Graph

` nx graph`

### Build All Project

`npx nx run-many --target=build --all`

### Install NX Globally

`npm install -g nx`

## Notes

## use shared library in any project

```sh
import { SharedLib } from '@shared-lib';
```

docker-compose -f docker-compose.admin-app-repo.yml up -d --force-recreate --no-deps