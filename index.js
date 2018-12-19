/* eslint no-console: off */

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
	applyRecordTo(record, 'wedding-rsvp')
		.then(
			applyRecordTo(Object.assign(record, {
				record: record.id + timeStamp,
				RequestTime: timeStamp,
			}), 'wedding-rsvp-records')
				.then(
					success => {
						console.log('success', callback(null, {
							'statusCode': 200,
							'headers': Object.assign({}, event.headers, {
								'Access-Control-Allow-Origin': '*'
							}),
							'body': 'RSVP recorded successfully',
							'isBase64Encoded': false
						}));
					}
				)
		).catch((error) => {
			console.log(error, callback(error));
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
