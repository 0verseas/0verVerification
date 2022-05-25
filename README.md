# 0verVerification


## Deploy Local Develop Environment
### Install Dependencies
```
git clone https://github.com/0verseas/0verVerification.git
cd 0verVerification
npm install
```
### Setup
```
cp public/js/env.js.example public/js/env.js
```
edit the config file in `public/js/env.js`

### Testing
```
$ npm run serve
```

### Building
```
$ npm run build
```

## Deploy Docker Develop Environment 🐳
Just need to modify related documents(env.js, .env, docker-compose.yaml)

First of all, git clone https://github.com/0verseas/0verVerification.git than switch folder to 0verVerification/, and do below
  - ``cd 0verVerification/``
    - switch git branch
      - ``sudo git checkout dev``
    - ``sudo cp public/js/env.js.example public/js/env.js``
    - edit public/js/env.js (modify baseUrl, reCAPTCHA_site_key)
    - docker build
      - ``sudo docker run -it --rm -v $PWD:/0verVerification -w /0verVerification node:14.16.0 sh -c 'npm install && npm run build'``

Secondly, switch folder to 0verVerification/docker/ and do below
- ``cd docker/``
  - ``sudo cp .env.example .env``
  - edit .env (modify NETWORKS)
  - edit docker-compose.yaml (modify the container's label which "traefik.http.routers.verification.rule=Host(`` `input office's domain name here` ``) && PathPrefix(`` `/verification` ``)")

Finally, did all the above mentioned it after that the last move is docker-compose up
- ``sudo docker-compose up -d``

If want to stop docker-compose
- ``sudo docker-compose down``
