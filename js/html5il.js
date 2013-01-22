var app = angular.module('html5il',['ngResource','meetupAPIService']);

if(location.host == 'html5il.com'){
	app.constant('APP_CONFIG',{production : true, key : '2vhfkjrdi9e2lashik72u7m54h','redir_url':'http://html5il.com'})
}else{
	app.constant('APP_CONFIG',{production: false, key : 'hc9et1ihd9ec8eo843oqh11trc','redir_url':'http://html5il.org'})
}

app.config(function($routeProvider,$locationProvider){
//	$locationProvider.html5Mode(true);
	$routeProvider.
		when("/login",{templateUrl :"/partials/login.html",controller : 'LoginCtrl'}).
		when("/welcome",{
			templateUrl :"/partials/welcome.html",
			controller : 'WelcomeCtrl'
			}).
		when('/join_the_group',{templateUrl:"/partials/join.html",controller:"JoinCtrl"}).
		when('/feedback/:first_name',{templateUrl:"/partials/feedback.html",controller : 'FeedbackCtrl'}).
		otherwise('',{redirectTo : '/login'})
})


var token;
var env_settings = (window.location.host == 'html5il.com')?
		{key : '2vhfkjrdi9e2lashik72u7m54h','redir_url':'http://html5il.com'}
		:
		{key : 'hc9et1ihd9ec8eo843oqh11trc','redir_url':'http://html5il.org'};

var AppCtrl = function ($scope,$location) {
	$scope.authStatus = false;

	$scope.checkAuthWithLocation = function(){
		checkAuthorizedMode($location);
	}
	$scope.checkAuthWithLocation();
}
var LoginCtrl = function ($scope,APP_CONFIG) {
	$scope.authorize = function(){
			var auth_url = 'https://secure.meetup.com/oauth2/authorize'+
					   '?client_id=' +APP_CONFIG.key +
					   '&response_type=token'+
					   '&redirect_uri='+APP_CONFIG.redir_url;
					win = new_win(auth_url,'auth_window',400,380);
		}
}
var WelcomeCtrl = function ($scope,$rootScope,meetupAPIResource,$location,APP_CONFIG,$http) {
	$scope.enum = {
		'wait' : 'Join the waiting list!',
		'rsvp' : 'Attend this event!'
	}

	//get user details
	meetupAPIResource.getData('members',{},function(result){
		$rootScope.user = result[0];
		$rootScope.user.first_name = $rootScope.user.name.split(' ')[0];
	},true);

	//check if user in group
	meetupAPIResource.getData('profiles',{"group_id":"6218572"}, function(result){
		if(result.length == 0){
			$location.path('join_the_group');
		}
	},false);

	var events_obj = {
		"group_id":"6218572",
		"status":"upcoming",
		"page":"2",
		"order":"time",
		"desc":"false",
		"fields":"self,survey_questions"
	}

	if(!APP_CONFIG.production){
		delete events_obj.group_id;
	}
	meetupAPIResource.getData('events',events_obj, function(result){
		//filter the actions to the only we want, 'rsvp' and 'wait'
		_.each(result,function(obj){obj.self.actions = _.intersection(obj.self.actions,['rsvp','wait'])})
		$scope.future_events = result;
	},true);

	var future_events_obj = $.extend(events_obj,{"status":"past","rsvp":"yes","page":"5","desc":"true"});
	meetupAPIResource.getData('events',future_events_obj, function(result){
		console.log(result);
		$scope.events = result;
	},true);

	$scope.popup = function(){
		var url = 'https://docs.google.com/spreadsheet/embeddedform?formkey=dHU2SzRvS2dGZW1pdEdmcGktVWRNdFE6MQ&field_0='+$rootScope.user.first_name;
		win = new_win(url,'feedback_window',768,900);
	}

	$scope.sendAction = function(button,meetup_id){
		var actions = {
			"rsvp" : 'yes',
			"wait" : "waitlist"
		}
		var post_obj = {
						"action" : "rsvp",
						"rsvp":actions[button],
						"access_token":$.cookie('auth'),
						"event_id":meetup_id,
						};
				meetupAPIResource.$save(post_obj,function(result){
					console.log('joined succesfully!!',result);
					if(result.rsvp_id){
						var event = _.where($scope.future_events, {id:result.event.id});
						event[0].self.rsvp = {
							"response" : result.response
						}
//						$scope.$apply();
					}
				},function(result,$location){
					console.log('was an error!',result);
					var answer  = confirm('There was an API error! \n\n\n Click \'OK\' to complete the action on meetup.com');
					if(answer){
						window.location = 'http://www.meetup.com/HTML5-IL/events/99494632/';
					}
				})
	}


	$scope.long_desc = false;
	$scope.showLongDesc = function(description){
		$scope.long_desc = true;
		$('#anim').addClass('fadeInLeftBig');
		$('#anim .cont').html(description);
		$('#anim .btn').on('click',function(){
			$('#anim').addClass('fadeOutRightBig');
			window.setTimeout(function(){
				$('#anim').removeClass('fadeInLeftBig fadeOutRightBig');
				$('#anim .cont').html('');
			},1100)
		})
	}
}

