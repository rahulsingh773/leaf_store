exports.products = {
	id: 'string',
	name: 'string',
	category: 'string',
	available_units: 'int',
	sold_units: 'int',
	stars_count: 'int',
	reviews_count: 'int',
	price: 'double'
}

exports.requiredProductParams = ['name', 'category', 'price', 'available_units']

exports.agents = {
	name: 'string',
	age: 'int',
	phone: 'string',
	email: 'string',
	username: 'string',
	password: 'string',
	available: 'boolean'
}

exports.requiredAgentParams = ['name', 'age', 'phone', 'email', 'username', 'password']

exports.customers = {
	name: 'string',
	email: 'string',
	username: 'string',
	password: 'string',
	address: 'string'
}

exports.requiredCustomerParams = ['name', 'email', 'username', 'password', 'address']

exports.location = {
	username: 'string',
	latitude: 'double',
	longitude: 'double'
}

exports.requiredLocationParams = ['username', 'latitude', 'longitude']

exports.orders = {
	order_id: 'string',
	products: 'array',
	username: 'string',
	agent_username: 'string',
	date_created: 'string',
	delivery_date: 'string',
	status: 'string',
	location: 'object'
}
