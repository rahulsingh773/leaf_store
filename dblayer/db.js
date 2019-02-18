const MongoClient = require('mongodb').MongoClient
const uri = "mongodb+srv://admin:qwerty123@cluster0-mbktm.mongodb.net/test?retryWrites=true"
// const uri = "mongodb://localhost:27017"
const client = new MongoClient(uri, { useNewUrlParser: true })
var db, productsCollection, agentsCollection, customersCollection, locationCollection, ordersCollection

connect()


function connect() {
	client.connect(err => {
		console.log("connected successfully")
		db = client.db("leafdb")
		productsCollection = db.collection("products")
		agentsCollection = db.collection("agents")
		customersCollection = db.collection("customers")
		locationCollection = db.collection("location")
		ordersCollection = db.collection("orders")
	});
}

function close(){
	client.close()
	console.log("connection closed")
	process.exit(0)
}

let GetProducts =  exports.GetProducts = function(key, values, callback){
	let query = GetFindQuery(key, values)
	productsCollection.find(query).toArray(function(err, docs) {
		console.log(`GetProducts: err:${err}, docs length:${docs.length}`)
		callback(err, docs)
	})
}

exports.AddProducts = function(products, callback){
	if(products.length <= 0)
		return callback(null)
	let count = 0, errorResponse = [], successResponse = []

	for(let index in products){
		let product = products[index]
		productsCollection.insertOne(product, function(err, docs) {
			console.log(`AddProducts: err:${err}, docs length:${docs && docs.length}`)
			count++
			if(err){
				let obj = {
					status: '409',
					error: err.errmsg,
					payload: product
				}
				errorResponse.push(obj)
			}else{
				successResponse.push(product)
			}
			if(count == products.length){
				if(errorResponse.length == 0)
					return callback(null, successResponse)
				else
					return callback(errorResponse, successResponse)
			}
		})
	}
}

exports.UpdateProducts = function(data, callback){
	if(data.length <= 0)
		return callback(null)

	var bulk = productsCollection.initializeUnorderedBulkOp();
	for(let index in data){
		let id = data[index].id
		delete data[index].id
		
		let query = {}
		for(let key in data[index]){
			query[key] = data[index][key]
		}
		bulk.find({ id: id}).update({ $set: query});		
	}
	bulk.execute();
	if(callback)
		return callback(null)
}

exports.GetAgents = function(key, values, callback){
	let query = GetFindQuery(key, values)
	agentsCollection.find(query).toArray(function(err, docs) {
		console.log(`GetAgents: err:${err}, docs length:${docs && docs.length}`)
		callback(err, docs)
	})
}

exports.AddAgents = function(agents, callback){
	if(agents.length <= 0)
		return callback(null)
	let count = 0, errorResponse = [], successResponse = []

	for(let index in agents){
		let agent = agents[index]
		agentsCollection.insertOne(agent, function(err, docs) {
			console.log(`AddAgents: err:${err}, docs length:${docs && docs.length}`)
			count++
			if(err){
				let obj = {
					status: '409',
					error: err.errmsg,
					payload: agent
				}
				errorResponse.push(obj)
			}else{
				successResponse.push(agent)
			}
			if(count == agents.length){
				if(errorResponse.length == 0)
					return callback(null, successResponse)
				else
					return callback(errorResponse, successResponse)
			}
		})
	}
}

exports.GetCustomers = function(callback){
	customersCollection.find({}).toArray(function(err, docs) {
		console.log(`GetCustomers: err:${err}, docs length:${docs && docs.length}`)
		callback(err, docs)
	})
}

exports.AddCustomers = function(customers, callback){
	if(customers.length <= 0)
		return callback(null)
	let count = 0, errorResponse = [], successResponse = []

	for(let index in customers){
		let customer = customers[index]
		customersCollection.insertOne(customer, function(err, docs) {
			console.log(`AddCustomers: err:${err}, docs length:${docs && docs.length}`)
			count++
			if(err){
				let obj = {
					status: '409',
					error: err.errmsg,
					payload: customer
				}
				errorResponse.push(obj)
			}else{
				successResponse.push(customer)
			}
			if(count == customers.length){
				if(errorResponse.length == 0)
					return callback(null, successResponse)
				else
					return callback(errorResponse, successResponse)
			}
		})
	}
}

exports.UpdateAgentLocation = function(location, callback){
	locationCollection.updateOne({username: location.username}, {$set: location}, {upsert: true}, function(err, docs) {
		console.log(`UpdateAgentLocation: err:${err}, docs length:${docs && docs.length}`)
		return callback(err)
	})
}

exports.GetAgentLocation = function(username, callback){
	locationCollection.find({username: username}).toArray(function(err, docs) {
		console.log(`GetAgentLocation: err:${err}, docs length:${docs && docs.length}`)
		return callback(err, docs)
	})
}

exports.GetOrders = function(key, values, callback){
	let query = GetFindQuery(key, values)
	ordersCollection.find(query).toArray(function(err, docs) {
		console.log(`GetOrders: err:${err}, docs length:${docs.length}`)
		callback(err, docs)
	})
}

exports.AddOrders = function(order, callback){
	ordersCollection.insertOne(order, function(err, docs) {
		console.log(`AddOrders: err:${err}, docs length:${docs && (docs.length || docs)}`)
		return callback(err)
	})
}

exports.UpdateOrder = function(id, data, callback){
	var bulk = ordersCollection.initializeUnorderedBulkOp();
	let query = {}	

	for(let key in data){
		query[key] = data[key]
		bulk.find({order_id: id}).update({$set: query});		
	}
	bulk.execute();
	if(callback)
		return callback(null)
}

exports.UpdateAgent = function(username, data, callback){
	var bulk = agentsCollection.initializeUnorderedBulkOp();
	let query = {}	

	for(let key in data){
		query[key] = data[key]
		bulk.find({username: username}).update({$set: query});		
	}
	bulk.execute();
	if(callback)
		return callback(null)
}

exports.AuthenticateUser = function(username, password, role, callback){	
	let collection = customersCollection
	if(role == 'agent')
		collection = agentsCollection

	collection.find({username:username, password:password}).toArray(function(err, docs) {
		console.log(`AuthenticateUser: err:${err}, docs length:${docs && docs.length}`)
		if(err || docs.length == 0)
			return callback(false)
		return callback(true)
	})
}

function GetFindQuery(key, values){
	let query = {}
	if(key && values && key.length > 0 && values.length > 0){
		let findQuery = []
		for(let index in values){
			let obj = {}
			obj[key] = values[index]
			findQuery.push(obj)
		}
		query = {$or: findQuery}
	}
	return query
}

process.on('SIGINT', close);