var JoinCtrl = function ($scope, $http, meetupAPIResource,$location) {
	$scope.group_urlname = 'HTML5-IL';
	$scope.group_id = '6218572';
	$scope.$location = $location;
	$scope.join = function($event){
		$event.preventDefault();

		var post_obj = {"action":"profile",
						"group_id":$scope.group_id,
						"group_urlname":$scope.group_urlname,
						"intro":"joined through the html5il.com site"};
		meetupAPIResource.$save(post_obj,function(result){
			if(result.status == 'active'){
				alert('congrats! you\'ve successfully joined our group!!');
				$scope.redirect('welcome');
			}
		},function(result,$location){
			console.log('was an error!',result);
			if(result.member_exists){
				$scope.redirect('welcome');
			}else{
				var answer  = confirm('There was an API error! \n\n\n Click \'OK\' to complete the action on meetup.com');
				if(answer){
					location = 'http://www.meetup.com/HTML5-IL/join/';
				}
			}
			//no "post" allowed, redirect user to meetup.com
//			window.open('http://meetup.com/HTML5-IL','_blank');
//			window.location = 'http://meetup.com/HTML5-IL';
		})
		return false;
	}
	$scope.redirect = function(path){
		$location.path(path)
	}
}

var FeedbackCtrl = function ($scope, meetupAPIResource) {
	meetupAPIResource.getData('members',{},function(result){
		$scope.user = result[0];
		$scope.user.first_name = $scope.user.name.split(' ')[0];
	},true);
};
var checkAuthorizedMode = function($location){
	var cookie = $.cookie('auth');
	if(cookie != null){
		console.log('cookies exists');
		$location.path('welcome');
	}else{
		$location.path('login');
		console.log('cookies no!');
	}
}


/*
* Helper functions
*/

/*
	opens a new window for oauth call
 */
var new_win = function(mypage, myname, w, h, scroll, pos) {
	leftPos = (screen.availWidth) ? (screen.availWidth - w) / 2 : 50;
	topPos = (screen.availHeight) ? (screen.availHeight - h) / 2 : 50;
	settings = 'width=' + w + ',height=' + h + ',top=' + topPos + ',left=' + leftPos + ',scrollbars=' + scroll + ',location=no,directories=no,status=no,menubar=no,toolbar=no,resizable=no';
	var something = window.open(mypage, myname, settings);
	return something;
}
/*
	called by opened window, to pass down the hash
 */
var auth = function(hash){
	parsed_hash = $.parseParams(hash);
	setToken(parsed_hash.access_token,parsed_hash.expires_in);

	var scope = $('#main').scope();
		scope.$apply(function() {
			scope.checkAuthWithLocation();
	    });
	if(win){
		win.close();
	}
}

/*
	set the token inside cookie
 */
var setToken = function(t,expires){
	token = t;
	//set the cookie if expires is passed
	if(expires){
		var currentDate = new Date();
		currentDate.setHours(currentDate.getHours() + expires/60/60);
		$.cookie('auth', t, { expires: currentDate, path: '/' });
	}
}