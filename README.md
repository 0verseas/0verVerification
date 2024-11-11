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

## Deploy Docker Develop Environment
### Startup Preparation
if dev then
```
git clone https://github.com/0verseas/0verVerification.git ./0verVerification-dev/
cd ./0verVerification-dev/
git checkout dev
```
if official then
```
git clone https://github.com/0verseas/0verVerification.git
cd ./0verVerification/
```

```
npm install
cp ./public/js/env.js.example ./public/js/env.js
cp ./docker/.env.example ./docker/.env
```
#### Edit Config Files
modify baseUrl, reCAPTCHA_site_key
```
vim ./public/js/env.js
```
modfiy NETWORKS, DOMAIN_NAME, ENTRYPOINTS
*If dev then modfiy COMPOSE_PROJECT_NAME and CONTAINER_NAME*
```
vim ./docker/.env
```
#### *If want Container Block Exclude IPs Other than Ours*
modify uncomment row 28
```
vim ./docker/docker-compose.yaml
```
### Build
```
sudo npm run docker-build
```
### StartUp
*at ./docker/ path*
```
sudo docker-compose up -d
```
### Stop
*at ./docker/ path*
```
sudo docker-compose down
```
### ✨Nonstop Container and Apply New Edit Docker-Compose Setting (Use Only Container is running)✨
The command will not effect on the running container if you have not edited any of the settings on docker-compose.yaml
*at ./docker/ path*
```
sudo docker-compose up --detach
```
