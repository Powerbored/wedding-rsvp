/* eslint no-console: off */

const
	AWS = require('aws-sdk'),
	ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
	const requestBody = JSON.parse(event.body);
	const timeStamp = new Date().toISOString();
	if (!requestBody.username) {
		callback(null, responseObject(500, event.headers, JSON.stringify({
			Error: 'No username recieved in request body',
			Reference: context.awsRequestId,
		})));
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
		recovery: requestBody.recovery,
	};
	applyRecordTo(record, 'wedding-rsvp')
		.then(
			applyRecordTo(Object.assign(record, {
				record: record.id + timeStamp,
				RequestTime: timeStamp,
			}), 'wedding-rsvp-records')
				.then(
					success => {
						console.log('success', success);
						callback(null, responseObject(200, event.headers, JSON.stringify({
							message: 'RSVP recorded successfully'
						})));
					}
				)
		).catch((error) => {
			console.error('error', error);
			callback(null, responseObject(500, event.headers, JSON.stringify({
				Error: error,
				Reference: context.awsRequestId,
			})));
		});
};

function applyRecordTo(data, table) {
	return ddb.put({
		TableName: table,
		Item: data,
	}).promise();
}

function responseObject(code, headers, body) {
	return {
		statusCode: code,
		headers: Object.assign({}, headers, {
			'Access-Control-Allow-Origin': '*'
		}),
		body: body,
		isBase64Encoded: false
	};
}
