const
	randomBytes = require('crypto').randomBytes,
	AWS = require('aws-sdk'),
	ddb = new AWS.DynamoDB.DocumentClient();

const fleet = [
	{
		Name: 'Bucephalus',
		Color: 'Golden',
		Gender: 'Male',
	}, {
		Name: 'Shadowfax',
		Color: 'White',
		Gender: 'Male',
	}, {
		Name: 'Rocinante',
		Color: 'Yellow',
		Gender: 'Female',
	},
];

exports.handler = (event, context, callback) => {
	const
		requestBody = JSON.parse(event.body),
		unicorn = findUnicorn({
			Longitude: Math.random() * 10,
			Latitude: Math.random() * 20
		})
	;
	if (!requestBody.id) {
		errorResponse('No ID recieved in request body', context.awsRequestId, callback);
		return;
	}
	recordDetails(
		requestBody.id, 'test', unicorn
	).then(
		recordChange(
			requestBody.id, 'test', unicorn
		).then(
			callback(null, {
				statusCode: 201,
				body: JSON.stringify(
					event,
					unicorn
				),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}),
			() => {
				throw new Error('unable to create change record');
			}
		),
		() => {
			throw new Error('unable to record rsvp');
		}
	).catch((error) => {
		console.error(error);
		errorResponse(error.message, context.awsRequestId, callback);
	});
	// if (!event.requestContext.authorizer) {
	// 	errorResponse('Authorization may not be configured', context.awsRequestId, callback);
	// 	return;
	// }

	// Because we're using a Cognito User Pools authorizer, all of the claims
	// included in the authentication token are provided in the request context.
	// This includes the username as well as other attributes.

	// The body field of the event in a proxy integration is a raw string.
	// In order to extract meaningful values, we need to first parse this string
	// into an object. A more robust implementation might inspect the Content-Type
	// header first and use a different parsing strategy based on that value.
/*
	const
		rideId = toUrlString(randomBytes(16)),
		username = 'test', //event.requestContext.authorizer.claims['cognito:username'],
		requestBody = JSON.parse(event.body),
		pickupLocation = requestBody.PickupLocation,
		id = requestBody.id,
		unicorn = findUnicorn(pickupLocation);

	console.log('Received event (', rideId, '): ', event);

	recordRide(id, username, unicorn).then(() => {
		// You can use the callback function to provide a return value from your Node.js
		// Lambda functions. The first parameter is used for failed invocations. The
		// second parameter specifies the result data of the invocation.

		// Because this Lambda function is called by an API Gateway proxy integration
		// the result object must use the following structure.
		callback(null, {
			statusCode: 201,
			body: JSON.stringify({
				id: id,
				Unicorn: unicorn,
				UnicornName: unicorn.Name,
				Eta: '30 seconds',
				Rider: username,
			}),
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		});
	}).catch((err) => {
		console.error(err);

		// If there is an error during processing, catch it and return
		// from the Lambda function successfully. Specify a 500 HTTP status
		// code and provide an error message in the body. This will provide a
		// more meaningful error response to the end client.
		errorResponse(err.message, context.awsRequestId, callback);
	});
*/
};

function findUnicorn(pickupLocation) {
	console.log('Finding unicorn for ', pickupLocation.Latitude, ', ', pickupLocation.Longitude);
	return fleet[Math.floor(Math.random() * fleet.length)];
}

function recordDetails(id, username, unicorn) {
	return ddb.put({
		TableName: 'wedding-rsvp',
		Item: {
			id,
			User: username,
			Unicorn: unicorn,
			UnicornName: unicorn.Name,
			RequestTime: new Date().toISOString(),
		},
	}).promise();
}
function recordChange(id, username, unicorn) {
	return ddb.put({
		TableName: 'wedding-rsvp-records',
		Item: {
			record: id + new Date().toISOString(),
			id,
			User: username,
			Unicorn: unicorn,
			UnicornName: unicorn.Name,
			RequestTime: new Date().toISOString(),
		},
	}).promise();
}

function toUrlString(buffer) {
	return buffer.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
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
