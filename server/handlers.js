const db = require("../dblayer/db.js")
const model = require("../models/model.js")
const moment = require("moment")
const format = 'DD-MM-YYYY, HH:mm:ss'

exports.GetProducts = function(req, res){
	db.GetProducts(null, null, function(err, docs){
		if(err){
			res.status(500)
			return res.send('internal server error')
		}
		docs = FormatResponse(docs, model.products, null)
		return res.send(docs)
	})
}

exports.AddProducts = function(req, res){
	let body = req.body
	if(typeof body != 'object' || !Array.isArray(body)){
		res.status(400)
		return res.send('Request body should be a JSON Array')
	}
	let requestData = ValidateRequest(body, model.products, model.requiredProductParams)
	let validDocs = requestData.valid
	let invalidDocs = requestData.invalid
	
	validDocs = FormatRequest(validDocs, model.products, model.requiredProductParams, 'id')
	
	db.AddProducts(validDocs, function(failedRecords, successRecords){
		let response = FormatResponse(successRecords, model.products, null).concat(invalidDocs).concat(FormatFailedResponse(failedRecords, model.products))
		return res.send(response)
	})
}

exports.GetAgents = function(req, res){
	db.GetAgents(function(err, docs){
		if(err){
			res.status(500)
			return res.send('internal server error')
		}
		docs = FormatResponse(docs, model.agents, ['password'])
		return res.send(docs)
	})
}

exports.AddAgents = function(req, res){
	let body = req.body
	if(typeof body != 'object' || !Array.isArray(body)){
		res.status(400)
		return res.send('Request body should be a JSON Array')
	}

	let requestData = ValidateRequest(body, model.agents, model.requiredAgentParams)
	let validDocs = requestData.valid
	let invalidDocs = requestData.invalid
	
	validDocs = FormatRequest(validDocs, model.agents, model.requiredAgentParams, null)
	
	db.AddAgents(validDocs, function(failedRecords, successRecords){
		let response = FormatResponse(successRecords, model.agents, ['password']).concat(invalidDocs).concat(FormatFailedResponse(failedRecords, model.agents))
		return res.send(response)
	})
}

exports.GetCustomers = function(req, res){
	db.GetCustomers(function(err, docs){
		if(err){
			res.status(500)
			return res.send('internal server error')
		}
		docs = FormatResponse(docs, model.customers, ['password'])
		return res.send(docs)
	})
}

exports.AddCustomers = function(req, res){
	let body = req.body
	if(typeof body != 'object' || !Array.isArray(body)){
		res.status(400)
		return res.send('Request body should be a JSON Array')
	}

	let requestData = ValidateRequest(body, model.customers, model.requiredCustomerParams)
	let validDocs = requestData.valid
	let invalidDocs = requestData.invalid
	
	validDocs = FormatRequest(validDocs, model.customers, model.requiredCustomerParams, null)
	
	db.AddCustomers(validDocs, function(failedRecords, successRecords){
		let response = FormatResponse(successRecords, model.customers, ['password']).concat(invalidDocs).concat(FormatFailedResponse(failedRecords, model.customers))
		return res.send(response)
	})
}

exports.UpdateAgentLocation = function(req, res){
	let body = req.body
	if(typeof body != 'object' || Array.isArray(body)){
		res.status(400)
		return res.send('Request body should be JSON object')
	}

	body.username = req.username
	let requestData = ValidateRequest([body], model.location, model.requiredLocationParams)
	let validDocs = requestData.valid
	let invalidDocs = requestData.invalid

	if(invalidDocs.length > 0){
		res.status(400)
		return res.send(invalidDocs[0])
	}
	db.UpdateAgentLocation(validDocs[0], function(err){
		if(err){
			res.status(500)
			res.send({status: 500, error: err})
		}
		res.send(validDocs[0])
		db.GetOrders('agent', [body.username], function(err, docs){
			if(err || docs.length <= 0)
				return
			let location = docs[0]
			delete location.username
			delete location._id

			let obj = {
				location: location
			}
			let order_id = docs[0].order_id
			db.UpdateOrder(order_id, location, function(err, docs){
				return
			})
		})
	})
}

exports.GetOrders = function(req, res){
	let username = req.username	
	let role = req.role	

	db.GetOrders('username',[username], function(err, docs){
		if(err){
			res.status(500)
			return res.send('internal server error')
		}
		docs = FormatResponse(docs, model.orders, null)
		return res.send(docs)
	})
}

