const config = require("./config/config.js")
const routers = require("./routers/routers.js")
const db = require("./dblayer/db.js")
var base64 = require('base-64');
var utf8 = require('utf8');
const express = require('express')
const bodyParser = require('body-parser')
const morganBody = require('morgan-body')
const app = express() 

var AuthorizationRoles = {}

let authorizer = function(req, res, next){
	console.log(`Authorization header: ${req.get('Authorization')}`)
	
	let role = GetAuthorizationRole(req.url, req.method)
	ValidateUser(req.get('Authorization'), role, function(isAuthenticated, username){
		if(!isAuthenticated){
			res.status(401)
			return res.send('unauthorized')
		}
		req.username = username
		req.role = role
		return next()	
	})
}

app.use(bodyParser.json())
morganBody(app)
app.use(authorizer)

for(let index in routers.routes){
	let method = routers.routes[index].method
	let path = routers.routes[index].path
	let handler = routers.routes[index].handler
	let role = routers.routes[index].authorization

	app[method](path,handler)
	if(!AuthorizationRoles[method])
		AuthorizationRoles[method] = {}
	AuthorizationRoles[method][path] = role
}

app.listen(config.server_port)

function ValidateUser(AuthorizationHeader, role, callback){
	if(!AuthorizationHeader || AuthorizationHeader.length <= 0)
		return callback(false, null)

	var bytes = utf8.encode(config.admin_username + ':' + config.admin_password)
	var encoded = base64.encode(bytes)
	var adminHeader = 'Basic '+encoded

	if(AuthorizationHeader == adminHeader)
		return callback(true, config.admin_username)

	if(role == 'admin' || !AuthorizationHeader.includes('Basic '))
		return callback(false, null)

	let buffer = Buffer.from(AuthorizationHeader.split(" ")[1], 'base64').toString()
	
	if(!buffer.includes(':'))
		return callback(false, null)

	let username = buffer.split(':')[0]
	let password = buffer.split(':')[1]
	
	console.log(`username:${username}, password:${password}`)
	db.AuthenticateUser(username, password, role, function(isValid){
		return callback(isValid, username)
	})
}

function GetAuthorizationRole(path, method){
	return AuthorizationRoles[method.toLowerCase()][path]
}