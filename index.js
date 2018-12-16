const
	AWS = require('aws-sdk'),
	ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
	const requestBody = JSON.parse(event.body);
	if (!requestBody.username) {
		errorResponse('No username recieved in request body', context.awsRequestId, callback);
		return;
	}
	recordDetails(
		requestBody
	).then(
		// recordChange(
		// 	requestBody
		// ).then(
			callback(null, {
				statusCode: 201,
				body: {
					message: 'RSVP successfuly recorded',
					username: requestBody.username,
				},
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}),
			(error) => {throw error;}
		// ),
		// (error) => {throw error;}
	).catch((error) => {
		errorResponse(error, context.awsRequestId, callback);
	});
};

function recordDetails(data) {
	// const record = {
	// 	id: atob(data.username),
	// 	username: data.username,
	// 	email: data.username,
	// 	contactNumber: data.contactNumber,
	// 	guests: JSON.stringify(data.guests),
	// 	attendance: data.attendance,
	// 	transport: data.transport,
	// };
	return ddb.put({
		TableName: 'wedding-rsvp',
		Item: {
			id: atob(data.username),
		},
	}).promise();
}
function recordChange(data) {
	return ddb.put({
		TableName: 'wedding-rsvp-records',
		Item: {
			record: atob(data.username) + new Date().toISOString(),
			RequestTime: new Date().toISOString(),
			id: atob(data.username),
			username: data.username,
			email: data.username,
			contactNumber: data.contactNumber,
			guests: JSON.stringify(data.guests),
			attendance: data.attendance,
			transport: data.transport,
		},
	}).promise();
}

function errorResponse(errorMessage, awsRequestId, callback) {
	callback(null, {
		statusCode: 500,
		body: JSON.stringify({
			Error: errorMessage,
			Reference: awsRequestId,
		}),
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	});
}
