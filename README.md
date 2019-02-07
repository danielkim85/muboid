# MuBOID

MuBOID is the open music/video playlist platform using YouTube API.

Visit [MuBOID.com](http://muboid.com/).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need Node.js > 6.X.

```
npm install -g bower
npm install -g grunt-cli
```

### Installing

```
npm install
bower install
grunt
```

## Running and Testing

### Obtain YouTube API key

Create /public/api-key.js and define CLIENT_ID.

```
var CLIENT_ID = 'MY_API_KEY';
```
### Starting the Server

```
npm start
```

## Deployment

Make sure wss protocol is supported.

## License

This project is licensed under the MIT License.
