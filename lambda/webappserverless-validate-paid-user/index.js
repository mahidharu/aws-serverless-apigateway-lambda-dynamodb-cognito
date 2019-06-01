const querystring = require('querystring');

//TODO: Pending aws cognito integration to validate user is logged in or not
// and make sure that user is authorized to access paid content
exports.handler = async (event, context, callback) => {
    try{
        const request = event.Records[0].cf.request;
        const params = querystring.parse(request.querystring);
        if (params['userid'] != undefined){
            const userid = params['userid'];
            var isPaidUser = false;
            //TODO: This will replace with AWS cognito
			if (userid === '1'){
                isPaidUser = true;
            }
            if (isPaidUser){
             callback(null, request);
            } else {
                const msg = 'Dont have an access to view this video. userid '+params['userid']+' value';
                const response = {
                    body: msg,
                    status: '403',
                    statusDescription: msg
                };
            callback(null, response);   
            }
        } else {
            const response = {
                body:'User is not logged in',
                status: '500',
                statusDescription: 'User is not logged in'
            };
            callback(null, response);
        }
    }catch(e){
        console.error(e);
        const response = {
            body:'Sorry, something went wrong!',
            status: '500',
            statusDescription: 'Sorry, something went wrong!'
        };
        callback(null, response);
    }
};