exports.AddOrders = function(req, res){
	let username = req.username	
	let role = req.role
	let body = req.body
	if(typeof body != 'object' || !Array.isArray(body) || body.length <= 0){
		res.status(400)
		return res.send('Request body should be a Array with more than one item')
	}

	let date = moment().format('DD-MM-YYYY, HH:mm:ss')
	let deliveryDate = moment(date, format).add(2, 'days').format(format)

	let order = {
		order_id: GetRandomID(12),
		products: body,
		username: username,
		agent_username: null,
		date_created: date,
		delivery_date: deliveryDate,
		status: 'processing',
		location: null
	}

	db.GetProducts('id', body, function(err, docs){
		if(err){
			res.status(500)
			return res.send('internal server error')
		}

		let invalidProducts = [], validProducts = {}
		for(let index in docs){
			validProducts[docs[index].id] = docs[index]
		}
		for(let index in order.products){
			let id = order.products[index]
			if(!validProducts[id]){
				let obj = {
					status: 404,
					error: 'invalid product id',
					payload: {
						products: [id]
					}
				}
				invalidProducts.push(obj)
				continue
			}
			if(validProducts[id].available_units <= 0){
				let obj = {
					status: 404,
					error: 'product out of stock',
					payload: {
						products: [id]
					}
				}
				delete validProducts[id]
				invalidProducts.push(obj)
			}
		}
		order.products = []
		for(let id in validProducts){
			order.products.push(id)
		}

		if(order.products.length <= 0)
			return res.send(FormatFailedResponse(invalidProducts))

		db.AddOrders(order, function(err){
			if(err){
				var response = FormatFailedResponse([{
					status: 500,
					error: err,
					payload: order
				}], model.orders)
			}else{
				var response = FormatResponse([order], model.orders, null)
				let updateProductsData = []
				for(let index in order.products){
					let id = order.products[index]
					let obj = {
						id: id,
						available_units: validProducts[id].available_units - 1,
						sold_units: validProducts[id].sold_units + 1
					}
					updateProductsData.push(obj)
				}
				db.UpdateProducts(updateProductsData)
				AssignAgent(order)
			}
			response = response.concat(invalidProducts)
			res.send(response)
		})
	})
}

exports.UpdateOrder = function(req, res){
	let body = req.body
	if(typeof body != 'object' || Array.isArray(body) || !body.status){
		res.status(400)
		return res.send('Request body should be a JSON Object containing status')
	}
	let order_id = req.params.orderID
	let status = body.status
	let obj = {
		status: status
	}
	if(status == 'completed' || status == 'cancelled'){
		obj.agent_username = null
		obj.location = null
		
		db.GetOrders('order_id',[order_id], function(err, docs){
			if(err || docs.length <= 0)
				return res.send('ok')
			db.UpdateAgent(docs[0].agent_username, {available: true}, function(err, docs){
				db.UpdateOrder(order_id, obj, function(err, docs){
					res.send('ok')
				})
			})
		})
	}else{
		db.UpdateOrder(order_id, obj, function(err, docs){
			res.send('ok')
		})
	}
}

function AssignAgent(order){
	db.GetAgents('available',[true], function(err, docs){
		if(err || docs.length <= 0)
			return
		let agent = docs[0]
		db.GetAgentLocation(agent.username, function(err, docs){
			let location = {}
			if(!err && docs.length>0){
				location = docs[0]
				delete location.username
				delete location._id
			}

			let obj = {
				agent_username: agent.username,
				location: location
			}
			db.UpdateOrder(order.order_id, obj, function(err, docs){
				return
			})
			db.UpdateAgent(agent.username, {available: false}, function(err, docs){
				return
			})
		})
	})
}

function FormatResponse(docs, model, maskKeys){
	let response = []
	for(let index in docs){
		let obj = {}
		let doc = docs[index]

		for(let key in model){
			let value = doc[key]
			if(!value)
				value = GetDefaultValues(model[key])
			obj[key] = value
			if(maskKeys && maskKeys.includes(key))
				obj[key] = 'xxxxxxx'
		}
		response.push(obj)
	}
	return response
}

function FormatFailedResponse(docs, model){
	let response = []
	for(let index in docs){
		let doc = docs[index]
		doc.payload = FormatResponse([doc.payload], model, null)[0]
		response.push(doc)
	}
	return response
}

function FormatRequest(docs, model, params, randomIDKey){
	let request = []
	for(let index in docs){
		let obj = {}
		let doc = docs[index]

		for(let key in model){
			var value
			let pickFromRequest = params.includes(key)
			if(pickFromRequest)
				value = doc[key]
			if(!pickFromRequest || !value)
				value = GetDefaultValues(model[key])
			obj[key] = value
		}
		if(randomIDKey)
			obj[randomIDKey] = GetRandomID(12)
		request.push(obj)
	}
	return request
}

function ValidateRequest(docs, model, requiredParams){
	let validDocs = [], invalidDocs = []

	for(let index in docs){
		let doc = docs[index]
		let valid = true, notFoundkey = null

		for(let index in requiredParams){
			var key = requiredParams[index]
			var value = doc[key]
			
			if(value == null || value.length <= 0){
				notFoundkey = key 
				valid = false
				break
			}
		}
		if(valid)
			validDocs.push(doc)
		else{
			invalidDocs.push({
				code: 400,
				error: notFoundkey + ' is required',
				payload: doc
			})
		}
	}
	return {valid:validDocs, invalid:invalidDocs}
}

function GetDefaultValues(type){
	let values = {
		int: 0,
		string: '',
		double: 0.0,
		boolean: true,
		object: {},
		array: []
	}

	return values[type]
}

function GetRandomID(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}
