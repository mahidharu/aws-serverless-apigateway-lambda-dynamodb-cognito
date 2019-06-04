const AWS = require('aws-sdk'),
    dynamoDb = new AWS.DynamoDB.DocumentClient(),
	TABLE_NAME = 'wapps_videos',
    IS_CORS = true,
    CONTENT_TYPE = 'free';
const _ = require("underscore");

// load CloudFront key pair from environment variables
// Important: when storing your CloudFront private key as an environment variable string, 
// you'll need to replace all line breaks with \n, like this:
// CF_PRIVATE_KEY='-----BEGIN RSA PRIVATE KEY-----\nMIIE...1Ar\nwLW...2eL\nFOu...k2E\n-----END RSA PRIVATE KEY-----'

const cloudfrontAccessKeyId = process.env.CF_ACCESS_KEY_ID;
const cloudFrontPrivateKey = process.env.CF_PRIVATE_KEY;

const signer = new AWS.CloudFront.Signer(cloudfrontAccessKeyId, cloudFrontPrivateKey)

// 2 days as milliseconds to use for link expiration
const twoDays = 2*24*60*60*1000,
	  expiry = 30*60*1000, // 2 mins
	  cloudFrontURL = 'Update with your Cloud front urls';

//TODO: Pending aws cognito integration to validate user login
exports.handler = async (event, context, callback) => {
    if (event.httpMethod === 'OPTIONS') {
		return Promise.resolve(processResponse(IS_CORS));
	}
	let userid = '',
	    videotype = '';
	if(event.queryStringParameters && event.queryStringParameters.userid){
	    userid = event.queryStringParameters.userid;
	}
	if(event.queryStringParameters && event.queryStringParameters.videotype){
	    videotype = event.queryStringParameters.videotype;
	}
    let params = {
        TableName: TABLE_NAME,
        IndexName: "user_id-index",
        KeyConditionExpression: '#uid = :userid',
        ExpressionAttributeNames: {
        '#uid' : 'user_id'
        },
        ExpressionAttributeValues: {
            ":userid": parseInt(userid),
        }
    }
    return dynamoDb.query(params)
    .promise()
    .then(response => (processResponse(true, response.Items)))
    .catch(err => {
        console.log(err);
        return processResponse(IS_CORS, err, 500);
    });
};

async function processResponse(isCors, data, statusCode){
    const status = statusCode || (data ? 200 : 204);
    const headers = { 'Content-Type': 'application/json' };
    if (isCors) {
        Object.assign(headers, {
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,GET',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Max-Age': '86400'
        });
    }
    var results = await prepareVideoUrls(status, headers, data);
    return {
        statusCode: status,
        body: JSON.stringify(results) || '',
        headers: headers
    };
};

async function prepareVideoUrls(status, headers, videos) {
  var updatedResults=[];
  const promises = _.map(videos, video => getCloudFrontSignedURL(video, updatedResults));
  const videosUpdated = await Promise.all(promises);
  if (videosUpdated) return updatedResults;
}

/**
* Prepare cloud front signed URL's
**/
async function getCloudFrontSignedURL(video, updatedResults){
	const cfdistro = (video.type == 'paid' ? cloudFrontPaidVideos+'paidcontent' : cloudFrontFreeVideos);
	const url = cfdistro + '/' + video.url+'?userid='+(video.id == 2 ? '2' : '1');
    const params = {
    	url: url,
    	expires: Math.floor((Date.now() + expiry)/1000)
    };
    signer.getSignedUrl(params, function (err, data) {
    	if (err) { console.log(err) }
    	video.url = data;
    	updatedResults.push(video);
    });
}
