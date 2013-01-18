angular.module('meetupAPIService',['ngResource']).
	factory('meetupAPIResource',function($resource,$location){
		var cache = {};
		var url = 'https://api.meetup.com/2/';
		var token = $.cookie('auth');
		var meetupAPIResource = $resource(url + ':action',
			{
				action : 'members',
				member_id:'self',
				callback : 'JSON_CALLBACK',
				access_token :$.cookie('auth')
			},
			{get:{method : 'JSONP',isArray: false}}
		)

		meetupAPIResource.prototype.getData = function(action,data,callback,cacheble){
			if(cacheble && cache[action + JSON.stringify(data)]){
				callback(cache[action + JSON.stringify(data)]);
			}else {
				return meetupAPIResource.get($.extend({'action':action}, data), function (result) {
					if (result.problem) {
						console.log('there was an authentication error, reseting');
						if ($location.path() != '/login') {
							$.removeCookie('auth');
							checkAuthorizedMode($location);
						}

					} else {
						if(cacheble){
							cache[action + JSON.stringify(data)] = result.results;
						}
						callback(result.results);
					}
				});
			}

		}

		return new meetupAPIResource;
	})