const
	AWS = require('aws-sdk'),
	ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
	const requestBody = JSON.parse(event.body);
	const timeStamp = new Date().toISOString();
	if (!requestBody.username) {
		errorResponse('No username recieved in request body', context.awsRequestId, callback);
		return;
	}
	let record = {
		id: Buffer.from(requestBody.username).toString('base64'),
		username: requestBody.username,
		email: requestBody.username,
		contactNumber: requestBody.contactNumber,
		guests: JSON.stringify(requestBody.guests),
		attendance: requestBody.attendance,
		transport: requestBody.transport,
	};
	console.log(callback);
	applyRecordTo(record, 'wedding-rsvp')
		.then(
			applyRecordTo(Object.assign(record, {
				record: record.id + timeStamp,
				RequestTime: timeStamp,
			}), 'wedding-rsvp-records')
				.then(
					callback(null, {
						statusCode: 201,
						body: {
							message: 'RSVP successfuly recorded'
						},
						headers: {
							'Access-Control-Allow-Origin': '*',
						},
					}),
					(error) => {
						console.error('error while applying record', error);
						throw error;
					}
				),
			(error) => {
				console.error('error while applying rsvp', error);
				throw error;
			}
		).catch((error) => {
			console.error(error);
			errorResponse('Maybe something went wrong?', context.awsRequestId, callback);
		});
};

function applyRecordTo(data, table) {
	return ddb.put({
		TableName: table,
		Item: data,
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
