const path = require('path');
const url = require('url');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');
const mongoose = require('mongoose');
const express = require('express');
const {StringDecoder} = require('string_decoder');

var app = express();
app.use(express.json())

var connection = mongoose.connect(`mongodb://${process.env.DBusername}:${process.env.DBpassword}@ds235860.mlab.com:35860/work-space`)
var PORT = process.env.port || 5000;

const routes = {
  '/api/users' : handlers.users,
  '/api/user' : handlers.user,
  '/api/spaces' : handlers.spaces
};

app.all('*', ( req, res ) => {
  let pathQuery = url.parse(req.url, true);
  let pathname = pathQuery.pathname;
  let method = req.method;

  let handler = routes[pathname] ? routes[pathname] : handlers.notfound;

  if (handler) {
    let buffer = '';
    let decoder = new StringDecoder('utf8');
    
    req.on('data', data=>{
      console.log('here')
      buffer += decoder.write(data)
    });
    req.on('end', () => {
      buffer += decoder.end();
        let data = {
          pathname: pathname,
          method: method.toLowerCase(),
          headers: req.headers || {},
          body: helpers.jsonToObj(buffer)
        };
        console.log('calling in ' + handler)
        handler(data, ( statusCode, payload, contentType ) => {
          res.status(statusCode);
          res.contentType(contentType);
          if (contentType == 'application/json') {
            res.json(payload)
          } else {
            res.send(payload)
          }
        })

    });
    req.on('error', (err)=>{
      throw err
    })
  } else {
    res.status(400);
    res.json({
      message: 'Unknown path'
    })
  }
});

app.listen(PORT, ()=>console.log('port: '+PORT))