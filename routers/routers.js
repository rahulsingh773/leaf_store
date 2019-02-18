var server = require('../server/handlers.js')

exports.routes = [{
	method: 'get',
	path: '/products',
	handler: server.GetProducts,
	authorization: 'user'
},
{
	method: 'post',
	path: '/products',
	handler: server.AddProducts,
	authorization: 'admin'
},
{
	method: 'get',
	path: '/agents',
	handler: server.GetAgents,
	authorization: 'admin'
},
{
	method: 'post',
	path: '/agents',
	handler: server.AddAgents,
	authorization: 'admin'
},
{
	method: 'get',
	path: '/customers',
	handler: server.GetCustomers,
	authorization: 'admin'
},
{
	method: 'post',
	path: '/customers',
	handler: server.AddCustomers,
	authorization: 'admin'
},
{
	method: 'get',
	path: '/orders',
	handler: server.GetOrders,
	authorization: 'user'
},
{
	method: 'post',
	path: '/orders',
	handler: server.AddOrders,
	authorization: 'user'
},
{
	method: 'put',
	path: '/orders/:orderID',
	handler: server.UpdateOrder,
	authorization: 'admin'
},
{
	method: 'put',
	path: '/location',
	handler: server.UpdateAgentLocation,
	authorization: 'agent'
}]